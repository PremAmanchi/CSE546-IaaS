// Import modules
const AWS = require("aws-sdk");
const path = require("path");
const fs = require("fs");
// const { ifError } = require("assert");

// configure
AWS.config.update({ region: "us-east-1" });

// Define sqs url's
const sqs_request_url =
  "https://sqs.us-east-1.amazonaws.com/548832462032/CSE-546-PROJECT-1-REQUEST-QUEUE";

// Define the local path to the image files
const imageFilePath =
  "/Users/premkumaramanchi/CODE/DEV/CSE546-IaaS/APP-TIER/imagenet-100/test_9.JPEG";

// Extract the image name from the imageFilePath
const fileName = path.basename(imageFilePath);

const SQS = new AWS.SQS({
  accessKeyId: "AKIAX7SHWYTIJIMWZGNT",
  secretAccessKey: "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",
});

// Create an S3 object with AWS credentials
// Define S3 bucket name
const BUCKET_NAME = "input-images-cse546";
const S3 = new AWS.S3({
  accessKeyId: "AKIAX7SHWYTIJIMWZGNT",
  secretAccessKey: "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",
});

// Function to send to S3 and send to SQS
const UploadFile = (fileName) => {
  // const path = require("path");
  // const fileContent = fs.readFileSync(path.resolve(__dirname, "./uploads/" + fileName));
  const fileContent = fs.readFileSync(imageFilePath);
  const params = {
    Bucket: BUCKET_NAME,
    Key: fileName,
    Body: fileContent,
  };

  S3.upload(params, (err, data) => {
    if (err) {
      console.log(err);
    } else {
      console.log("Upload Done successfu!!" + data.Location);
      SendToQueue(data.Location);
      // fs.unlinkSync('uploads/' + fileName);
    }
  });
};

// Function to send to SQS
const SendToQueue = (url) => {
  var params = {
    // DelaySeconds: 0,
    MessageAttributes: {
      S3_URL: {
        DataType: "String",
        StringValue: url,
      },
    },
    MessageBody: "S3 URLs.",
    QueueUrl: sqs_request_url,
  };

  SQS.sendMessage(params, function (err, data) {
    if (err) {
      console.log("Error", err);
    } else {
      console.log("Message Sent Successfu!!", data.MessageId);
    }
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

// SendToQueue(fileName);
// ReceiveFromQueue();
UploadFile(fileName);
