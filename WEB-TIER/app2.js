const express = require("express");
const bodyParser = require("body-parser");
const multer = require("multer");
const AWS = require("aws-sdk");
const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
const storage = multer.memoryStorage();
// change the userPhoto name to the key given in postman
const upload = multer({ storage: storage }).array("userPhoto", 1);

// AWS Configuration
AWS.config.update({
  region: "us-east-1",
  accessKeyId: "AKIAX7SHWYTIJIMWZGNT",
  secretAccessKey: "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",
});

// Create SQS Instances
const SQS = new AWS.SQS();
const requestQueueURL =
  "https://sqs.us-east-1.amazonaws.com/548832462032/CSE-546-PROJECT-1-REQUEST-QUEUE";
const responseQueueURL =
  "https://sqs.us-east-1.amazonaws.com/548832462032/CSE-546-PROJECT-1-RESPONSE-QUEUE";

// Global Variables
const dataDict = {};
const resultDict = {};

// Function to Upload File to SQS
const uploadFile = (base64Image, fileNamePlusIp) => {
  const params = {
    MessageAttributes: {
      fileNamePlusIp: {
        DataType: "String",
        StringValue: fileNamePlusIp,
      },
    },
    MessageBody: base64Image,
    QueueUrl: requestQueueURL,
  };

  SQS.sendMessage(params, (err, data) => {
    if (err) {
      console.error("Error sending message to SQS:", err);
    } else {
      console.log("Message sent successfully:", data.MessageId);
    }
  });
};

// Function to Receive Messages from SQS
function receiveMessages() {
  // set some max num messages to poll from queue
  const maxMessagesToReceive = 10;

  const sqsParams = {
    QueueUrl: responseQueueURL,
    MaxNumberOfMessages: maxMessagesToReceive,
    MessageAttributeNames: ["output"],
    WaitTimeSeconds: 20,
  };

  SQS.receiveMessage(sqsParams, function (err, data) {
    if (err) {
      console.log("Receive Error", err);
    } else if (data.Messages) {
      console.log(`Received ${data.Messages.length} messages.`);

      data.Messages.forEach((message) => {
        const messageBody = message.Body;
        const outputAttribute = message.MessageAttributes.output.StringValue;

        // Add the message body as a key to resultDict with the output attribute value as the value
        resultDict[messageBody] = outputAttribute;

        // Delete the processed message from the queue
        const deleteParams = {
          QueueUrl: responseQueueURL, // Change to your response queue URL
          ReceiptHandle: message.ReceiptHandle,
        };

        SQS.deleteMessage(deleteParams, function (err, data) {
          if (err) {
            console.log("Delete Error", err);
          } else {
            console.log("Message Deleted", data);
          }
        });
      });
    } else {
      console.log("No messages found.");
    }
  });
}

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

    const file = req.files[0];
    const base64Image = file.buffer.toString("base64");
    const fileName = file.originalname;
    const fileExtension = ".JPEG";
    const fileNamePlusIp = fileName.replace(
      ".JPEG",
      "-" + ipAddress + fileExtension
    );

    res.send("File uploaded! Starting the process...");

    uploadFile(base64Image, fileNamePlusIp);
  });
});

app.get("/receive", function (req, res) {
  const clientIp = req.ip;
  const existingKey = dataDict[clientIp];

  if (!existingKey) {
    console.log(`No image uploaded from IP address: ${clientIp}`);
    res.render("index", { dataDict, dictSize: Object.keys(dataDict).length });
  } else {
    const newKey = existingKey;
    let result = resultDict[newKey];

    while (result == null) {
      receiveMessages();
      result = resultDict[newKey];
    }

    console.log(result);
    delete dataDict[clientIp];
    delete resultDict[newKey];

    res.send("Result: " + result);
  }
});

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
  console.log("open this in browser : http://localhost:3000/");
});
