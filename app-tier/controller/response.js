const AWS = require("aws-sdk");
const fs = require("fs").promises; // Use fs.promises for async file operations
const shell = require("shelljs");
const util = require("util");

// Configure AWS
AWS.config.update({
  region: "us-east-1",
  accessKeyId: "AKIAX7SHWYTIJIMWZGNT",
  secretAccessKey: "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",
});
const SQS = new AWS.SQS();
const S3 = new AWS.S3();

const BUCKET_NAME = "output-images-cse546";

const requestQueueURL =
  "https://sqs.us-east-1.amazonaws.com/548832462032/CSE-546-PROJECT-1-REQUEST-QUEUE";
const responseQueueURL =
  "https://sqs.us-east-1.amazonaws.com/548832462032/CSE-546-PROJECT-1-RESPONSE-QUEUE";

// Promisified versions of functions
const sendMessage = util.promisify(SQS.sendMessage).bind(SQS);
const uploadS3 = util.promisify(S3.upload).bind(S3);
const deleteMessage = util.promisify(SQS.deleteMessage).bind(SQS);

// Main async function
(async () => {
  try {
    // Read data from the file
    const data = await fs.readFile(
      "/home/ubuntu/app-tier/controller/output.txt",
      "utf8"
    );

    console.log("Results from ML model: " + data);
    const key = data.split("#")[0];
    const value = data.split("#")[1];
    const file_content = key + "=" + value;
    const fileName = key.split("/")[1] + ".txt";

    // Remove the local file
    await fs.unlink("/home/ubuntu/app-tier/classifier/" + key);

    // Upload the result to S3
    const s3Params = {
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: file_content,
    };
    const s3UploadResult = await uploadS3(s3Params);

    console.log("Result uploaded to S3:", s3UploadResult.Location);
    console.log("Result content for SQS response Queue: " + file_content);

    // Send the message to SQS
    const output = file_content;
    const sqsParams = {
      MessageAttributes: {
        output: {
          DataType: "String",
          StringValue: output.split("=")[1],
        },
      },
      MessageBody: output.split("=")[0],
      QueueUrl: responseQueueURL,
    };

    const sqsSendMessageResult = await sendMessage(sqsParams);

    console.log(
      "Success Results to response SQS: ",
      sqsSendMessageResult.MessageId
    );

    // Clean up local files
    await fs.unlink("/home/ubuntu/app-tier/controller/output.txt");

    // Define the attribute name for message count
    const attributeName = "ApproximateNumberOfMessages";
    const attributeNames = [attributeName];

    const sizeParams = {
      QueueUrl: requestQueueURL,
      AttributeNames: attributeNames,
    };

    // Get the approximate number of messages in the queue
    const sqsQueueAttributes = await util
      .promisify(SQS.getQueueAttributes)
      .bind(SQS)(sizeParams);

    const messageCount = parseInt(sqsQueueAttributes.Attributes[attributeName]);
    if (messageCount === 0) {    
      shell.exec("/home/ubuntu/app-tier/terminate.sh");
    } else {
      shell.exec("/home/ubuntu/app-tier/app_tier.sh");
    }
  } catch (error) {
    console.error("Error:", error);
    shell.exec("/home/ubuntu/app-tier/terminate.sh");
  }
})();

// const AWS = require("aws-sdk");
// AWS.config.update({ region: "us-east-1" });
// const fs = require("fs");
// const shell = require("shelljs");

// // Configure AWS
// AWS.config.update({
//   region: "us-east-1",
//   accessKeyId: "AKIAX7SHWYTIJIMWZGNT",
//   secretAccessKey: "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",
// });
// const SQS = new AWS.SQS();
// const S3 = new AWS.S3();

// const BUCKET_NAME = "output-images-cse546";

// const requestQueueURL =
//   "https://sqs.us-east-1.amazonaws.com/548832462032/CSE-546-PROJECT-1-REQUEST-QUEUE";
// const responseQueueURL =
//   "https://sqs.us-east-1.amazonaws.com/548832462032/CSE-546-PROJECT-1-RESPONSE-QUEUE";

// // send message to the SQS
// const sendMessage = (output) => {
//   var params = {
//     MessageAttributes: {
//       output: {
//         DataType: "String",
//         StringValue: output.split("=")[1],
//       },
//     },
//     MessageBody: output.split("=")[0],
//     QueueUrl: responseQueueURL,
//   };

//   SQS.sendMessage(params, function (err, data) {
//     if (err) {
//       console.log("Error : Results not sent to response SQS", err);
//       shell.exec("/home/ubuntu/app-tier/terminate.sh");
//     } else {
//       console.log("Success Results to response SQS : ", data.MessageId);
//     }
//   });
// };

// fs.readFile(
//   "/home/ubuntu/app-tier/controller/output.txt",
//   "utf8",
//   (err, data) => {
//     console.log("Results from ML model : " + data);
//     const key = data.split("#")[0];
//     const value = data.split("#")[1];
//     //   value = value.replace("\n", "").replace("\r", "");
//     const file_content = key + "=" + value;
//     const fileName = key.split(".")[0] + ".txt";
//     fs.unlinkSync("/home/ubuntu/app-tier/classifier/" + key);
//     // Save the result as a text file in S3
//     const s3Params = {
//       Bucket: BUCKET_NAME,
//       Key: fileName,
//       Body: file_content,
//     };

//     S3.upload(s3Params, function (err, data) {
//       if (err) {
//         console.error("Error uploading result to S3:", err);
//       } else {
//         console.log("Result uploaded to S3:", data.Location);

//         // Send the message to SQS after uploading to S3
//         console.log("Result content for SQS response Queue : " + file_content);
//       }
//     });

//     const output = file_content;
//     // sendMessage(file_content);
//     var params = {
//       MessageAttributes: {
//         output: {
//           DataType: "String",
//           StringValue: output.split("=")[1],
//         },
//       },
//       MessageBody: output.split("=")[0],
//       QueueUrl: responseQueueURL,
//     };

//     SQS.sendMessage(params, function (err, data) {
//       if (err) {
//         console.log("Error : Results not sent to response SQS", err);
//         shell.exec("/home/ubuntu/app-tier/terminate.sh");
//       } else {
//         console.log("Success Results to response SQS : ", data.MessageId);
//       }
//     });
//   }
// );

// // Clean up local files
// fs.unlinkSync("/home/ubuntu/app-tier/controller/output.txt");

// console.log(
//   "********************************************************************************************************************************"
// );

// // Define the attribute name for message count
// const attributeName = "ApproximateNumberOfMessages";

// // Define the attribute names you want to retrieve
// const attributeNames = [attributeName];

// const sizeParams = {
//   QueueUrl: requestQueueURL,
//   AttributeNames: attributeNames,
// };

// // Get the approximate number of messages in the queue
// SQS.getQueueAttributes(sizeParams, function (err, data) {
//   if (err) {
//     console.error("Error getting queue attributes:", err);
//     shell.exec("/home/ubuntu/app-tier/terminate.sh");
//   } else {
//     const messageCount = parseInt(data.Attributes[attributeName]);
//     if (messageCount === 0) {
//       shell.exec("/home/ubuntu/app-tier/terminate.sh");
//     } else {
//       // Execute the app_tier.sh script only when there are messages
//       shell.exec("/home/ubuntu/app-tier/app_tier.sh");
//     }
//   }
// });
