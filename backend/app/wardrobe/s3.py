import boto3
import os
from botocore.exceptions import NoCredentialsError
from typing import Optional

AWS_ACCESS_KEY = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
S3_BUCKET = os.getenv("S3_BUCKET")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")

s3_client = boto3.client(
    "s3",
    aws_access_key_id=AWS_ACCESS_KEY,
    aws_secret_access_key=AWS_SECRET_KEY,
    region_name=AWS_REGION
)

def upload_file_to_s3(file_data, object_name: str) -> Optional[str]:
    try:
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=object_name,
            Body=file_data,
            ContentType="image/jpeg"
        )
        return f"https://{S3_BUCKET}.s3.{AWS_REGION}.amazonaws.com/{object_name}"
    except NoCredentialsError:
        print("Credentials not available")
        return None
    except Exception as e:
        print(f"Error uploading to S3: {e}")
        return None

def delete_file_from_s3(object_name: str):
    try:
        s3_client.delete_object(Bucket=S3_BUCKET, Key=object_name)
    except Exception as e:
        print(f"Error deleting from S3: {e}")
