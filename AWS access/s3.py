import boto3
import base64
aws_management_console = boto3.session.Session(profile_name='default') # Opening a session with AWS Management Console



sqs_console = aws_management_console.client("sqs")

queue_url = "https://sqs.us-east-1.amazonaws.com/747533823816/cse546sqs"

# Get the approximate number of messages in the queue
response = sqs_console.get_queue_attributes(
    QueueUrl=queue_url,
    AttributeNames=[
        'ApproximateNumberOfMessages'
    ]
)
print(response)
# Extract the approximate number of messages from the response
num_messages = int(response['Attributes']['ApproximateNumberOfMessages'])
print(num_messages)
print("Done1")



if num_messages > 0:

    Auto_Scaling_group = aws_management_console.client("autoscaling")
    response = Auto_Scaling_group.describe_auto_scaling_groups(
        AutoScalingGroupNames=[
            'App_tier_asg'
        ]
    )
    desired_capacity = response['AutoScalingGroups'][0]['DesiredCapacity']
    desired_capacity = int(desired_capacity)

    capacity = int(num_messages/10)


    if desired_capacity < capacity:
        Auto_Scaling_group.set_desired_capacity(
                        AutoScalingGroupName='App_tier_asg', DesiredCapacity = capacity, HonorCooldown=False)

        response = Auto_Scaling_group.describe_auto_scaling_groups(
            AutoScalingGroupNames=[
                'App_tier_asg'
            ]
        )
    elif num_messages < 10:
        Auto_Scaling_group.set_desired_capacity(
                        AutoScalingGroupName='App_tier_asg', DesiredCapacity = 1, HonorCooldown=False)

        response = Auto_Scaling_group.describe_auto_scaling_groups(
            AutoScalingGroupNames=[
                'App_tier_asg'
            ]
        )
    else:
        Auto_Scaling_group.set_desired_capacity(
                        AutoScalingGroupName='App_tier_asg', DesiredCapacity = 0, HonorCooldown=False)

        response = Auto_Scaling_group.describe_auto_scaling_groups(
            AutoScalingGroupNames=[
                'App_tier_asg'
            ]
        )

    print(response)

# The below code is only to make the desired instances to zero even there are messages in the queue because we don't want to run the instances until finishing everything in the project.    
# We will remove the below code at the time of deployment.
Auto_Scaling_group.set_desired_capacity(
                        AutoScalingGroupName='App_tier_asg', DesiredCapacity = 0, HonorCooldown=False)