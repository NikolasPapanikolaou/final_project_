function setupSocket(io, db) {
  io.on("connection", (socket) => {
    console.log("New client connected");

    socket.on("joinRoom", (userId) => {
      socket.join(userId);
      console.log(`User with ID ${userId} joined room ${userId}`);
    });

    socket.on("newMessage", async ({ chatId, userId, message }) => {
      try {
        // Fetch the user's email based on the user ID
        const userRef = db.ref(`users/${userId}`);
        const snapshot = await userRef.once("value");
        const user = snapshot.val();

        if (!user || !user.email) {
          console.error("User not found or email not available.");
          return;
        }

        // Fetch the chat members and group name
        const chatRef = db.ref(`groupChats/${chatId}`);
        const chatSnapshot = await chatRef.once("value");
        const chat = chatSnapshot.val();

        if (!chat || !chat.members) {
          console.error("Chat not found or members not available.");
          return;
        }

        const groupName = chat.groupName;

        // Emit the message to all members' rooms except the sender
        chat.members.forEach(memberId => {
          if (memberId !== userId) {
            io.to(memberId).emit("message", {
              chatId,
              groupName,
              email: user.email,
              text: message,
            });
          }
        });
      } catch (error) {
        console.error("Error handling new message:", error.message);
      }
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected");
    });
  });
}

module.exports = { setupSocket };
