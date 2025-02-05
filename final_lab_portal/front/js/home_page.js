const searchForm = document.getElementById("searchForm");
const responseMessage = document.getElementById("responseMessage");
const pendingRequestsList = document.getElementById("pendingRequestsList");
const createPostForm = document.getElementById("createPostForm");
const userPostsList = document.getElementById("userPostsList");
const userFeedList = document.getElementById("userFeedList");
const contactsList = document.getElementById("contactsList");
const feedSearch = document.getElementById("feedSearch");
const chatContactsList = document.getElementById("chatContactsList");
const createChatForm = document.getElementById("createChatForm");
const groupChatsList = document.getElementById("groupChatsList");

const API_URL = "https://finallabportal.onrender.com"; // Ensure this URL is correct

const socket = io(API_URL); // Initialize socket connection

// Helper function to display messages
function showMessage(message, isError = false) {
  responseMessage.textContent = message;
  responseMessage.className = isError ? "message error" : "message";
}

// Handle Search
searchForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const email = document.getElementById("searchEmail").value;
  const contactEmail = email;
  const currentUserUid = getCookie("userId");

  try {
    const response = await fetch(`${API_URL}/add_contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentUserUid, contactEmail }),
    });
    const data = await response.json();

    if (response.ok) {
      showMessage("Contact request sent successfully!");
    } else {
      showMessage(data.error, true);
    }
  } catch (error) {
    showMessage("Error: " + error.message, true);
  }
});

// Fetch and display user's contacts
document.addEventListener("DOMContentLoaded", async () => {
  const currentUserUid = getCookie("userId");

  // Join a room with the user's ID
  socket.emit("joinRoom", currentUserUid);

  try {
    const response = await fetch(`${API_URL}/get_user_contacts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: currentUserUid }),
    });
    const data = await response.json();

    if (response.ok) {
      data.contacts.forEach(contact => {
        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.value = contact.uid;
        checkbox.id = `contact-${contact.uid}`;
        const label = document.createElement("label");
        label.htmlFor = `contact-${contact.uid}`;
        label.textContent = contact.email;
        const div = document.createElement("div");
        div.appendChild(checkbox);
        div.appendChild(label);
        contactsList.appendChild(div);
      });
    } else {
      showMessage(data.error, true);
    }
  } catch (error) {
    showMessage("Error: " + error.message, true);
  }

  // Fetch and display pending requests
  try {
    const response = await fetch(`${API_URL}/get_pending_requests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentUserUid }),
    });
    const data = await response.json();

    if (response.ok) {
      data.pendingRequests.forEach(request => {
        const listItem = document.createElement("li");
        listItem.textContent = `${request.email} `;
        const acceptButton = document.createElement("button");
        acceptButton.textContent = "Accept";
        acceptButton.addEventListener("click", () => acceptRequest(request.uid, request.key));
        listItem.appendChild(acceptButton);
        pendingRequestsList.appendChild(listItem);
      });
    } else {
      showMessage(data.error, true);
    }
  } catch (error) {
    showMessage("Error: " + error.message, true);
  }

  // Fetch and display user's posts
  try {
    const response = await fetch(`${API_URL}/get_user_posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: currentUserUid }),
    });
    const data = await response.json();

    if (response.ok) {
      console.log("User posts:", data.posts); // Debugging log
      data.posts.forEach(post => {
        const listItem = document.createElement("li");
        const email = document.createElement("p");
        email.textContent = `Posted by: ${post.email || "Unknown"}`;
        const title = document.createElement("h1");
        title.textContent = post.title;
        const text = document.createElement("p");
        text.textContent = post.text;
        const deleteButton = document.createElement("button");
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", () => deletePost(post.id));
        listItem.appendChild(title);
        listItem.appendChild(text);
        listItem.appendChild(email);
        listItem.appendChild(deleteButton);
        userPostsList.appendChild(listItem);
      });
    } else {
      showMessage(data.error, true);
    }
  } catch (error) {
    showMessage("Error: " + error.message, true);
  }

  // Fetch and display user's feed
  try {
    const response = await fetch(`${API_URL}/get_user_feed`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: currentUserUid }),
    });
    const data = await response.json();

    if (response.ok) {
      data.posts.forEach(post => {
        const listItem = document.createElement("li");
        const email = document.createElement("p");
        email.textContent = `Posted by: ${post.email || "Unknown"}`;
        const title = document.createElement("h1");
        title.textContent = post.title;
        const text = document.createElement("p");
        text.textContent = post.text;
        listItem.appendChild(title);
        listItem.appendChild(text);
        listItem.appendChild(email);
        userFeedList.appendChild(listItem);
      });
    } else {
      showMessage(data.error, true);
    }
  } catch (error) {
    showMessage("Error: " + error.message, true);
  }
});

// Filter user's feed based on search input
feedSearch.addEventListener("input", () => {
  const searchTerm = feedSearch.value.toLowerCase();
  const posts = userFeedList.getElementsByTagName("li");

  Array.from(posts).forEach(post => {
    const title = post.querySelector("h1").textContent.toLowerCase();
    const text = post.querySelector("p").textContent.toLowerCase();
    if (title.includes(searchTerm) || text.includes(searchTerm)) {
      post.style.display = "";
    } else {
      post.style.display = "none";
    }
  });
});

async function acceptRequest(contactUid, requestKey) {
  const currentUserUid = getCookie("userId");

  try {
    const response = await fetch(`${API_URL}/accept_contact`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentUserUid, contactUid, requestKey }),
    });
    const data = await response.json();

    if (response.ok) {
      showMessage("Contact request accepted successfully!");
      location.reload(); // Reload the page to update the list
    } else {
      showMessage(data.error, true);
    }
  } catch (error) {
    showMessage("Error: " + error.message, true);
  }
}

// Handle Create Post
createPostForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const title = document.getElementById("postTitle").value;
  const text = document.getElementById("postText").value;
  const userId = getCookie("userId");
  const contactIds = Array.from(contactsList.querySelectorAll("input[type=checkbox]:checked")).map(checkbox => checkbox.value);

  try {
    const response = await fetch(`${API_URL}/create_post`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, title, text, contactIds }),
    });
    const data = await response.json();

    if (response.ok) {
      showMessage("Post created successfully!");
      createPostForm.reset(); // Reset the form
      location.reload(); // Reload the page to update the list
    } else {
      showMessage(data.error, true);
    }
  } catch (error) {
    showMessage("Error: " + error.message, true);
  }
});

async function deletePost(postId) {
  try {
    const response = await fetch(`${API_URL}/delete_post`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ postId }),
    });
    const data = await response.json();

    if (response.ok) {
      showMessage("Post deleted successfully!");
      location.reload(); // Reload the page to update the list
    } else {
      showMessage(data.error, true);
    }
  } catch (error) {
    showMessage("Error: " + error.message, true);
  }
}

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

function startConversation(chatId, groupName) {
  // Redirect to the conversation page with the chatId and groupName as query parameters
  window.location.href = `/front/html/conversation.html?chatId=${chatId}&groupName=${groupName}`;
}

socket.on("message", (data) => {
  const { chatId: incomingChatId, groupName, email, text } = data;

  let permission = Notification.permission;
  
  if(permission === "granted"){
    showNotification();
  } else if(permission === "default"){
      requestAndShowPermission();
  } else {
    alert("Use normal alert");
  }
  
  function requestAndShowPermission() {
      Notification.requestPermission(function (permission) {
          if (permission === "granted") {
              showNotification();
          }
      });
  }
  function showNotification() {
    //  if(document.visibilityState === "visible") {
    //      return;
    //  }
      let title = "From " + email + " in " + groupName;
      let icon = 'https://www.google.com/url?sa=i&url=https%3A%2F%2Ficonduck.com%2Ficons%2F182278%2Fmessage&psig=AOvVaw3YTisQzfj60-sMfbhwyUqL&ust=1737745377418000&source=images&cd=vfe&opi=89978449&ved=0CBEQjRxqFwoTCLirspLEjIsDFQAAAAAdAAAAABAE';
      let body = text;
  
      let notification = new Notification(title, { body, icon });
  
      notification.onclick = () => {
            notification.close();
            window.parent.focus();
      }
      
  }
});
