const AWS = require("aws-sdk");

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

resultDict = {};
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
    console.log("underSQS", data);

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

receiveMessages();
