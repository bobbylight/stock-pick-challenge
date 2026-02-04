# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Stock-pick-challenge is a web application that compares stock picking performance between two users. It's a Vue 3 SPA with data updated daily by an AWS Lambda function that scrapes Yahoo Finance.

## Project Structure

- `app/` - Vue 3 + Vuetify + Vite frontend
- `updater-lambda/` - Node.js AWS Lambda that scrapes Yahoo Finance and generates JSON data

## Common Commands

### Frontend (run from `app/` directory)

```bash
nvm use                    # Switch to Node 24.13.0
npm install                # Install dependencies
npm run dev                # Start dev server
npm run build              # Build to dist/
npm run test:unit          # Run unit tests with coverage
npm run lint               # Lint and auto-fix
npm run lint:nofix         # Lint without fixing (CI mode, fails on warnings)
```

### Data Generation (run from `updater-lambda/` directory)

```bash
npm install                     # Install dependencies
npm run generate-local-data     # Scrape Yahoo Finance and output to app/public/data/2026/
npm run deploy-lambda           # Deploy to AWS Lambda
```

### Typical Development Workflow

```bash
cd updater-lambda && npm run generate-local-data
cd ../app && npm run dev
```

## Architecture

### Data Flow
1. Lambda scrapes Yahoo Finance HTML daily and generates JSON files
2. JSON files are uploaded to S3 bucket at `data/<year>/`
3. Vue app fetches JSON from `/public/data/<year>/` on load
4. Pinia store caches portfolio data for reactive components

### Key Data Files (per year)
- `<user>.json` - User's current portfolio
- `portfolio-history-<user>.json` - Historical portfolio values
- `ticker-history.json` - Price history for all tickers

### Frontend Routes
- `/head-to-head` - Main comparison page (default)
- `/users/:user` - Individual user portfolio view
- `/about` - About page

### Path Alias
`@` maps to `app/src/` in imports

## Important Notes

- Data scraping is fragile - breaks when Yahoo Finance changes their HTML structure
- The 2026 data in the repo may be stale; run `generate-local-data` for latest
- App is 100% static, deployed to S3
- Lambda needs S3 PutObject access to `data/<year>/*`