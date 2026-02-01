#!/bin/bash
#
# deploy.sh - Packages and deploys the Lambda function to AWS
#
# Prerequisites:
#   - AWS CLI installed and configured (aws configure)
#   - Lambda function already created in AWS (see DEPLOYMENT_GUIDE.md)
#

set -e

FUNCTION_NAME="stock-pick-challenge-data-generator"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DATAGEN_DIR="$(dirname "$SCRIPT_DIR")"
PACKAGE_FILE="deployment-package.zip"

cd "$DATAGEN_DIR"

echo "Creating deployment package..."
rm -f "$PACKAGE_FILE"
zip -r "$PACKAGE_FILE" \
  lambda-handler.js \
  package.json \
  package-lock.json \
  node_modules \
  scripts \
  portfolios \
  buyout-partial-datas \
  -x "*.DS_Store" "scripts/deploy.sh" "csv/*" "html/*"

echo "Uploading to Lambda function: $FUNCTION_NAME..."
aws lambda update-function-code \
  --function-name "$FUNCTION_NAME" \
  --zip-file "fileb://$PACKAGE_FILE"

echo "Deployment complete!"