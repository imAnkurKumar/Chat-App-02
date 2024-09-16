const Message = require("../models/message");

module.exports = (io) => {
  io.on("connection", (socket) => {
    console.log("A user connected");

    // Handle joining a group
    socket.on("joinGroup", (groupId) => {
      socket.join(groupId);
      console.log(`User joined group: ${groupId}`);
    });

    // Handle sending a message
    socket.on("sendMessage", async (messageData) => {
      const { groupId, message } = messageData;
      try {
        const newMessage = await Message.create({
          content: message.content,
          name: message.name,
          groupId: groupId,
          userId: message.userId,
        });

        // Broadcast the message to all users in the group
        io.to(groupId).emit("receiveMessage", {
          id: newMessage.id,
          content: newMessage.content,
          name: newMessage.name,
          createdAt: newMessage.createdAt,
        });
      } catch (error) {
        console.error("Error saving message:", error);
      }
    });

    // Handle user disconnect
    socket.on("disconnect", () => {
      console.log("A user disconnected");
    });
  });
};
