const AWS = require("aws-sdk");
const sleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

// AWS Configuration
AWS.config.update({
  region: "us-east-1",
  accessKeyId: "AKIAX7SHWYTIJIMWZGNT",
  secretAccessKey: "+IyMj0veGD7ByGhpNtnRuARjy3kzQz9ujiMHnlTU",
});

// Define your SQS queue URL and other parameters
const queueUrl =
  "https://sqs.us-east-1.amazonaws.com/548832462032/CSE-546-PROJECT-1-REQUEST-QUEUE";
const maxInstances = 10; // Maximum number of instances to create
const userDataScript = "#!/bin/bash\n node /home/ubuntu/app-tier/script.js &";
const userDataBase64 = Buffer.from(userDataScript).toString("base64");
// Create an SQS and EC2 client
const sqs = new AWS.SQS();
const ec2 = new AWS.EC2();

async function createInstance() {
  const params = {
    ImageId: "ami-037800be2d01c9c6a",
    MinCount: 1,
    MaxCount: 1,
    InstanceType: "t2.micro", // Replace with your desired instance type
    KeyName: "web-tier-1", // Replace with your key pair name
    SecurityGroups: ["app-tier-sg"], // Replace with your security group name(s)
    UserData: userDataBase64,
    // Add other instance parameters as needed
  };

  try {
    const data = await ec2.runInstances(params).promise();
    const instanceId = data.Instances[0].InstanceId;
    console.log(`Created EC2 instance with ID: ${instanceId}`);
    return instanceId;
  } catch (error) {
    console.error("Error creating EC2 instance:", error);
    return null;
  }
}
createInstance();
sleep(100000);
