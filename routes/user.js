const express = require("express");
const router = express.Router();

const userController = require("../controllers/user");
const userAuthentication = require("../middlewares/auth");
router.get("/", userController.getSignUpPage);
router.post("/signUp", userController.signUp);
router.get("/login", userController.getLoginPage);
router.post("/login", userController.login);
router.get("/allUsers", userAuthentication, userController.getAllUsers);
module.exports = router;
