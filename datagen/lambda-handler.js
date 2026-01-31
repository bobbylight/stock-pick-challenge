const util = require('util');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');

/**
 * Executes a shell command and returns it as a Promise.
 * @param cmd {string}
 * @return {Promise<{stdout: string, stderr: string}>}
 */
function execShellCommand(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.warn(error);
        reject(error);
      }
      resolve({ stdout, stderr });
    });
  });
}

exports.handler = async (event) => {
  console.log('Starting data generation process...');

  const tempHtmlDir = '/tmp/html';
  const tempOutputDir = '/tmp';
  
  try {
    // Step 1: Fetch HTML history files
    console.log('Fetching HTML history...');
    const fetchScriptPath = path.resolve(__dirname, 'scripts/fetch-history-htmls.sh');
    const { stdout: fetchStdout, stderr: fetchStderr } = await execShellCommand(`bash ${fetchScriptPath}`);
    console.log('Fetching HTML history stdout:', fetchStdout);
    if(fetchStderr) console.error('Fetching HTML history stderr:', fetchStderr);

    // Step 2: Generate JSON history from HTML
    console.log('Generating JSON history from HTML...');
    const generateJsonScript = path.resolve(__dirname, 'scripts/generate-json-history-from-htmls.mjs');
    const { stdout: jsonStdout, stderr: jsonStderr } = await execShellCommand(`node ${generateJsonScript}`);
    console.log('JSON generation stdout:', jsonStdout);
    if(jsonStderr) console.error('JSON generation stderr:', jsonStderr);

    // Step 4: Generate portfolio history for each portfolio
    console.log('Generating portfolio histories...');
    const portfolioDir = path.resolve(__dirname, 'portfolios');
    const portfolioFiles = fs.readdirSync(portfolioDir);
    const generatePortfolioScript = path.resolve(__dirname, 'scripts/generate-portfolio-history.js');

    for (const portfolioFile of portfolioFiles) {
        if (path.extname(portfolioFile) === '.json') {
            const portfolioPath = path.join(portfolioDir, portfolioFile);
            console.log(`Processing portfolio: ${portfolioPath}`);
            const { stdout: portfolioStdout, stderr: portfolioStderr } = await execShellCommand(`node ${generatePortfolioScript} ${portfolioPath}`);
            console.log(`Portfolio ${portfolioFile} stdout:`, portfolioStdout);
            if(portfolioStderr) console.error(`Portfolio ${portfolioFile} stderr:`, portfolioStderr);
        }
    }
    
    // Step 5: Output generated files (local copy or S3 upload)
    const generatedFiles = fs.readdirSync(tempOutputDir).filter(f => f.endsWith('.json'));

    if (event.localMode) {
      // Local mode: copy files to datagen/output/ and app/public/data/2026/
      console.log('Running in local mode, copying files locally...');
      const datagenOutputDir = path.resolve(__dirname, 'output');
      const appDataDir = path.resolve(__dirname, '..', 'app', 'public', 'data', '2026');

      for (const dir of [datagenOutputDir, appDataDir]) {
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
      }

      for (const file of generatedFiles) {
        const srcPath = path.join(tempOutputDir, file);
        const content = fs.readFileSync(srcPath);
        fs.writeFileSync(path.join(datagenOutputDir, file), content);
        fs.writeFileSync(path.join(appDataDir, file), content);
        console.log(`Copied ${file} to output/ and app/public/data/2026/`);
      }
    } else {
      // Lambda mode: upload to S3
      console.log('Uploading generated files to S3...');
      const s3Client = new S3Client({});
      const bucketName = process.env.S3_BUCKET_NAME;
      const s3KeyPrefix = process.env.S3_KEY_PREFIX || 'data/2026/';

      if (!bucketName) {
        throw new Error('S3_BUCKET_NAME environment variable not set.');
      }

      for (const file of generatedFiles) {
        const filePath = path.join(tempOutputDir, file);
        const fileStream = fs.createReadStream(filePath);
        const s3Key = path.join(s3KeyPrefix, file);
        const uploadParams = {
          Bucket: bucketName,
          Key: s3Key,
          Body: fileStream,
        };
        await s3Client.send(new PutObjectCommand(uploadParams));
        console.log(`Successfully uploaded ${file} to ${bucketName}/${s3Key}`);
      }
    }

  } catch (error) {
    console.error('An error occurred during data generation:', error);
    return {
      statusCode: 500,
      body: JSON.stringify('Data generation failed.'),
    };
  }

  console.log('Data generation process finished.');

  return {
    statusCode: 200,
    body: JSON.stringify('Data generation successful!'),
  };
};

// CLI entry point for local execution
if (require.main === module) {
  const localMode = process.argv.includes('--local');
  if (!localMode) {
    console.error('Usage: node lambda-handler.js --local');
    console.error('  --local    Copy output to datagen/output/ and app/public/data/2026/');
    console.error('             (Without --local, S3_BUCKET_NAME env var is required)');
    process.exit(1);
  }
  exports.handler({ localMode }).then(result => {
    console.log('Result:', JSON.stringify(result, null, 2));
    process.exit(result.statusCode === 200 ? 0 : 1);
  });
}
