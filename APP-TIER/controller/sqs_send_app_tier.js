const AWS = require("aws-sdk");
// const shell = require('shelljs')
AWS.config.update({ region: "us-east-1" });
var SQS = new AWS.SQS({
  accessKeyId: "AKIAX7SHWYTIJIMWZGNT",
  secretAccessKey: "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",
});
const fs = require("fs");
const BUCKET_NAME = "input-images-cse546";

const S3 = new AWS.S3({
  accessKeyId: "AKIAX7SHWYTIJIMWZGNT",
  secretAccessKey: "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",
});

const responseQueueURL =
  "https://sqs.us-east-1.amazonaws.com/548832462032/CSE-546-PROJECT-1-RESPONSE-QUEUE";

const sendMessage = (output) => {
  var params = {
    MessageAttributes: {
      output: {
        DataType: "String",
        StringValue: output,
      },
    },
    MessageBody: "SQS Response.",
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

const uploadFile = (fileName) => {
  fs.readFile(fileName, (err, data) => {
    if (err) throw err;
    const params = {
      Bucket: BUCKET_NAME,
      Key: fileName,
      Body: data,
    };

    S3.upload(params, function (err, data) {
      if (err) throw err;
    });
  });
};

fs.readFile("output.txt", "utf8", (err, data) => {
    console.log(data);
    key = data.split('#')[0];

    value = data.split("#")[1];
    value = value.replace("\n", "").replace("\r", "");
    file_content = "(" + key + "," + value + ")";
    fileName = key.split(".")[0] + ".txt";
    fs.writeFile(fileName, file_content, function (err) {
      if (err) throw err;
    });
    sendMessage(key + "#" + value);
    uploadFile(fileName);
    fs.unlinkSync("output.txt");
    fs.unlinkSync(fileName);

    
});
