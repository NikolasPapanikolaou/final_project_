function setupContactRoutes(app, auth, db) {
  app.post("/add_contact", async (req, res) => {
    const { currentUserUid, contactEmail } = req.body;
    if (!currentUserUid || !contactEmail) {
      return res.status(400).json({ error: "currentUserUid and contactEmail are required." });
    }
    try {
      const usersRef = db.ref("users");
      const snapshot = await usersRef.once("value");
      const users = snapshot.val();
      let contactUid = null;
      let contactEmailFound = null;
      for (const uid in users) {
        if (users[uid].email === contactEmail) {
          contactUid = uid;
          contactEmailFound = users[uid].email;
          break;
        }
      }
      if (!contactUid) {
        return res.status(404).json({ error: "User with the specified email not found." });
      }
      const currentUserPendingToAcceptRef = db.ref(`users/${currentUserUid}/pendingToAccept`);
      await currentUserPendingToAcceptRef.push({ uid: contactUid, email: contactEmailFound });
      const contactUserPendingToBeAcceptedRef = db.ref(`users/${contactUid}/pendingToBeAccepted`);
      await contactUserPendingToBeAcceptedRef.push({ uid: currentUserUid, email: users[currentUserUid].email });
      res.status(200).json({ message: "Contact request sent successfully!" });
    } catch (error) {
      res.status(500).json({ error: "An error occurred while sending the contact request." });
    }
  });

  app.post("/accept_contact", async (req, res) => {
    const { currentUserUid, contactUid, requestKey } = req.body;
    if (!currentUserUid || !contactUid || !requestKey) {
      return res.status(400).json({ error: "currentUserUid, contactUid, and requestKey are required." });
    }
    try {
      const usersRef = db.ref("users");
      const usersSnapshot = await usersRef.once("value");
      const users = usersSnapshot.val();
      const currentUserPendingToBeAcceptedRef = db.ref(`users/${currentUserUid}/pendingToBeAccepted`);
      const currentUserContactsRef = db.ref(`users/${currentUserUid}/contacts`);
      const snapshot = await currentUserPendingToBeAcceptedRef.once("value");
      const pendingToBeAccepted = snapshot.val();
      let contactEmail = null;
      if (pendingToBeAccepted[requestKey].uid === contactUid) {
        contactEmail = pendingToBeAccepted[requestKey].email;
        await currentUserContactsRef.push({ uid: contactUid, email: contactEmail });
        await currentUserPendingToBeAcceptedRef.child(requestKey).remove();
      }
      if (!contactEmail) {
        return res.status(404).json({ error: "Pending contact request not found." });
      }
      const contactUserPendingToAcceptRef = db.ref(`users/${contactUid}/pendingToAccept`);
      const contactUserContactsRef = db.ref(`users/${contactUid}/contacts`);
      const contactSnapshot = await contactUserPendingToAcceptRef.once("value");
      const pendingToAccept = contactSnapshot.val();
      for (const key in pendingToAccept) {
        if (pendingToAccept[key].uid === currentUserUid) {
          await contactUserContactsRef.push({ uid: currentUserUid, email: users[currentUserUid].email });
          await contactUserPendingToAcceptRef.child(key).remove();
          break;
        }
      }
      res.status(200).json({ message: "Contact request accepted successfully!" });
    } catch (error) {
      res.status(500).json({ error: "An error occurred while accepting the contact request." });
    }
  });

  app.post("/get_pending_requests", async (req, res) => {
    const { currentUserUid } = req.body;
    if (!currentUserUid) {
      return res.status(400).json({ error: "currentUserUid is required." });
    }
    try {
      const currentUserPendingToBeAcceptedRef = db.ref(`users/${currentUserUid}/pendingToBeAccepted`);
      const snapshot = await currentUserPendingToBeAcceptedRef.once("value");
      const pendingRequests = snapshot.val() || {};
      const pendingRequestsArray = Object.keys(pendingRequests).map(key => ({
        uid: pendingRequests[key].uid,
        email: pendingRequests[key].email,
        key: key
      }));
      res.status(200).json({ pendingRequests: pendingRequestsArray });
    } catch (error) {
      res.status(500).json({ error: "An error occurred while fetching the pending requests." });
    }
  });

  app.post("/get_user_contacts", async (req, res) => {
    const { userId } = req.body;
    if (!userId) {
      return res.status(400).json({ error: "userId is required." });
    }
    try {
      const contactsRef = db.ref(`users/${userId}/contacts`);
      const snapshot = await contactsRef.once("value");
      const contacts = snapshot.val() || {};
      const contactsArray = Object.keys(contacts).map(key => ({
        uid: contacts[key].uid,
        email: contacts[key].email
      }));
      res.status(200).json({ contacts: contactsArray });
    } catch (error) {
      res.status(500).json({ error: "An error occurred while fetching the user's contacts." });
    }
  });
}

module.exports = { setupContactRoutes };
