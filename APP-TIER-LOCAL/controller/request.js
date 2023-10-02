const AWS = require("aws-sdk");
const fs = require("fs");

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
  VisibilityTimeout: 10,
  WaitTimeSeconds: 20,
};

// Function to upload file to S3
const uploadFile = (fileName, imageBuffer) => {
  const params = {
    Key: fileName,
    Bucket: BUCKET_NAME,
    Body: imageBuffer, // Set the image data as the body of the request
  };

  S3.upload(params, function (err, data) {
    if (err) {
      console.log(err);
    }
    console.log("File uploaded successfully: ", data.Location);
  });
};

// Function to process messages
SQS.receiveMessage(sqsParams, function (err, data) {
  if (err) {
    console.log("Receive Error", err);
  } else if (data.Messages) {
    // Delete message parameters
    const deleteParams = {
      QueueUrl: requestQueueURL,
      ReceiptHandle: data.Messages[0].ReceiptHandle,
    };

    console.log("Polled the message!!");

    // Get the image data from the message body
    const imageBuffer = Buffer.from(data.Messages[0].Body, "base64");
    // Extract Image name from Message At
    const imagePlusIp =
      data.Messages[0].MessageAttributes.fileNamePlusIp.StringValue;
    // const image_name = imagePlusIp.split("/")[0];
    console.log("Image label : " + imagePlusIp);
    // console.log("base 64 encoded Image : " + data.Messages[0].Body); //logs encoded image

    // Save the image locally
    fs.writeFileSync(
      "/Users/premkumaramanchi/CODE/DEV/CSE546-IaaS/APP-TIER/classifier/" +
        imagePlusIp,
      imageBuffer
    );

    // Upload the image to S3 with the specified image name
    uploadFile(imagePlusIp, imageBuffer);

    // Delete the processed message
    SQS.deleteMessage(deleteParams, function (err, data) {
      if (err) {
        console.log("Delete Error", err);
      } else {
        console.log("Message Deleted", data);
      }
    });
  } else {
    console.log("No messages found.");
  }
});
