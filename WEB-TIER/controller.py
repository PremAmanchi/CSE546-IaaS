from flask import Flask, request, jsonify
import boto3
from botocore.exceptions import NoCredentialsError
from PIL import Image

app = Flask(__name__)

@app.route('/upload', methods=['POST'])
def upload_image():
    try:
        image_file = request.files['image']
        if image_file:
            # Upload the image to AWS S3 or any other storage service if needed
            # Then, send a message to the SQS queue with the image URL or key
            s3_url = upload_image_to_s3(image_file)
            send_message_to_sqs(s3_url)
            return jsonify({"message": "Image uploaded and sent to SQS successfully."}), 200
        else:
            return jsonify({"error": "No image file provided."}), 400
    except Exception as e:
        return jsonify({"error": str(e)}), 500

def upload_image_to_s3(image_file):
    # Use Boto3 to upload the image to an S3 bucket
    s3 = boto3.client('s3', region_name='your-region-name')
    bucket_name = 'your-s3-bucket-name'
    s3_key = 'images/' + image_file.filename  # Adjust the key as needed
    s3.upload_fileobj(image_file, bucket_name, s3_key)
    s3_url = f'https://{bucket_name}.s3.amazonaws.com/{s3_key}'
    return s3_url

def send_message_to_sqs(image_url):
    # Use Boto3 to send a message to the SQS queue
    sqs = boto3.client('sqs', region_name='your-region-name')
    queue_url = 'your-sqs-queue-url'
    sqs.send_message(QueueUrl=queue_url, MessageBody=image_url)

if __name__ == '__main__':
    app.run(debug=True)
