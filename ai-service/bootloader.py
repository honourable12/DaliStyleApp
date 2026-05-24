import os
import boto3
import logging
from botocore.exceptions import ClientError

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
S3_ENDPOINT = os.getenv("S3_ENDPOINT", "http://floci:4566")
S3_ACCESS_KEY = os.getenv("AWS_ACCESS_KEY_ID", "test")
S3_SECRET_KEY = os.getenv("AWS_SECRET_ACCESS_KEY", "test")
MODEL_BUCKET = os.getenv("MODEL_STORE_BUCKET", "ai-models")
MODELS_DIR = "/models"

s3_client = boto3.client(
    "s3",
    endpoint_url=S3_ENDPOINT,
    aws_access_key_id=S3_ACCESS_KEY,
    aws_secret_access_key=S3_SECRET_KEY,
    region_name="us-east-1"
)

def ensure_bucket_exists():
    try:
        s3_client.head_bucket(Bucket=MODEL_BUCKET)
    except ClientError as e:
        if e.response['Error']['Code'] == '404':
            logger.info(f"Bucket {MODEL_BUCKET} not found. Creating it...")
            s3_client.create_bucket(Bucket=MODEL_BUCKET)
        else:
            raise

def download_model(model_name):
    local_path = os.path.join(MODELS_DIR, model_name)
    if os.path.exists(local_path):
        logger.info(f"Model {model_name} already exists locally.")
        return

    logger.info(f"Downloading {model_name} from S3...")
    try:
        s3_client.download_file(MODEL_BUCKET, f"models/{model_name}", local_path)
        logger.info(f"Successfully downloaded {model_name}.")
    except Exception as e:
        logger.error(f"Failed to download {model_name}: {e}")
        # If we can't download, we'll let the main app try to load it (it might download from HF)

def upload_model(model_name):
    local_path = os.path.join(MODELS_DIR, model_name)
    if not os.path.exists(local_path):
        logger.error(f"Local model {model_name} not found for upload.")
        return

    logger.info(f"Uploading {model_name} to S3 for persistence...")
    try:
        s3_client.upload_file(local_path, MODEL_BUCKET, f"models/{model_name}")
        logger.info(f"Successfully uploaded {model_name}.")
    except Exception as e:
        logger.error(f"Failed to upload {model_name}: {e}")

def sync_models(required_models):
    os.makedirs(MODELS_DIR, exist_ok=True)
    try:
        ensure_bucket_exists()
        for model in required_models:
            download_model(model)
    except Exception as e:
        logger.warning(f"S3 Model Sync failed: {e}. Proceeding with local load.")
