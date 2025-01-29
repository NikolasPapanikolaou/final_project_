function setupPostRoutes(app, auth, db) {
  app.post("/create_post", async (req, res) => {
    const { userId, title, text, contactIds } = req.body;
    if (!userId || !title || !text) {
      return res.status(400).json({ error: "userId, title, and text are required." });
    }
    try {
      const userRef = db.ref(`users/${userId}`);
      const userSnapshot = await userRef.once("value");
      const userDetails = userSnapshot.val();
      if (!userDetails || !userDetails.email) {
        return res.status(404).json({ error: "User not found or email not available." });
      }
      const postsRef = db.ref("posts");
      const newPostRef = postsRef.push();
      await newPostRef.set({
        userId,
        email: userDetails.email,
        title,
        text,
        contactIds: contactIds || [],
        createdAt: new Date().toISOString()
      });
      res.status(200).json({ message: "Post created successfully!" });
    } catch (error) {
      res.status(500).json({ error: "An error occurred while creating the post." });
    }
  });

  app.get("/get_posts", async (req, res) => {
    try {
      const postsRef = db.ref("posts");
      const snapshot = await postsRef.once("value");
      const posts = snapshot.val() || {};
      const postsArray = Object.keys(posts).map(key => ({
        id: key,
        ...posts[key]
      }));
      res.status(200).json({ posts: postsArray });
    } catch (error) {
      res.status(500).json({ error: "An error occurred while fetching the posts." });
    }
  });

  app.post("/get_user_posts", async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "userId is required." });
    }
    try {
      const postsRef = db.ref("posts");
      const snapshot = await postsRef.once("value");
      const posts = snapshot.val() || {};
      const userPosts = Object.keys(posts)
        .filter(key => posts[key].userId === userId)
        .map(key => ({
          id: key,
          ...posts[key]
        }));
      res.status(200).json({ posts: userPosts });
    } catch (error) {
      res.status(500).json({ error: "An error occurred while fetching the user's posts." });
    }
  });

  app.post("/get_user_feed", async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "userId is required." });
    }
    try {
      const postsRef = db.ref("posts");
      const snapshot = await postsRef.once("value");
      const posts = snapshot.val() || {};
      const userFeed = Object.keys(posts)
        .filter(key => posts[key].userId === userId || (posts[key].contactIds && posts[key].contactIds.includes(userId)))
        .map(key => ({
          id: key,
          ...posts[key]
        }));
      res.status(200).json({ posts: userFeed });
    } catch (error) {
      res.status(500).json({ error: "An error occurred while fetching the user's feed." });
    }
  });

  app.delete("/delete_post", async (req, res) => {
    const { postId } = req.body;
    if (!postId) {
      return res.status(400).json({ error: "postId is required." });
    }
    try {
      const postRef = db.ref(`posts/${postId}`);
      await postRef.remove();
      res.status(200).json({ message: "Post deleted successfully!" });
    } catch (error) {
      res.status(500).json({ error: "An error occurred while deleting the post." });
    }
  });
}

module.exports = { setupPostRoutes };
