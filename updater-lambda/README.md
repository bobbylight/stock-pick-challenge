# updater-lambda
Scripts that generate the data to display. Data is scraped from
https://finance.yahoo.com, so doesn't require an account or API key.

Note: This used to pull data in CSV format, but they moved that API to behind
a paywall. So for now we're scraping data from the site's HTML, which is obviously
fragile and needs to be updated whenever the page is modified. We might consider
moving to a new API if we can find one cheap enough, but for now just be aware that
this might be broken by the time you discover and clone this project.

## Running locally
```bash
npm run generate-local-data
```
This scrapes the latest data from Yahoo Finance and outputs it to `../app/public/data/2026/`.
From there, running `npm run dev` in the `app/` directory will let you develop against the
latest data.

## Deploying the lambda to AWS
* First, follow [./DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) to set up and configure your AWS account and do
  the initial setup for the lambda function.
* Then run `npm run deploy-lambda` to deploy the latest version. This packages up any changes
  and updates the production lambda.
