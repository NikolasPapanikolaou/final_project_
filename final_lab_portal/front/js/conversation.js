const API_URL = "https://finallabportal.onrender.com"; // Ensure this URL is correct
const socket = io(API_URL); // Initialize socket connection

const urlParams = new URLSearchParams(window.location.search);
let chatId = urlParams.get("chatId");
let groupName = urlParams.get("groupName");

document.getElementById("groupName").textContent = groupName;

const messagesList = document.getElementById("messagesList");
const messageInput = document.getElementById("messageInput");
const sendMessageButton = document.getElementById("sendMessageButton");
const chatContactsList = document.getElementById("chatContactsList");
const createChatForm = document.getElementById("createChatForm");
const groupChatsList = document.getElementById("groupChatsList");
const responseMessage = document.getElementById("responseMessage");

sendMessageButton.addEventListener("click", async () => {
  const message = messageInput.value;
  const userId = getCookie("userId");

  if (!chatId || !userId || message.trim() === "") {
    alert("All fields are required.");
    return;
  }

  try {
    const response = await fetch(`${API_URL}/send_message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId, userId, message }),
    });
    const data = await response.json();

    if (response.ok) {
      messageInput.value = ""; // Clear the input field
      fetchMessages(); // Refresh the messages list

      // Emit the message to the socket
      socket.emit("newMessage", { chatId, userId, message });
    } else {
      alert(data.error);
    }
  } catch (error) {
    alert("Error: " + error.message);
  }
});

async function fetchMessages() {
  if (!chatId) return;

  try {
    const response = await fetch(`${API_URL}/get_messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chatId }),
    });
    const data = await response.json();

    if (response.ok) {
      messagesList.innerHTML = ""; // Clear the existing messages
      const currentUserId = getCookie("userId");
      data.messages.forEach(msg => {
        const listItem = document.createElement("li");
        listItem.textContent = `${msg.senderEmail}: ${msg.text}`;
        listItem.className = msg.sender === currentUserId ? "message-left" : "message-right";
        messagesList.appendChild(listItem);
      });
    } else {
      alert(data.error);
    }
  } catch (error) {
    alert("Error: " + error.message);
  }
}

// Fetch and display user's contacts and group chats
document.addEventListener("DOMContentLoaded", async () => {
  const currentUserUid = getCookie("userId");

  // Join a room with the user's ID
  socket.emit("joinRoom", currentUserUid);

  // Fetch and display user's contacts for chat
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
        checkbox.id = `chat-contact-${contact.uid}`;
        const label = document.createElement("label");
        label.htmlFor = `chat-contact-${contact.uid}`;
        label.textContent = contact.email;
        const div = document.createElement("div");
        div.appendChild(checkbox);
        div.appendChild(label);
        chatContactsList.appendChild(div);
      });
    } else {
      showMessage(data.error, true);
    }
  } catch (error) {
    showMessage("Error: " + error.message, true);
  }

  // Fetch and display user's group chats
  fetchGroupChats(currentUserUid);

  // Fetch messages for the initial chat
  fetchMessages();
});

function getCookie(name) {
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop().split(';').shift();
}

// Handle Create Group Chat
createChatForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const groupName = document.getElementById("chatName").value;
  const userId = getCookie("userId");
  const memberIds = Array.from(chatContactsList.querySelectorAll("input[type=checkbox]:checked")).map(checkbox => checkbox.value);

  try {
    const response = await fetch(`${API_URL}/create_group_chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, groupName, memberIds }),
    });
    const data = await response.json();

    console.log("Response status:", response.status); // Log the response status
    console.log("Response data:", data); // Log the response data

    if (response.ok) {
      showMessage("Group chat created successfully!");
      createChatForm.reset(); // Reset the form
      fetchGroupChats(userId); // Refresh the list of group chats
    } else {
      showMessage(data.error, true);
    }
  } catch (error) {
    showMessage("Error: " + error.message, true);
  }
});

async function fetchGroupChats(userId) {
  try {
    const response = await fetch(`${API_URL}/get_user_group_chats`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId }),
    });
    const data = await response.json();

    if (response.ok) {
      groupChatsList.innerHTML = ""; // Clear the existing group chats
      data.groupChats.forEach(chat => {
        const listItem = document.createElement("li");
        listItem.textContent = chat.groupName;
        listItem.addEventListener("click", () => selectConversation(chat.id, chat.groupName, listItem));
        groupChatsList.appendChild(listItem);
      });
    } else {
      showMessage(data.error, true);
    }
  } catch (error) {
    showMessage("Error: " + error.message, true);
  }
}

function selectConversation(newChatId, newGroupName, listItem) {
  chatId = newChatId;
  groupName = newGroupName;
  document.getElementById("groupName").textContent = groupName;

  // Remove the 'selected' class from all chat items
  document.querySelectorAll("#groupChatsList li").forEach(item => {
    item.classList.remove("selected");
  });

  // Add the 'selected' class to the clicked chat item
  listItem.classList.add("selected");

  fetchMessages();
}

// Helper function to display messages
function showMessage(message, isError = false) {
  responseMessage.textContent = message;
  responseMessage.className = isError ? "message error" : "message";
}

// Fetch messages initially
fetchMessages();

// Poll for new messages every 5 seconds
setInterval(fetchMessages, 5000);

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
