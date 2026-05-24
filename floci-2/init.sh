#!/bin/bash
echo "📡 Initializing Floci-2: Model Storage..."
awslocal s3 mb s3://ai-models
echo "✅ S3 Bucket 'ai-models' created."
