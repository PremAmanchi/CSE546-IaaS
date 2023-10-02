const AWS = require("aws-sdk");
AWS.config.update({ region: "us-east-1" });
const fs = require("fs");

// Configure AWS
AWS.config.update({
  region: "us-east-1",
  accessKeyId: "AKIAX7SHWYTIJIMWZGNT",
  secretAccessKey: "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",
});
const SQS = new AWS.SQS();
const S3 = new AWS.S3();

const BUCKET_NAME = "output-images-cse546";

const responseQueueURL =
  "https://sqs.us-east-1.amazonaws.com/548832462032/CSE-546-PROJECT-1-RESPONSE-QUEUE";

// send message to the SQS
const sendMessage = (output) => {
  var params = {
    MessageAttributes: {
      output: {
        DataType: "String",
        StringValue: output.split("=")[1],
      },
    },
    MessageBody: output.split("=")[0],
    QueueUrl: responseQueueURL,
  };

  SQS.sendMessage(params, function (err, data) {
    if (err) {
      console.log("Error : ", err);
    } else {
      console.log("Success", data.MessageId);
    }
  });
};



fs.readFile(
  "/Users/premkumaramanchi/CODE/DEV/CSE546-IaaS/APP-TIER/controller/output.txt",
  "utf8",
  (err, data) => {
    console.log(data);
    const key = data.split("#")[0];
    const value = data.split("#")[1];
    //   value = value.replace("\n", "").replace("\r", "");
    const file_content = key + "=" + value;
    const fileName = key.split(".")[0] + ".txt";
    fs.unlinkSync(
      "/Users/premkumaramanchi/CODE/DEV/CSE546-IaaS/APP-TIER/classifier/" + key
    );
    // Save the result as a text file in S3
    const s3Params = {
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: file_content,
    };

    S3.upload(s3Params, function (err, data) {
      if (err) {
        console.error("Error uploading result to S3:", err);
      } else {
        console.log("Result uploaded to S3:", data.Location);

        // Send the message to SQS after uploading to S3
        console.log(file_content);
        sendMessage(file_content);
      }
    });
  }
);

// Clean up local files
fs.unlinkSync(
  "/Users/premkumaramanchi/CODE/DEV/CSE546-IaaS/APP-TIER/controller/output.txt"
);
