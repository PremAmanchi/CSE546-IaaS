// Import required modules
const AWS = require("aws-sdk");
const path = require("path");
const fs = require("fs");

// Configure AWS region
AWS.config.update({ region: "us-east-1" });

// Define S3 bucket name
const BUCKET_NAME = "input-images-cse546";

// Define the local path to the image file
const imageFilePath =
  "/Users/premkumaramanchi/CODE/DEV/CSE546-IaaS/APP-TIER-1/imagenet-100/test_4.JPEG";

// Extract the image name (file name) from the imageFilePath
const imageKey = path.basename(imageFilePath);

// Create an S3 object with AWS credentials
const s3 = new AWS.S3({
  accessKeyId: "AKIAX7SHWYTIJIMWZGNT",
  secretAccessKey: "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",
});

// Function to upload the image to S3
const uploadImage = () => {
  // Read the file content
  const fileContent = fs.readFileSync(imageFilePath);

  // Define S3 upload parameters
  const params = {
    Bucket: BUCKET_NAME,
    Key: imageKey,
    Body: fileContent,
  };

  // Upload the image to S3
  s3.upload(params, (err, data) => {
    if (err) {
      console.error("Error uploading image:", err);
    } else {
      console.log(`Image uploaded successfully. Location: ${data}`);
    }
  });
};

// Call the function to upload the image
uploadImage();
