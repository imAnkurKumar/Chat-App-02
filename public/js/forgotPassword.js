document.addEventListener("DOMContentLoaded", () => {
  const resetPassword = document.getElementById("reset-password-form");

  resetPassword.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;

    try {
      const response = await axios.post("/password/forgotpassword", {
        email: email,
      });
      if (response.status === 200) {
        alert("Message: " + response.data.message);
        document.getElementById("email").value = "";
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  });
});
