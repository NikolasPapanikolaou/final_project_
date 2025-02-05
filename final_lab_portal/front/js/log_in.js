const loginForm = document.getElementById("loginForm");
const responseMessage = document.getElementById("responseMessage");

const API_URL = "https://finallabportal.onrender.com"; // Ensure this URL is correct

// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.11.0/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.11.0/firebase-analytics.js";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "https://www.gstatic.com/firebasejs/9.11.0/firebase-auth.js";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const auth = getAuth();
//console.log(auth);

const provider = new GoogleAuthProvider();
console.log(provider);

//----- Google login code start	  
document.getElementById("google-login").addEventListener("click", async function () { // Added 'async' here
  try {
    const result = await signInWithPopup(auth, provider); // Wait for the popup to complete

    // This gives you a Google Access Token. You can use it to access the Google API.
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential.accessToken;

    // The signed-in user info.
    const user = result.user;
    alert("Welcome " + user.displayName);
    console.log(user);

    // Split the user's name into first name and last name
    const nameParts = user.displayName.split(" ");
    const firstName = nameParts[0];
    const lastName = nameParts[1] || ""; // Handle cases where there may not be a last name
    const email = user.email;
    const uid = user.uid;
    setCookie("userId", uid, 7);
    setCookie("firstName", firstName, 7); // Store first name for 7 days
    setCookie("lastName", lastName, 7); // Store last name for 7 days

    // Send user data to your backend
    const response = await fetch(`${API_URL}/google_sign_in`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid, email, firstName, lastName }),
    });

    const data = await response.json();

    if (response.ok) {
      // Handle successful sign-up
      showMessage("Sign-up successful!");
      window.location.href = '/front/html/home_page.html';
    } else {
      // Handle errors from the backend
      showMessage(data.error || "Sign-up failed", true);
    }
  } catch (error) {
    // Handle general errors
    console.error("Error during sign-in:", error.message);
    showMessage("Error: " + error.message, true);
  }
});

// Helper function to display messages
function showMessage(message, isError = false) {
  responseMessage.textContent = message;
  responseMessage.className = isError ? "message error" : "message";
}

// Helper function to set a cookie
function setCookie(name, value, days) {
  const expires = new Date();
  expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
  document.cookie = `${name}=${value}; expires=${expires.toUTCString()}; path=/`;
}

// Helper function to get a cookie by name
function getCookie(name) {
  const match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
  return match ? match[2] : null;
}

// Handle Log-In
loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("loginEmail").value;
  const password = document.getElementById("loginPassword").value;

  try {
    const response = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await response.json();

    if (response.ok) {
      // Store token and user details in cookies (acting as session)
      setCookie("authToken", data.token, 7); // Store token for 7 days
      setCookie("userId", data.uid, 7); // Store user ID for 7 days
      setCookie("firstName", data.firstName, 7); // Store first name for 7 days
      setCookie("lastName", data.lastName, 7); // Store last name for 7 days

      showMessage(`Welcome ${data.firstName} ${data.lastName}!`);
      window.location.href = '/front/html/home_page.html';
    } else {
      showMessage(data.error, true);
    }
  } catch (error) {
    showMessage("Error: " + error.message, true);
  }
});
