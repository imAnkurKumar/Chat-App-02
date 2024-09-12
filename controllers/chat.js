const Group = require("../models/group");
const UserGroup = require("../models/userGroup");
const Message = require("../models/message");
const User = require("../models/user");

// Create a new group
const createGroup = async (req, res) => {
  const { name } = req.body;
  const { id: userId, name: admin } = req.user;

  try {
    // Check if the group already exists
    const existingGroup = await Group.findOne({ where: { name } });
    if (existingGroup) {
      return res.status(400).json({ message: "Group already exists" });
    }

    // Create a new group and add the creator as an admin
    const group = await Group.create({ name, admin });
    await UserGroup.create({ userId, groupId: group.id, isadmin: true });

    return res
      .status(201)
      .json({ message: "Group Created Successfully", group });
  } catch (err) {
    console.error("Error creating group:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

// Get all groups the user is part of
const getGroups = async (req, res) => {
  const { id: userId } = req.user;

  try {
    const userGroups = await UserGroup.findAll({
      where: { userId },
      include: { model: Group },
    });

    const groups = userGroups.map((ug) => ug.group);
    return res.status(200).json({ groups });
  } catch (err) {
    console.error("Error fetching groups:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

// Add a user to a group
const addUserToGroup = async (req, res) => {
  const { groupId } = req.params;
  const { userEmail } = req.body;
  const { id: userId } = req.user;

  try {
    // Verify the group and admin status
    const group = await Group.findByPk(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    const userGroup = await UserGroup.findOne({
      where: { userId, groupId, isadmin: true },
    });
    if (!userGroup)
      return res
        .status(403)
        .json({ message: "Only admins can add users to the group" });

    // Find and add the user to the group
    const user = await User.findOne({ where: { email: userEmail } });
    if (!user) return res.status(404).json({ message: "User not found" });

    const existingUserGroup = await UserGroup.findOne({
      where: { userId: user.id, groupId },
    });
    if (existingUserGroup)
      return res
        .status(400)
        .json({ message: "User is already a member of this group" });

    await UserGroup.create({ userId: user.id, groupId, isadmin: false });

    return res.status(201).json({ message: "User added to the group" });
  } catch (err) {
    console.error("Error adding user to group:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

// Send a message in a group
const sendMessage = async (req, res) => {
  const { groupId } = req.params;
  const { content } = req.body;
  const { id: userId, name } = req.user;

  try {
    // Verify the user is part of the group
    const userGroup = await UserGroup.findOne({ where: { userId, groupId } });
    if (!userGroup)
      return res
        .status(403)
        .json({ message: "You are not a member of this group" });

    // Create and return the message
    const message = await Message.create({ name, content, groupId, userId });
    return res
      .status(201)
      .json({ message: "Message sent successfully", message });
  } catch (err) {
    console.error("Error sending message:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

// Get all messages for a specific group
const getGroupMessages = async (req, res) => {
  const { groupId } = req.params;
  const { id: userId } = req.user;

  try {
    // Verify the user is part of the group
    const userGroup = await UserGroup.findOne({ where: { userId, groupId } });
    if (!userGroup)
      return res
        .status(403)
        .json({ message: "You are not a member of this group" });

    // Fetch and return the group's messages
    const messages = await Message.findAll({ where: { groupId } });
    return res.status(200).json({ messages });
  } catch (err) {
    console.error("Error fetching group messages:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

// Get all members of a specific group
const getGroupMembers = async (req, res) => {
  const { groupId } = req.params;
  const { id: userId } = req.user;

  try {
    // Verify the user is part of the group
    const userGroup = await UserGroup.findOne({ where: { userId, groupId } });
    if (!userGroup) {
      return res
        .status(403)
        .json({ message: "You are not a member of this group" });
    }

    // Fetch all users in the group
    const members = await UserGroup.findAll({
      where: { groupId },
      include: {
        model: User,
        attributes: ["name"], // Only return the user's name for now
      },
    });

    // Extract member names from the result
    const groupMembers = members.map((member) => ({
      id: member.userId,
      name: member.user.name,
    }));

    return res.status(200).json({ members: groupMembers });
  } catch (err) {
    console.error("Error fetching group members:", err);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const removeUserFromGroup = async (req, res) => {
  const { groupId, userId } = req.params;
  const { id: adminUserId } = req.user;

  try {
    // Check if the group exists
    const group = await Group.findByPk(groupId);
    if (!group) return res.status(404).json({ message: "Group not found" });

    // Check if the requesting user is an admin
    const adminUserGroup = await UserGroup.findOne({
      where: { userId: adminUserId, groupId, isadmin: true },
    });
    if (!adminUserGroup)
      return res
        .status(403)
        .json({ message: "Only admins can remove users from the group" });

    // Check if the user to be removed is part of the group
    const userGroup = await UserGroup.findOne({
      where: { userId, groupId },
    });
    if (!userGroup)
      return res
        .status(404)
        .json({ message: "User is not a member of this group" });

    // Remove the user from the group
    await UserGroup.destroy({ where: { userId, groupId } });

    return res.status(200).json({ message: "User removed from the group" });
  } catch (err) {
    console.error("Error removing user from group:", err);
    return res.status(500).json({ message: "Server Error" });
  }
};

module.exports = {
  createGroup,
  getGroupMembers,
  getGroupMessages,
  getGroups,
  removeUserFromGroup,
  addUserToGroup,
  sendMessage,
};
