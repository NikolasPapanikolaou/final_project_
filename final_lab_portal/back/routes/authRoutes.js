function setupAuthRoutes(app, auth, db, firebase) {
  app.post("/signup", async (req, res) => {
    const { email, password, firstName, lastName } = req.body;
    try {
      const userRecord = await auth.createUser({ email, password });
      const userRef = db.ref(`users/${userRecord.uid}`);
      await userRef.set({
        firstName,
        lastName,
        email,
        createdAt: new Date().toISOString(),
      });
      res.status(201).json({ message: "User created and data saved", uid: userRecord.uid });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/google_sign_in", async (req, res) => {
    const { uid, email, firstName, lastName } = req.body;
    try {
      const customToken = await auth.createCustomToken(uid);
      const userRef = db.ref(`users/${uid}`);
      await userRef.update({
        firstName,
        lastName,
        email,
        createdAt: new Date().toISOString(),
        token: customToken,
        lastLogin: new Date().toISOString()
      });
      res.status(201).json({ message: "User created and data saved"});
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/login", async (req, res) => {
    const { email, password } = req.body;
    try {
      const userCredential = await firebase.auth().signInWithEmailAndPassword(email, password);
      const user = userCredential.user;
      const customToken = await auth.createCustomToken(user.uid);
      const userRef = db.ref(`users/${user.uid}`);
      await userRef.update({
        token: customToken,
        lastLogin: new Date().toISOString()
      });
      const userSnapshot = await userRef.once("value");
      const userDetails = userSnapshot.val();
      res.status(200).json({ 
        message: "Login successful", 
        token: customToken, 
        uid: user.uid,
        firstName: userDetails.firstName,
        lastName: userDetails.lastName
      });
    } catch (error) {
      res.status(400).json({ error: "Invalid email or password" });
    }
  });
}

module.exports = { setupAuthRoutes };
