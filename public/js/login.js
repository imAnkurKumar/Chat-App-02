document.addEventListener("DOMContentLoaded", () => {
    const loginForm = document.getElementById("login-form");
  
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;
  
        const response = await axios.post("/user/login", { email, password });
  
        if (response.status === 200) {
          alert("Login successful: " + response.data.message);
          localStorage.setItem("token", response.data.token);
          window.location.href = "/chat.html";
          document.getElementById("email").value = "";
          document.getElementById("password").value = "";
        }
      } catch (error) {
        if (error.response) {
          if (error.response.status === 404 || error.response.status === 401) {
            alert("Error: " + error.response.data.message);
          } else {
            alert("Error: " + error.response.data.message);
          }
        } else {
          console.error("Login error:", error);
          alert("Login error: Please try again.");
        }
      }
    });
  });
  