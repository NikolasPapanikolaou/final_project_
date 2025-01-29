function setupChatRoutes(app, auth, db) {
  app.post("/create_group_chat", async (req, res) => {
    const { userId, groupName, memberIds } = req.body;
    if (!userId || !groupName || !memberIds || memberIds.length === 0) {
      return res.status(400).json({ error: "userId, groupName, and memberIds are required." });
    }
    try {
      const groupChatsRef = db.ref("groupChats");
      const newGroupChatRef = groupChatsRef.push();
      await newGroupChatRef.set({
        groupName,
        members: [userId, ...memberIds],
        createdAt: new Date().toISOString()
      });
      res.status(200).json({ message: "Group chat created successfully!" });
    } catch (error) {
      res.status(500).json({ error: "An error occurred while creating the group chat." });
    }
  });

  app.post("/get_user_group_chats", async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "userId is required." });
    }
    try {
      const groupChatsRef = db.ref("groupChats");
      const snapshot = await groupChatsRef.once("value");
      const groupChats = snapshot.val() || {};
      const userGroupChats = Object.keys(groupChats)
        .filter(key => groupChats[key].members.includes(userId))
        .map(key => ({
          id: key,
          ...groupChats[key]
        }));
      res.status(200).json({ groupChats: userGroupChats });
    } catch (error) {
      res.status(500).json({ error: "An error occurred while fetching the user's group chats." });
    }
  });

  app.post("/send_message", async (req, res) => {
    const { chatId, userId, message } = req.body;
    if (!chatId || !userId || !message) {
      return res.status(400).json({ error: "chatId, userId, and message are required." });
    }
    try {
      const userRef = db.ref(`users/${userId}`);
      const snapshot = await userRef.once("value");
      const user = snapshot.val();
      if (!user || !user.email) {
        return res.status(404).json({ error: "User not found or email not available." });
      }
      const messagesRef = db.ref(`groupChats/${chatId}/messages`);
      const newMessageRef = messagesRef.push();
      await newMessageRef.set({
        sender: userId,
        senderEmail: user.email,
        text: message,
        createdAt: new Date().toISOString()
      });
      res.status(200).json({ message: "Message sent successfully!" });
    } catch (error) {
      res.status(500).json({ error: "An error occurred while sending the message." });
    }
  });

  app.post("/get_messages", async (req, res) => {
    const { chatId } = req.body;
    if (!chatId) {
      return res.status(400).json({ error: "chatId is required." });
    }
    try {
      const messagesRef = db.ref(`groupChats/${chatId}/messages`);
      const snapshot = await messagesRef.once("value");
      const messages = snapshot.val() || {};
      const messagesArray = Object.keys(messages).map(key => ({
        id: key,
        ...messages[key]
      }));
      res.status(200).json({ messages: messagesArray });
    } catch (error) {
      res.status(500).json({ error: "An error occurred while fetching the messages." });
    }
  });
}

module.exports = { setupChatRoutes };
