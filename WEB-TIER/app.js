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
const upload = multer({ storage: storage }).array("myfile", 1);

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
const receiveMessages = async () => {
  // set some max num messages to poll from queue
  const maxMessagesToReceive = 1;
  // console.log("insideReceive");

  const sqsParams = {
    QueueUrl: responseQueueURL,
    MaxNumberOfMessages: maxMessagesToReceive,
    MessageAttributeNames: ["output"],
    WaitTimeSeconds: 20,
  };
  console.log("belowSQS");

  try {
    const data = await SQS.receiveMessage(sqsParams).promise();
    console.log("underSQS");

    if (data.Messages) {
      console.log(`Received ${data.Messages.length} messages.`);

      for (const message of data.Messages) {
        const messageBody = message.Body;
        const outputAttribute = message.MessageAttributes.output.StringValue;

        // Add the message body as a key to resultDict with the output attribute value as the value
        resultDict[messageBody] = outputAttribute;

        // Delete the processed message from the queue
        const deleteParams = {
          QueueUrl: responseQueueURL, // Change to your response queue URL
          ReceiptHandle: message.ReceiptHandle,
        };

        // const deleteResponse = await SQS.deleteMessage(deleteParams).promise();

        // console.log("Message Deleted", deleteResponse);
      }
    } else {
      console.log("No messages found.");
    }
  } catch (err) {
    console.error("Receive Error", err);
  }
};

app.post("/", (req, res) => {
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
    dataDict[ipAddress] = fileNamePlusIp;
    const dictSize = Object.keys(dataDict).length;
    console.log("dataDict Size : " + dictSize);
    res.send("File uploaded! Starting the process...");
    uploadFile(base64Image, fileNamePlusIp);
  });
});

app.get("/receive", async function (req, res) {
  const clientIp = req.ip;
  const existingKey = dataDict[clientIp];
  const dictSize = Object.keys(dataDict).length;
  console.log("dataDict Size : " + dictSize);

  if (existingKey == null) {
    console.log(`No image uploaded from IP address: ${clientIp}`);
    res.send(`No image uploaded from IP address: ${clientIp}`);
    // res.render("index", { dataDict, dictSize: Object.keys(dataDict).length });
  } else {
    console.log(existingKey);
    const newKey = existingKey;
    let result = resultDict[newKey];
    const resDictSize = Object.keys(resultDict).length;
    console.log("dataDict Size : " + resDictSize);

    while (result == null) {
      await receiveMessages();
      console.log("dataDict Size : " + resDictSize);
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
