#!/bin/bash

# Add config/creds copying here...
aws s3 cp s3://$S3_CONFIG_BUCKET/rean_bot/env.config /app/.env
aws s3 cp s3://$S3_CONFIG_BUCKET/rean_bot/service_account_key_dialogflow_translation.json /app/service_account_key_dialogflow_translation.json
aws s3 cp s3://$S3_CONFIG_BUCKET/rean_bot/rean-healthguru-development-reanhealthguru.json /app/rean-healthguru-development-reanhealthguru.json
aws s3 cp s3://$S3_CONFIG_BUCKET/rean_bot/service_account_key_rean_app_support_bot.json /app/service_account_key_rean_app_support_bot.json


cd /app
# Add any other scripts here...

# Start the service

pm2-runtime dist/src/index.js