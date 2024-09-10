const User = require("../models/user");
const path = require("path");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { Op } = require("sequelize");

function generateAccessToken(id, email) {
  return jwt.sign({ id, email }, process.env.JWT_SECRET);
}

const getSignUpPage = (req, res, next) => {
  res.sendFile(path.join(__dirname, "../views", "signUp.html"));
};

const getLoginPage = (req, res, next) => {
  res.sendFile(path.join(__dirname, "../views", "login.html"));
};

const signUp = async (req, res, next) => {
  try {
    const { name, email, phone, password } = req.body;

    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ message: "Email is already in use" });
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = await User.create({
      name,
      email,
      phoneNumber: phone,
      password: hashedPassword,
    });

    res
      .status(201)
      .json({ message: "User created successfully", user: newUser });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(404).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = generateAccessToken(user.id, user.email);
    res.status(200).json({ message: "Login successful", token });
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: "Server error" });
  }
};

const getAllUsers = async (req, res, next) => {
  try {
    const users = await User.findAll({
      where: {
        id: { [Op.ne]: req.user.id },
      },

      attributes: ["name"],
    });
    res.status(200).json({ users });
  } catch (err) {
    console.log(err);
  }
};

module.exports = { getSignUpPage, getLoginPage, signUp, login, getAllUsers };
