import boto3
import base64
import json
import os

# AWS session and SQS client setup
aws_session = boto3.Session(profile_name='default')
sqs_client = aws_session.client("sqs")

# Paths
image_path = "/Users/premkumaramanchi/CODE/DEV/CSE546cloudProject/imagenet-100/test_4.JPEG"
queue_url = "https://sqs.us-east-1.amazonaws.com/548832462032/inQ"

# Method to receive messages from SQS


def receive_sqs():
    # Receive a message from the queue
    message = sqs_client.receive_message(QueueUrl=queue_url)
    if 'Messages' in message:
        message_body = message['Messages'][0]['Body']
        # Parse the JSON message
        decoded_message = json.loads(message_body)
        encoded_image = decoded_message['encoded_image']
        original_image_name = decoded_message['original_image_name']
        print(f"Original Image Name: {original_image_name}")
        print(f"Encoded Image: {encoded_image}")

# Method to send a message to SQS


def send_sqs(encoded_image, image_path):
    # Extract the image name from the image path
    image_name = os.path.basename(image_path)

    # Create a JSON message containing the encoded image and extracted image name
    message_body = json.dumps({
        'encoded_image': encoded_image.decode('utf-8'),
        'original_image_name': image_name
    })

    # Send the JSON message to the queue
    sqs_client.send_message(QueueUrl=queue_url, MessageBody=message_body)
    print("Message sent to SQS")

# Method to encode an image


def encode_image(image_path):
    with open(image_path, "rb") as image_file:
        encoded_string = base64.b64encode(image_file.read())
    return encoded_string


if __name__ == "__main__":
    encoded_image = encode_image(image_path)
    # Send the image along with its name extracted from the URL
    # send_sqs(encoded_image, image_path)
    receive_sqs()
    print("Done")
