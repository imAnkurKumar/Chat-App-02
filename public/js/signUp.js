document.addEventListener("DOMContentLoaded", () => {
  const signupForm = document.getElementById("signup-form");

  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    try {
      const name = document.getElementById("name").value;
      const email = document.getElementById("email").value;
      const phone = document.getElementById("phone").value;
      const password = document.getElementById("password").value;

      const response = await axios.post("/user/signUp", {
        name,
        email,
        phone,
        password,
      });

      if (response.status === 201) {
        alert("Sign-up successful: " + response.data.message);
        window.location.href = "/login.html";

        document.getElementById("username").value = "";
        document.getElementById("email").value = "";
        document.getElementById("password").value = "";
      }
    } catch (error) {
      if (error.response.status === 400) {
        alert("Error: " + error.response.data.message);
      } else {
        console.error("Sign-up error:", error.response.data.message);
      }
    }
  });
});
