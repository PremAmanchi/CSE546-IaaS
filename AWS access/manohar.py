import boto3
import base64
aws_management_console = boto3.session.Session(profile_name='default') # Opening a session with AWS Management Console
# iam_console = aws_management_console.resource('iam') 
# iam_client = aws_management_console.client("iam")
# for i in iam_console.users.all():
#     print(i.name)
# result = iam_client.list_users()
# for i in result['Users']:
#     print(i['UserName'])

# ec2_client = aws_management_console.client("ec2")

# result1 = ec2_client.describe_instances()

# # pprint(result1)


# for i in result1["Reservations"]:
#     print(i["Instances"][0]["InstanceId"])

# ec2_resource = aws_management_console.resource("ec2")

# print(ec2_resource.instances.all())


sqs_console = aws_management_console.client("sqs")

queue_url = "https://sqs.us-east-1.amazonaws.com/548832462032/inQueue"

# Receive a message from the queue
message = sqs_console.receive_message(QueueUrl=queue_url)

# Print the message body
print(message['Messages'][0]['Body'])

image  = "/pic/test_0.jpeg"

with open(image, "rb") as image_file:
    encoded_string = base64.b64encode(image_file.read())
    print(encoded_string)
    print(type(encoded_string))

send_message = sqs_console.send_message(QueueUrl=queue_url, MessageBody=encoded_string.decode('utf-8'))
print("Done")