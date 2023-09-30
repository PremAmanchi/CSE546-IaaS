// Import modules
const AWS = require("aws-sdk");
const path = require("path");
const fs = require("fs");

// configure
AWS.config.update({ region: "us-east-1" });

// Define sqs url's
const sqs_request_url =
  "https://sqs.us-east-2.amazonaws.com/548832462032/cse-546-request-queue";

// Define the local path to the image files
const imageFilePath =
  "/Users/premkumaramanchi/CODE/DEV/CSE546-IaaS/APP-TIER-1/imagenet-100/test_4.JPEG";

// Extract the image name from the imageFilePath
const imageKey = path.basename(imageFilePath);

const SQS = new AWS.SQS({
  accessKeyId: "AKIAX7SHWYTIJIMWZGNT",
  secretAccessKey: "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",
});

// Function to send to SQS queue
const SendToQueue = () => {
  const params = {
    MessageBody: sqs_request_url,
    QueueUrl: sqs_request_url,
  };

  SQS.sendMessage(params, function (err, data) {
    if (err) console.log(err.MessageBody);
    else console.log("Message sent to Queue Successfull!!!");
  });
};

const ReceiveFromQueue = () => {
  const params = {
    QueueUrl: sqs_request_url,
  };

  SQS.receiveMessage(params, (err, data) => {
    if (err) console.log(err);
    else if (data.Messages && data.Messages.length > 0) {
      const message = data.Messages[0];
      const receiptHandle = message.ReceiptHandle;
      console.log(message);
      // Use the receiptHandle as needed (e.g., to delete the message)
    } else {
      console.log("No messages received");
    }
  });
};

// SendToQueue();
ReceiveFromQueue();
