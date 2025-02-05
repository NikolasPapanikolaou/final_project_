const signupForm = document.getElementById("signupForm");
const responseMessage = document.getElementById("responseMessage");

const API_URL = "https://finallabportal.onrender.com"; // Replace with your backend URL

// Helper function to display messages
function showMessage(message, isError = false) {
  responseMessage.textContent = message;
  responseMessage.className = isError ? "message error" : "message";
}

// Handle Sign-Up
signupForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const firstName = document.getElementById("signupFirstName").value;
  const lastName = document.getElementById("signupLastName").value;
  const email = document.getElementById("signupEmail").value;
  const password = document.getElementById("signupPassword").value;

  try {
    const response = await fetch(`${API_URL}/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName, lastName, email, password }),
    });
    const data = await response.json();

    if (response.ok) {
      //here you get the data.uid
      showMessage("Sign-up successful!");
      window.location.href = '/front/html/log_in.html';
    } else {
      showMessage(data.error, true);
    }
  } catch (error) {
    showMessage("Error: " + error.message, true);
  }
});
