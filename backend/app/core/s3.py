import boto3
from botocore.client import Config
from app.core.config import settings
from app.core.logging import logger

class S3Client:
    def __init__(self):
        # Setup boto3 client pointing to AWS or local MinIO endpoint
        self.s3 = boto3.client(
            "s3",
            aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
            aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
            region_name=settings.AWS_REGION,
            endpoint_url=settings.S3_ENDPOINT_URL,
            config=Config(signature_version="s3v4")
        )
        self.bucket = settings.S3_BUCKET_NAME

    def ensure_bucket_exists(self):
        try:
            self.s3.head_bucket(Bucket=self.bucket)
            logger.info(f"S3 bucket '{self.bucket}' already exists.")
        except Exception:
            try:
                # If bucket doesn't exist, create it
                self.s3.create_bucket(Bucket=self.bucket)
                logger.info(f"S3 bucket '{self.bucket}' successfully created.")
            except Exception as e:
                logger.error(f"Failed to verify/create S3 bucket: {str(e)}")

    def upload_file(self, file_content: bytes, s3_key: str, content_type: str = "application/octet-stream") -> str:
        try:
            self.s3.put_object(
                Bucket=self.bucket,
                Key=s3_key,
                Body=file_content,
                ContentType=content_type
            )
            logger.info(f"Uploaded file to s3://{self.bucket}/{s3_key}")
            return s3_key
        except Exception as e:
            logger.error(f"Failed to upload to S3: {str(e)}")
            raise e

    def download_file(self, s3_key: str) -> bytes:
        try:
            response = self.s3.get_object(Bucket=self.bucket, Key=s3_key)
            return response["Body"].read()
        except Exception as e:
            logger.error(f"Failed to download from S3: {str(e)}")
            raise e

    def get_presigned_url(self, s3_key: str, expires_in_seconds: int = 3600) -> str:
        try:
            url = self.s3.generate_presigned_url(
                "get_object",
                Params={"Bucket": self.bucket, "Key": s3_key},
                ExpiresIn=expires_in_seconds
            )
            return url
        except Exception as e:
            logger.error(f"Failed to generate presigned URL: {str(e)}")
            raise e

s3_client = S3Client()
