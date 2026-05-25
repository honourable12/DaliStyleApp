import boto3
import os
import logging
from botocore.exceptions import NoCredentialsError, ClientError
from botocore.config import Config
from typing import Optional

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO)

S3_BUCKET = os.getenv("S3_BUCKET", "daily-style-assets")
AWS_REGION = os.getenv("AWS_REGION", "us-east-1")
STORAGE_TYPE = os.getenv("STORAGE_TYPE", "local") 
S3_ENDPOINT_URL = os.getenv("S3_ENDPOINT_URL")
# The endpoint accessible from the browser (e.g., localhost instead of floci)
S3_EXTERNAL_ENDPOINT_URL = os.getenv("S3_EXTERNAL_ENDPOINT_URL", S3_ENDPOINT_URL)

s3_client = None
if STORAGE_TYPE == "s3":
    logger.info(f"🔌 Initializing S3 Client (Bucket: {S3_BUCKET}, Endpoint: {S3_ENDPOINT_URL})")
    
    # Render + LocalStack/Floci requires Path Style addressing
    s3_config = Config(
        s3={'addressing_style': 'path'},
        signature_version='s3v4',
        retries={'max_attempts': 3}
    )

    s3_client = boto3.client(
        "s3",
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID", "test"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY", "test"),
        region_name=AWS_REGION,
        endpoint_url=S3_ENDPOINT_URL,
        config=s3_config
    )
    
    # Ensure bucket exists
    try:
        s3_client.head_bucket(Bucket=S3_BUCKET)
        logger.info(f" S3 Bucket '{S3_BUCKET}' verified.")
    except ClientError as e:
        error_code = e.response.get('Error', {}).get('Code')
        if error_code == '404':
            logger.info(f" S3 Bucket '{S3_BUCKET}' missing. Creating...")
            try:
                s3_client.create_bucket(Bucket=S3_BUCKET)
                logger.info(f" S3 Bucket '{S3_BUCKET}' created successfully.")
            except Exception as create_err:
                logger.error(f"❌ Failed to create S3 bucket: {create_err}")
        else:
            logger.error(f"❌ Error checking S3 bucket: {e}")
    except Exception as e:
        logger.error(f"❌ Unexpected error initializing S3: {e}")

def upload_file_to_s3(file_data, object_name: str) -> Optional[str]:
    if STORAGE_TYPE == "local":
        logger.info(f" LOCAL MODE: Skipping upload for {object_name}")
        return object_name

    if not s3_client:
        logger.error("❌ S3 Client not initialized. Check STORAGE_TYPE and credentials.")
        return None

    try:
        s3_client.put_object(
            Bucket=S3_BUCKET,
            Key=object_name,
            Body=file_data,
            ContentType="image/jpeg"
        )
        return object_name
    except ClientError as e:
        logger.error(f"Error uploading to S3 ({e.response['Error']['Code']}): {e}")
        return None
    except Exception as e:
        logger.error(f"Error uploading to S3: {e}")
        return None

def get_image_url(object_name: str) -> str:
    if not object_name:
        return "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=400"
        
    if object_name.startswith("http"):
        return object_name
        
    if STORAGE_TYPE == "local" or not s3_client:
        return f"https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=400"

    try:
        url = s3_client.generate_presigned_url(
            'get_object',
            Params={'Bucket': S3_BUCKET, 'Key': object_name},
            ExpiresIn=3600
        )
        
        if S3_EXTERNAL_ENDPOINT_URL and S3_ENDPOINT_URL and S3_EXTERNAL_ENDPOINT_URL != S3_ENDPOINT_URL:
            internal = S3_ENDPOINT_URL.rstrip('/')
            external = S3_EXTERNAL_ENDPOINT_URL.rstrip('/')
            url = url.replace(internal, external)
            
        return url
    except Exception:
        return "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=400"

def delete_file_from_s3(object_name: str):
    if STORAGE_TYPE == "local" or not s3_client: 
        return
    try:
        s3_client.delete_object(Bucket=S3_BUCKET, Key=object_name)
    except Exception as e:
        logger.error(f"Error deleting from S3: {e}")
