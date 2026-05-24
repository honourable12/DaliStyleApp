#!/bin/bash
echo "📡 Initializing Floci-3: Image Storage..."
awslocal s3 mb s3://daily-style-assets
echo "✅ S3 Bucket 'daily-style-assets' created."
