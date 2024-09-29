document.addEventListener("DOMContentLoaded", async () => {
  const resetPasswordForm = document.getElementById("reset-password-form");

  resetPasswordForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
      const email = document.getElementById("email").value;
      const newPassword = document.getElementById("new-password").value;

      const confirmPassword = document.getElementById("confirm-password").value;

      if (newPassword !== confirmPassword) {
        document.getElementById("new-password").value = "";
        document.getElementById("confirm-password").value = "";

        alert("New password and confirm password do not match");
        return;
      }
      const res = await axios.post("/password/resetPassword", {
        password: newPassword,
      });
      alert(res.data.message);
      window.location.href = "/login.html";
    } catch (err) {
      alert("Error: " + err.message);
      console.log(err);
    }
  });
});
