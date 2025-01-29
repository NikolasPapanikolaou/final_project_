const { setupAuthRoutes } = require("./routes/authRoutes");
const { setupContactRoutes } = require("./routes/contactRoutes");
const { setupPostRoutes } = require("./routes/postRoutes");
const { setupChatRoutes } = require("./routes/chatRoutes");

function setupRoutes(app, auth, db, firebase) {
  setupAuthRoutes(app, auth, db, firebase);
  setupContactRoutes(app, auth, db);
  setupPostRoutes(app, auth, db);
  setupChatRoutes(app, auth, db);
}

module.exports = { setupRoutes };
