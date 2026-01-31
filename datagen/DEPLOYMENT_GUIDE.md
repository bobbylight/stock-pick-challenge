# AWS Lambda Deployment Guide

This guide provides step-by-step instructions to package and deploy the data generation service as
an AWS Lambda function.

## Prerequisites

- An AWS account with access to IAM, S3, and Lambda.
- AWS CLI configured locally (optional, for command-line deployment).
- An S3 bucket where the output files will be stored.

## Step 1: Package the Application

The Lambda function needs a .zip file containing all its code and dependencies.

1.  **Install Dependencies:** Ensure all necessary Node.js modules are installed.
    ```bash
    nvm use
    npm install
    ```

2.  **Create the Deployment Package:** Zip the necessary files and folders. The package must
    include:
    - `lambda-handler.js`
    - `scripts/`
    - `portfolios/`
    - `buyout-partial-datas/`
    - `package.json`
    - `node_modules/`

    You can create the zip file with the following command:
    ```bash
    zip -r deployment-package.zip . -x ".*" "*/.DS_Store" "csv/*" "html/*" "deployment-package.zip*"
    ```

    or:
    ```bash
    zip -r deployment-package.zip . -x ".*" "*/.DS_Store" "deployment-package.zip"
    ```

## Step 2: Create an IAM Role for the Lambda Function

The Lambda function needs permissions to write logs to CloudWatch and to write objects to your
S3 bucket.

1.  Navigate to the **IAM** service in the AWS Console.
2.  Go to **Roles** and click **Create role**.
3.  For the trusted entity, select **AWS service**, and for the use case, choose **Lambda**.
    Click **Next**.
4.  On the **Add permissions** page, search for and add the following policies:
    - `AWSLambdaBasicExecutionRole` (for CloudWatch logs)
5.  Click **Next**.
6.  Give the role a descriptive name (e.g., `DataGenLambdaRole`) and click **Create role**.
7.  After the role is created, open it, and under the **Permissions** tab, click
    **Add permissions** -> **Create inline policy**.
8.  Select the **JSON** tab and paste the following policy. **Remember to replace
    `YOUR_BUCKET_NAME` with the name of your S3 bucket.**
    ```json
    {
      "Version": "2012-10-17",
      "Statement": [
        {
          "Effect": "Allow",
          "Action": "s3:PutObject",
          "Resource": "arn:aws:s3:::YOUR_BUCKET_NAME/data/2026/*"
        }
      ]
    }
    ```
9.  Click **Next**, give the policy a name (e.g., `S3PutObjectPolicy`), and click
    **Create policy**.

## Step 3: Create the Lambda Function

1.  Navigate to the **Lambda** service in the AWS Console.
2.  Click **Create function**.
3.  Select **Author from scratch**.
4.  **Function name:** Enter a name (e.g., `stock-data-generator`).
5.  **Runtime:** Select **Node.js 20.x**.
6.  **Architecture:** Choose **x86_64**.
7.  **Permissions:** Expand "Change default execution role" and select **Use an existing role**.
    Choose the `DataGenLambdaRole` you created in the previous step.
8.  Click **Create function**.

## Step 4: Configure the Lambda Function

1.  **Upload Code:** In the **Code source** section, click **Upload from** and select
    **.zip file**. Upload the `deployment-package.zip` file you created.
2.  **Handler:** In **Runtime settings**, ensure the handler is set to `lambda-handler.handler`.
3.  **Environment Variables:**
    - Go to the **Configuration** tab and select **Environment variables**.
    - Click **Edit** and add the following variables:
        - **Key:** `S3_BUCKET_NAME`
        - **Value:** The name of your S3 bucket.
        - **Key (Optional):** `S3_KEY_PREFIX`
        - **Value (Optional):** The destination folder for the output files in S3. Defaults to
          `data/2026/` if not set. If you change this, you must also update your IAM policy's
          `Resource` ARN to match.
4.  **Basic Settings:**
    - In the **Configuration** tab, select **General configuration**.
    - Click **Edit**.
    - **Timeout:** Set it to **2 minutes** or more to ensure the data fetching and processing
      has enough time to complete.
    - **Memory:** You can start with the default (128 MB) and increase it if the function runs
      out of memory.

## Step 5: Schedule the Lambda Function with EventBridge

To run the function automatically on a schedule:

1.  In your Lambda function's page, click **Add trigger**.
2.  Select **EventBridge (CloudWatch Events)** from the dropdown.
3.  Choose **Create a new rule**.
4.  **Rule name:** Give it a name (e.g., `StockPickChallengeDailyStockDataGeneration`).
5.  **Schedule expression:** To run the function every weekday at a specific time
    (e.g., 8 PM UTC), you can use a cron expression.
    - Example for 4:30 PM Eastern, Monday-Friday: `cron(30 21 ? * MON-FRI *)`
6.  Click **Add**.

Your Lambda function is now fully configured and will run on the schedule you defined, generating
the data and uploading it to your S3 bucket. You can test it manually at any time by clicking the
**Test** button in the Lambda console.
