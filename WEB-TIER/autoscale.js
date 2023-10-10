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
const maxInstances = 20; // Maximum number of instances to create
const userDataScript =
  "#!/bin/bash\nsu - ubuntu -c /home/ubuntu/app-tier/app_tier.sh";
const userDataBase64 = Buffer.from(userDataScript).toString("base64");
// Create an SQS and EC2 client
const sqs = new AWS.SQS();
const ec2 = new AWS.EC2();

let instanceCounter = 1;

async function createInstance() {
  const instanceName = `app-tier-${instanceCounter}`;
  instanceCounter++;

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
            Value: instanceName,
          },
        ],
      },
    ],
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

async function scaleInScaleOut() {
  while (true) {
    const totalMsgs = await getQueueMessageCount();
    const instances = await ec2.describeInstances().promise();
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

    if (totalMsgs > 0 && totalMsgs > runningInstances) {
      const instancesToCreate = Math.min(
        maxInstances - runningInstances,
        (totalMsgs/5)+1
      );

      if (instancesToCreate > 0) {
        for (let i = 0; i < instancesToCreate; i++) {
          const instanceId = await createInstance();
          // add any changes if required to instance id;
        }
      }
    }

    await sleep(3000); // Sleep for 3 seconds before checking again (adjust as needed)
  }
}

// Start the scaling logic
scaleInScaleOut();
