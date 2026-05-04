import boto3
import os
from botocore.exceptions import NoCredentialsError
from typing import Optional

S3_BUCKET = os.getenv("S3_BUCKET", "placeholder-bucket")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
STORAGE_TYPE = os.getenv("STORAGE_TYPE", "local") 

s3_client = None
if STORAGE_TYPE == "s3":
    s3_client = boto3.client(
        "s3",
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        region_name=AWS_REGION
    )

def upload_file_to_s3(file_data, object_name: str) -> Optional[str]:
    if STORAGE_TYPE == "local":
        print(f"🛠️ LOCAL MODE: Skipping upload for {object_name}")
        return object_name

    if not s3_client:
        print("❌ S3 Client not initialized. Check STORAGE_TYPE and credentials.")
        return None

    try:
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=object_name,
            Body=file_data,
            ContentType="image/jpeg"
        )
        return object_name
    except Exception as e:
        print(f"Error uploading to S3: {e}")
        return None

def get_image_url(object_name: str) -> str:
    if not object_name:
        return "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=400"
        
    if object_name.startswith("http"):
        return object_name
        
    if STORAGE_TYPE == "local":
        #placeholder based on the object_name
        return f"https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=400"

    try:
        url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': S3_BUCKET, 'Key': object_name},
            ExpiresIn=3600
        )
        return url
    except Exception:
        return "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=400"

def delete_file_from_s3(object_name: str):
    if STORAGE_TYPE == "local" or not s3_client: 
        return
    try:
        s3_client.delete_object(Bucket=S3_BUCKET, Key=object_name)
    except Exception as e:
        print(f"Error deleting from S3: {e}")
