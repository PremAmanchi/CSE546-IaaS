// Import required AWS SDK and define a sleep function
const AWS = require("aws-sdk");
const sleep = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

// Configure AWS credentials and region
AWS.config.update({
  region: "us-east-1",
  accessKeyId: "AKIAX7SHWYTIJIMWZGNT",
  secretAccessKey: "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",
});

// Define the SQS queue URL and other parameters
const queueUrl =
  "https://sqs.us-east-1.amazonaws.com/548832462032/CSE-546-PROJECT-1-REQUEST-QUEUE";
const maxInstances = 20; // Maximum number of instances to create + count of instance present in EC2
const userDataScript =
  "#!/bin/bash\nsu - ubuntu -c /home/ubuntu/app-tier/app_tier.sh";
const userDataBase64 = Buffer.from(userDataScript).toString("base64");

// Create an SQS and EC2 client instances
const sqs = new AWS.SQS();
const ec2 = new AWS.EC2();

// Initialize a counter for naming instances
let instanceCounter = 1;

// Function to create an EC2 instance
async function createInstance() {
  // Generate a unique instance name
  const instanceName = `app-tier-${instanceCounter}`;
  instanceCounter++;

  // Define parameters for creating the instance
  const params = {
    ImageId: "ami-0b25e5d8fc7a6c902",
    MinCount: 1,
    MaxCount: 1,
    InstanceType: "t2.micro", // Replace with your desired instance type
    KeyName: "web-tier-1", // Replace with your key pair name
    SecurityGroups: ["app-tier-sg"], // Replace with your security group name(s)
    UserData: userDataBase64,
    // Add other instance parameters as needed
    TagSpecifications: [
      {
        ResourceType: "instance",
        Tags: [
          {
            Key: "Name",
            Value: instanceName, // Set the instance name
          },
        ],
      },
    ],
  };

  try {
    // Create the EC2 instance
    const data = await ec2.runInstances(params).promise();
    const instanceId = data.Instances[0].InstanceId;
    console.log(`Created EC2 instance with ID: ${instanceId}`);
    return instanceId;
  } catch (error) {
    console.error("Error creating EC2 instance:", error);
    return null;
  }
}

// Function to get the count of messages in the SQS queue
async function getQueueMessageCount() {
  try {
    const attributes = await sqs
      .getQueueAttributes({
        QueueUrl: queueUrl,
        AttributeNames: ["ApproximateNumberOfMessages"],
      })
      .promise();
    return parseInt(attributes.Attributes.ApproximateNumberOfMessages);
  } catch (error) {
    console.error("Error getting queue attributes:", error);
    return 0;
  }
}

// Main function for scaling in and out
async function scaleInScaleOut() {
  while (true) {
    // Get the total number of messages in the SQS queue
    const totalMsgs = await getQueueMessageCount();

    // Get information about running EC2 instances
    const instances = await ec2.describeInstances().promise();

    // Calculate the count of running EC2 instances
    const runningInstances = instances.Reservations.reduce(
      (count, reservation) =>
        count +
        reservation.Instances.filter(
          (instance) =>
            instance.State.Name === "pending" ||
            instance.State.Name === "running"
        ).length,
      0
    );

    console.log(`Messages in SQS Queue: ${totalMsgs}`);
    console.log(`Running EC2 Instances: ${runningInstances}`);

    if (totalMsgs > 0 && totalMsgs >= runningInstances) {
      const instancesToCreate = Math.min(
        maxInstances - runningInstances,
        totalMsgs / 5 + 1
      );

      if (instancesToCreate > 0) {
        for (let i = 0; i < instancesToCreate; i++) {
          const instanceId = await createInstance();
          // Add any additional logic if required for the newly created instance
          // In our case all we need to do is instantiate the ec2 only
        }
      }
    }

    await sleep(3000); // Sleep for 3 seconds before checking again (adjust as needed)
  }
}

// Start the scaling logic
scaleInScaleOut();
