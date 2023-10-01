const AWS = require("aws-sdk");
AWS.config.update({ region: "us-east-1" });
// const shell = require('shelljs');
var SQS = new AWS.SQS({
  accessKeyId: "AKIAX7SHWYTIJIMWZGNT",
  secretAccessKey: "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",
});

const fs = require("fs");

const BUCKET_NAME = "input-images-cse546";
var S3 = new AWS.S3({
  accessKeyId: "AKIAX7SHWYTIJIMWZGNT",
  secretAccessKey: "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",
});

var requestQueueURL =
  "https://sqs.us-east-1.amazonaws.com/548832462032/CSE-546-PROJECT-1-REQUEST-QUEUE";

var params = {
  // AttributeNames: ["SentTimestamp"],
  // MaxNumberOfMessages: 1,
  MessageAttributeNames: ["All"],
  QueueUrl: requestQueueURL,
  VisibilityTimeout: 10,
  WaitTimeSeconds: 20,
};

SQS.receiveMessage(params, function (err, data) {
  if (err) {
    console.log("Receive Error", err);
  } else if (data.Messages) {
    var deleteParams = {
      QueueUrl: requestQueueURL,
      ReceiptHandle: data.Messages[0].ReceiptHandle,
    };

    // console.log(data.Messages[0].MessageAttributes.S3_URL.StringValue)

    s3_url = data.Messages[0].MessageAttributes.S3_URL.StringValue;
    s3_image_name = s3_url.split("/");
    image_name = s3_image_name[s3_image_name.length - 1];
    downloadFile(image_name);
    SQS.deleteMessage(deleteParams, function (err, data) {
      // if (err) {
      //   console.log("Delete Error", err);
      // } else {
      //   console.log("Message Deleted", data);
      // }
    });
  } else {
    console.log("no messages!!");
    // shell.exec("/home/ubuntu/CC_Project_App_Tier/terminate_app_tier.sh");
  }
});

const downloadFile = (fileName) => {
  var params = {
    Key: fileName,
    Bucket: BUCKET_NAME,
  };
  S3.getObject(params, function (err, data) {
    if (err) {
      throw err;
    }
    if (data.Body) {
      // fs.writeFileSync(
      //   "/home/ubuntu/CC_Project_App_Tier/classifier/" + fileName,
      //   data.Body
      // );
      fs.writeFileSync(
        "/Users/premkumaramanchi/CODE/DEV/CSE546-IaaS/APP-TIER/classifier/" +
          fileName,
        data.Body
      );
      console.log("file downloaded successfully");
    }
  });
};
