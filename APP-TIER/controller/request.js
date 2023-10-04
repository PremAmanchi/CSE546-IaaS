const AWS = require("aws-sdk");
const fs = require("fs");
const shell = require("shelljs");

// Configure AWS
AWS.config.update({
  region: "us-east-1",
  accessKeyId: "AKIAX7SHWYTIJIMWZGNT",
  secretAccessKey: "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",
});
const SQS = new AWS.SQS();
const S3 = new AWS.S3();

// Constants
const BUCKET_NAME = "input-images-cse546";
const requestQueueURL =
  "https://sqs.us-east-1.amazonaws.com/548832462032/CSE-546-PROJECT-1-REQUEST-QUEUE";

// SQS Parameters
const sqsParams = {
  MessageAttributeNames: ["All"],
  QueueUrl: requestQueueURL,
  VisibilityTimeout: 60,
  WaitTimeSeconds: 20,
};

console.log(
  "=============================================================================================="
);
// Function to upload file to S3
const uploadFile = (fileName, imageBuffer) => {
  const params = {
    Key: fileName,
    Bucket: BUCKET_NAME,
    Body: imageBuffer, // Set the image data as the body of the request
  };

  S3.upload(params, function (err, data) {
    if (err) {
      console.log("Image not uploded to S3 : " + err);
    }
    console.log("Image uploaded successfully to S3: ", data.Location);
  });
};

// Function to process messages
SQS.receiveMessage(sqsParams, function (err, data) {
  if (err) {
    console.log("Receive Error from request Queue : ", err);
  } else if (data.Messages) {
    // Delete message parameters
    const deleteParams = {
      QueueUrl: requestQueueURL,
      ReceiptHandle: data.Messages[0].ReceiptHandle,
    };

    console.log("Polled the message from SQS request Queue!!");

    // Get the image data from the message body
    const imageBuffer = Buffer.from(data.Messages[0].Body, "base64");
    // Extract Image name from Message At
    const imagePlusIp =
      data.Messages[0].MessageAttributes.fileNamePlusIp.StringValue;
    // const image_name = imagePlusIp.split("/")[0];
    console.log("Image label : " + imagePlusIp + "(appended the input IP)");
    // console.log("base 64 encoded Image : " + data.Messages[0].Body); //logs encoded image

    // Save the image locally
    fs.writeFileSync(
      "/home/ubuntu/app-tier/classifier/" + imagePlusIp,
      imageBuffer
    );

    // Upload the image to S3 with the specified image name
    uploadFile(imagePlusIp, imageBuffer);

    // Delete the processed message
    SQS.deleteMessage(deleteParams, function (err, data) {
      if (err) {
        console.log("Delete Error from SQS request Queue : ", err);
        shell.exec("/home/ubuntu/app-tier/terminate.sh");
      } else {
        console.log("Message Deleted from SQS request Queue : ", data);
      }
    });
  } else {
    console.log("No messages found.");
    shell.exec("/home/ubuntu/app-tier/terminate.sh");
  }
});
