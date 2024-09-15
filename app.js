const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv");
dotenv.config();
const path = require("path");
const sequelize = require("./utils/database");
const cors = require("cors");
const PORT = process.env.PORT || 4000;

const userRouter = require("./routes/user");
const chatRouter = require("./routes/chat");
const Message = require("./models/message");
const User = require("./models/user");
const Group = require("./models/group");
const UserGroup = require("./models/userGroup");

const app = express();
const server = http.createServer(app);
const io = new Server(server);
app.set("io", io);
app.use(
  cors({
    origin: "*",
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.static(path.join(__dirname, "views")));

// Routes
app.use("/", userRouter);
app.use("/user", userRouter);
app.use("/chat", chatRouter);

// Model Relationships
Message.belongsTo(User); // A message belongs to a user
Message.belongsTo(Group); // A message belongs to a group

User.belongsToMany(Group, { through: UserGroup }); // A user can belong to many groups
Group.belongsToMany(User, { through: UserGroup }); // A group can have many users

Group.hasMany(Message); // A group can have many messages
User.hasMany(Message); // A user can send many messages

UserGroup.belongsTo(User); // A UserGroup belongs to a user
UserGroup.belongsTo(Group); // A UserGroup belongs to a group

sequelize
  .sync()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => console.log(err));

io.on("connection", (socket) => {
  console.log("A user connected");

  socket.on("joinGroup", (groupId) => {
    socket.join(groupId);
    console.log(`User joined group: ${groupId}`);
  });

  socket.on("sendMessage", async (messageData) => {
    const { groupId, message } = messageData;
    try {
      const newMessage = await Message.create({
        content: message.content,
        name: message.name,
        groupId: groupId,
        userId: message.userId,
      });

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

  socket.on("disconnect", () => {
    console.log("A userdisconnected");
  });
});
