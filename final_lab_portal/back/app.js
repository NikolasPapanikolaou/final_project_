const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const http = require("http");
const socketIo = require("socket.io");

const app = express();
app.use(bodyParser.json());
app.use(cors({
  origin: ["http://127.0.0.1:5500", "http://localhost:5500"], // Allow your frontend
  methods: "GET,POST,PUT,DELETE",
  credentials: true
}));
app.use(express.json());

const { admin, firebase, auth, db } = require("./firebase");
const { setupRoutes } = require("./routes");
const { setupSocket } = require("./socket");

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

setupSocket(io, db);
setupRoutes(app, auth, db, firebase);

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
