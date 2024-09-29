const Sib = require("sib-api-v3-sdk");
const path = require("path");
const User = require("../models/user");
const ResetPassword = require("../models/resetPassword");
const bcrypt = require("bcrypt");
const { v4: uuidv4 } = require("uuid");

const saltRounds = 10;

const hashPassword = async (password) => {
  return await bcrypt.hash(password, saltRounds);
};

const sendEmail = async (req, res) => {
  try {
    const email = req.body.email;
    const requestId = uuidv4();

    const recepientEmail = await User.findOne({ where: { email: email } });
    if (!recepientEmail) {
      return res.status(500).json({ message: "User not found" });
    }

    const resetRequest = await ResetPassword.create({
      id: requestId,
      active: true,
      userId: recepientEmail.dataValues.id,
    });
    const client = Sib.ApiClient.instance;
    const apikey = client.authentications["api-key"];
    apikey.apiKey = process.env.SIB_APIKEY;
    const transEmailApi = new Sib.TransactionalEmailsApi();
    const sender = {
      email: "imankur.ak@gmail.com",
      name: "Ankur",
    };
    const receivers = [{ email: email }];
    const emailResponse = await transEmailApi.sendTransacEmail({
      sender,
      To: receivers,
      subject: "Reset Your Password",
      textContent: "Link Below",
      htmlContent: `<h3>Hi! We got the request from you for reset the password. Here is the link below >>></h3>
      <a href="http://localhost:4000/password/resetPasswordPage/{{params.requestId}}"> Click Here</a>`,
      params: {
        requestId: requestId,
      },
    });

    return res.status(200).json({
      message:
        "Link for reset the password is successfully send on your Mail Id!",
    });
  } catch (err) {
    console.log(err);
  }
};
const resetPasswordPage = async (req, res) => {
  try {
    res
      .status(200)
      .sendFile(path.join(__dirname, "../", "views", "resetPassword.html"));
  } catch (error) {
    console.log(error);
  }
};
const updatePassword = async (req, res) => {
  try {
    const requestId = req.headers.referer.split("/");
    const password = req.body.password;

    const checkResetRequest = await ResetPassword.findAll({
      where: { id: requestId[requestId.length - 1], active: true },
    });
    if (checkResetRequest[0]) {
      const userId = checkResetRequest[0].dataValues.userId;
      const result = await ResetPassword.update(
        { active: false },
        { where: { id: requestId } }
      );
      const newPassword = await hashPassword(password);

      const user = await User.update(
        {
          password: newPassword,
        },
        { where: { id: userId } }
      );
      return res
        .status(200)
        .json({ message: "Successfully changed password!" });
    } else {
      return res
        .status(409)
        .json({ message: "Link is already Used Once, Request for new Link!" });
    }
  } catch (error) {
    console.log(error);
    return res.status(409).json({ message: "Failed to change password!" });
  }
};
module.exports = { sendEmail, resetPasswordPage, updatePassword };
