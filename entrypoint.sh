#!/bin/bash

# Add config/creds copying here...
aws s3 cp s3://$S3_CONFIG_BUCKET/$S3_CONFIG_PATH/.env /app/.env

cd /app
# Add any other scripts here...

# Start the service

pm2-runtime src/index.js
