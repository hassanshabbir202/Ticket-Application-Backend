const express = require("express");
const connectDB = require("./db/connection");
const bodyParser = require("body-parser");
const app = express();
const port = 4000;
const usersRoute = require("./routes/route"); // Adjust the path as necessary
// require("dotenv").config();


const server = require('http').Server(app);

connectDB();

app.use(bodyParser.json({ limit: "50mb" }));
// Middleware
app.use(express.json()); // Body parser middleware

// Routes
app.use("/api", usersRoute); // This mounts the usersRoute under the /api path

server.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});


const io = require('socket.io')(server);

require('./configurations/socket')(io);