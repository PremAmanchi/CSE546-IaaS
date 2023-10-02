var express = require("express");
var bodyParser = require("body-parser");
var multer = require("multer");
var path = require("path");
const port = 3000;

var app = express();
// app.set("views", path.join(__dirname, "views"));
// app.engine("html", require("ejs").renderFile);
// app.use(express.static("public"));
// app.set("view engine", "ejs");
app.use(bodyParser.json());
const storage = multer.memoryStorage(); // Store the uploaded file in memory
const upload = multer({ storage: storage }).array("userPhoto", 1); // Allow only one file

// const fs = require("fs");
const AWS = require("aws-sdk");

// Configure AWS
AWS.config.update({
  region: "us-east-1",
  accessKeyId: "AKIAX7SHWYTIJIMWZGNT",
  secretAccessKey: "+IyMj0veGD7ByGhpNtnRuARjy3kzQz9ujiMHnlTU",
});

// Create an SQS instance
var sqs = new AWS.SQS();
const sqs_request_url = // Replace with your SQS in queue URL
  "https://sqs.us-east-1.amazonaws.com/548832462032/CSE-546-PROJECT-1-REQUEST-QUEUE";
const sqs_response_url = // Replace with your SQS out queue URL
  "https://sqs.us-east-1.amazonaws.com/548832462032/CSE-546-PROJECT-1-RESPONSE-QUEUE";

// Global variables
var resDict = {};
var inputSet = new Set();
var resDictSize = 0;

const uploadFile = (base64Image, fileNamePlusIp) => {
  // Create the message parameters
  const params = {
    MessageAttributes: {
      fileNamePlusIp: {
        DataType: "String",
        StringValue: fileNamePlusIp,
      },
    },
    MessageBody: base64Image,
    QueueUrl: sqs_request_url,
  };

  // Send the message to SQS
  sqs.sendMessage(params, (err, data) => {
    if (err) {
      console.error("Error sending message to SQS:", err);
    } else {
      console.log("Message sent successfully:", data.MessageId);
    }
  });
};

// const getIpAddress = (req) => {
//   const ipAddress =
//     req.headers["x-forwarded-for"] || req.connection.remoteAddress;
//   return ipAddress;
// };

app.post("/api/photo", (req, res) => {
  upload(req, res, (err) => {
    if (err) {
      console.log(err);
      return res.send("Error uploading file.");
    }

    const ipAddress = req.ip;
    console.log(`Client IP Address: ${ipAddress}`);

    if (!req.files || req.files.length === 0) {
      return res.send("No files uploaded.");
    }

    // Assuming you are working with a single file upload
    const file = req.files[0];
    const base64Image = file.buffer.toString("base64");

    // Extract the file name from the original file name
    const fileName = file.originalname;

    // Log the image name and IP address
    console.log(`Image Name: ${fileName}`);
    console.log(`Client IP Address: ${ipAddress}`);

    const fileExtension = ".JPEG"; // Change this if the file extension is different
    const fileNamePlusIp = fileName.replace(
      ".JPEG",
      "-" + ipAddress + fileExtension
    );
    console.log(fileNamePlusIp);
    // console.log(`encoded image : ${base64Image}`);

    res.send("File uploaded! Starting the process...");

    uploadFile(base64Image, fileNamePlusIp);
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
  console.log("open this in browser : http://localhost:3000/");
});
