import boto3
import os

S3_BUCKET = os.getenv("S3_BUCKET")
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")

s3_client = boto3.client(
    's3',
    aws_access_key_id=AWS_ACCESS_KEY_ID,
    aws_secret_access_key=AWS_SECRET_ACCESS_KEY
)

def upload_file_to_s3(file_content, filename):
    s3_client.put_object(
        Bucket=S3_BUCKET,
        Key=filename,
        Body=file_content
    )
    return f"https://{S3_BUCKET}.s3.amazonaws.com/{filename}"
