import boto3
import os
import logging
import shutil
from pathlib import Path
from botocore.exceptions import ClientError
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

LOCAL_STORAGE_DIR = Path(os.getenv("LOCAL_STORAGE_DIR", "./local_storage"))


def _ensure_local_dir() -> bool:
    """Create LOCAL_STORAGE_DIR if it doesn't exist. Returns True on
    success, False on failure (e.g. read-only filesystem). Never raises."""
    try:
        LOCAL_STORAGE_DIR.mkdir(parents=True, exist_ok=True)
        return True
    except OSError:
        return False
    except Exception:
        return False


LOCAL_PUBLIC_BASE_URL = os.getenv(
    "LOCAL_PUBLIC_BASE_URL", "http://localhost:8000"
).rstrip("/")

_PLACEHOLDER_URL = (
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=400"
)

s3_client = None
if STORAGE_TYPE == "s3":
    logger.info(
        f"🔌 Initializing S3 Client (Bucket: {S3_BUCKET}, Endpoint: {S3_ENDPOINT_URL})"
    )

    # Supabase / Cloudflare / AWS S3 compatibility
    s3_config = Config(
        s3={"addressing_style": "path"},
        signature_version="s3v4",
        retries={"max_attempts": 3},
    )

    s3_client = boto3.client(
        "s3",
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        region_name=AWS_REGION,
        endpoint_url=S3_ENDPOINT_URL,
        config=s3_config,
    )

    # Ensure bucket exists
    try:
        s3_client.head_bucket(Bucket=S3_BUCKET)
        logger.info(f" S3 Bucket '{S3_BUCKET}' verified.")
    except ClientError as e:
        error_code = e.response.get("Error", {}).get("Code")
        if error_code == "404":
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
else:
    logger.info(
        f"📁 LOCAL MODE: files will be stored under {LOCAL_STORAGE_DIR.resolve()}"
    )


def upload_file_to_s3(
    file_data, object_name: str, content_type: str = "image/jpeg"
) -> Optional[str]:
    if STORAGE_TYPE == "local":
        try:
            if not _ensure_local_dir():
                logger.error(
                    "❌ LOCAL: cannot create storage directory "
                    f"{LOCAL_STORAGE_DIR} (read-only filesystem?). Upload aborted."
                )
                return None
            dest = LOCAL_STORAGE_DIR / object_name
            dest.parent.mkdir(parents=True, exist_ok=True)
            # file_data may be bytes or a file-like - handle both
            if isinstance(file_data, (bytes, bytearray)):
                dest.write_bytes(bytes(file_data))
            else:
                with open(dest, "wb") as f:
                    shutil.copyfileobj(file_data, f)
            logger.info(f" LOCAL: wrote {len(file_data) if isinstance(file_data, (bytes, bytearray)) else '?'} bytes to {dest}")
            return object_name
        except Exception as e:
            logger.error(f"Error writing local file {object_name}: {e}")
            return None

    if not s3_client:
        logger.error(
            "❌ S3 Client not initialized. Check STORAGE_TYPE and credentials."
        )
        return None

    try:
        s3_client.put_object(
            Bucket=S3_BUCKET, Key=object_name, Body=file_data, ContentType=content_type
        )
        return object_name
    except ClientError as e:
        logger.error(f"Error uploading to S3 ({e.response['Error']['Code']}): {e}")
        return None
    except Exception as e:
        logger.error(f"Error uploading to S3: {e}")
        return None


def get_local_bytes(object_name: str) -> Optional[bytes]:
    if STORAGE_TYPE != "local":
        return None
    try:
        path = LOCAL_STORAGE_DIR / object_name
        if not path.exists() or not path.is_file():
            return None
        return path.read_bytes()
    except Exception as e:
        logger.error(f"Error reading local file {object_name}: {e}")
        return None


def get_s3_bytes(object_name: str) -> Optional[bytes]:
    if STORAGE_TYPE != "s3" or not s3_client:
        return None
    try:
        obj = s3_client.get_object(Bucket=S3_BUCKET, Key=object_name)
        return obj["Body"].read()
    except ClientError as e:
        logger.error(f"Error fetching {object_name} from S3: {e}")
        return None
    except Exception as e:
        logger.error(f"Unexpected error fetching {object_name} from S3: {e}")
        return None


def get_object_bytes(object_name: str) -> Optional[bytes]:
    if not object_name or object_name.startswith("http"):
        return None
    if STORAGE_TYPE == "local":
        return get_local_bytes(object_name)
    return get_s3_bytes(object_name)


def get_image_url(object_name: str) -> str:
    """Returns a browser-accessible URL for an object."""
    if not object_name:
        return _PLACEHOLDER_URL

    if object_name.startswith("http"):
        return object_name

    if STORAGE_TYPE == "local" or not s3_client:
        local_path = LOCAL_STORAGE_DIR / object_name
        if local_path.exists():
            return f"{LOCAL_PUBLIC_BASE_URL}/static/{object_name}"
        return _PLACEHOLDER_URL

    try:
        url = s3_client.generate_presigned_url(
            "get_object",
            Params={"Bucket": S3_BUCKET, "Key": object_name},
            ExpiresIn=3600,
        )

        if (
            S3_EXTERNAL_ENDPOINT_URL
            and S3_ENDPOINT_URL
            and S3_EXTERNAL_ENDPOINT_URL != S3_ENDPOINT_URL
        ):
            internal = S3_ENDPOINT_URL.rstrip("/")
            external = S3_EXTERNAL_ENDPOINT_URL.rstrip("/")
            url = url.replace(internal, external)

        return url
    except Exception:
        return _PLACEHOLDER_URL


def delete_file_from_s3(object_name: str):
    if STORAGE_TYPE == "local":
        try:
            path = LOCAL_STORAGE_DIR / object_name
            if path.exists():
                path.unlink()
        except Exception as e:
            logger.error(f"Error deleting local file {object_name}: {e}")
        return
    if not s3_client:
        return
    try:
        s3_client.delete_object(Bucket=S3_BUCKET, Key=object_name)
    except Exception as e:
        logger.error(f"Error deleting from S3: {e}")
