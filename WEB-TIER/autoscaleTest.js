const AWS = require("aws-sdk");
// const sleep = (milliseconds) =>
//   new Promise((resolve) => setTimeout(resolve, milliseconds));

// AWS Configuration
AWS.config.update({
  region: "us-east-1",
  accessKeyId: "AKIAX7SHWYTIJIMWZGNT",
  secretAccessKey: "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",
});
const userDataBuffer = Buffer.from(
  "#!/bin/bash\n/home/ubuntu/app-tier/app_tier.sh"
).toString("base64");
console.log(userDataBuffer);
// Create an EC2 client
const ec2 = new AWS.EC2();

// Define your EC2 instance launch parameters
const params = {
  ImageId: "ami-080b4dea04963c574",
  MinCount: 1,
  MaxCount: 1,
  InstanceType: "t2.micro", // Replace with your desired instance type
  KeyName: "web-tier-1", // Replace with your key pair name
  SecurityGroups: ["app-tier-sg"], // Replace with your security group name(s)
  UserData: userDataBuffer,
  // Add other instance parameters as needed
};

// Launch the EC2 instance
ec2.runInstances(params, (err, data) => {
  if (err) {
    console.error("Error launching EC2 instance:", err);
  } else {
    console.log(
      "Successfully launched EC2 instance with ID:",
      data.Instances[0].InstanceId
    );
  }
});
