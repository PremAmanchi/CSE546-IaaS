import boto3
import os

# AWS configuration
aws_region = 'your-region-name'
queue_name = 'inQueue'  # Name your SQS queue as "inQueue"
s3_bucket_name = 'your-s3-bucket-name'

# Initialize SQS and S3 clients
sqs_client = boto3.client('sqs', region_name=aws_region)
s3_client = boto3.client('s3', region_name=aws_region)

# Create an SQS queue or get the URL if it already exists
response = sqs_client.create_queue(QueueName=queue_name)
queue_url = response['QueueUrl']

# Function to upload an image to SQS and S3
def upload_image(image_path):
    # Upload the image to S3
    image_key = os.path.basename(image_path)
    s3_client.upload_file(image_path, s3_bucket_name, image_key)
    s3_image_url = f'https://{s3_bucket_name}.s3.amazonaws.com/{image_key}'
    
    # Send the S3 image URL to SQS
    sqs_client.send_message(QueueUrl=queue_url, MessageBody=s3_image_url)
    
    print(f"Image uploaded to S3: {s3_image_url}")
    print(f"Image URL sent to SQS: {s3_image_url}")

if __name__ == '__main__':
    # Path to the image file you want to upload
    image_path_to_upload = 'path-to-your-image.jpg'
    
    # Upload the image to SQS and S3
    upload_image(image_path_to_upload)
