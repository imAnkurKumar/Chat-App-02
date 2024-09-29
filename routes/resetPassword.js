const express = require("express");
const router = express.Router();

const resetPasswordController = require("../controllers/resetPassword");
router.use(express.static("public"));

router.post("/forgotpassword", resetPasswordController.sendEmail);
router.get(
  "/resetPasswordPage/:requestId",
  resetPasswordController.resetPasswordPage
);
router.post("/resetPassword", resetPasswordController.updatePassword);
module.exports = router;
