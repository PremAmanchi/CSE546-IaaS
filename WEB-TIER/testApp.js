const express = require("express");
const bodyParser = require("body-parser");

const app = express();
const port = 3000;

// Middleware for parsing JSON data in POST requests
app.use(bodyParser.json());

// Define a GET endpoint
app.get("/", (req, res) => {
  res.send("Hello, World! This is a GET request.");
});

// Define a POST endpoint
app.get("/prem", (req, res) => {
  const data = req.body;
  res.send("{ message:");
});

// Start the server
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
  console.log("open this in browser : http://localhost:3000/");
});
