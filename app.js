const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv");
dotenv.config();
const path = require("path");
const sequelize = require("./utils/database");
const cors = require("cors");
const PORT = process.env.PORT || 3000;

const userRouter = require("./routes/user");
const chatRouter = require("./routes/chat");
const resetPasswordRouter = require("./routes/resetPassword");
const socketController = require("./controllers/socket");

const Message = require("./models/message");
const User = require("./models/user");
const Group = require("./models/group");
const UserGroup = require("./models/userGroup");
const ResetPassword = require("./models/resetPassword");

const job = require("./jobs/cron");

const app = express();
const server = http.createServer(app);
const io = new Server(server);

socketController(io);

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
app.use("/password", resetPasswordRouter);

// Model Relationships
Message.belongsTo(User);
Message.belongsTo(Group);

User.belongsToMany(Group, { through: UserGroup });
Group.belongsToMany(User, { through: UserGroup });

Group.hasMany(Message);
User.hasMany(Message);

UserGroup.belongsTo(User);
UserGroup.belongsTo(Group);

User.hasMany(ResetPassword);
ResetPassword.belongsTo(User);

job.start();

sequelize
  .sync()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((err) => console.log(err));
