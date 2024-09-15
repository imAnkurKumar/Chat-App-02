const express = require("express");
const router = express.Router();
const chatController = require("../controllers/chat");
const userAuthentication = require("../middlewares/auth");
const upload = require("../middlewares/multer");

// POST /api/groups - Create a new group
router.post("/groups", userAuthentication, chatController.createGroup);

// GET /api/groups - Get all groups for the user
router.get("/groups", userAuthentication, chatController.getGroups);

// POST /api/groups/:groupId/messages - Send a message to a specific group
router.post(
  "/groups/:groupId/messages",
  userAuthentication,
  chatController.sendMessage
);

// GET /api/groups/:groupId/messages - Get all messages for a specific group
router.get(
  "/groups/:groupId/messages",
  userAuthentication,
  chatController.getGroupMessages
);

router.post(
  "/groups/:groupId/add-user",
  userAuthentication,
  chatController.addUserToGroup
);

router.get(
  "/groups/:groupId/members",
  userAuthentication,
  chatController.getGroupMembers
);
router.delete(
  "/groups/:groupId/remove-user/:userId",
  userAuthentication,
  chatController.removeUserFromGroup
);

router.post(
  "/groups/:groupId/make-admin",
  userAuthentication,
  chatController.makeUserAdmin
);
router.post(
  "/upload-file",
  userAuthentication,
  upload.single("fileData"),
  chatController.uploadMltimedia
);
module.exports = router;
