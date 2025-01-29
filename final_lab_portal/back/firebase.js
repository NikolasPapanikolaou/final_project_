const admin = require("firebase-admin");
const firebase = require("firebase");

const serviceAccount = require("./FirebaseService.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://labcommunityplatform-default-rtdb.firebaseio.com",
});

firebase.initializeApp({
});

const auth = admin.auth();
const db = admin.database();

module.exports = { admin, firebase, auth, db };
