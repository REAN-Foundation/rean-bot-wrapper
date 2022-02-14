#!/bin/bash

# Add config/creds copying here...
cd /app
# Add any other scripts here...

# Start the service

pm2-runtime src/index.js
