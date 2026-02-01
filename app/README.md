# stock-pick-challenge
This is the actual source code for the application.
It's written in Vue 3 using Vuetify and built via Vite.

## Hacking
The data the app displays lives in `public/data/`. Note that the 2026 data in the repository is
likely stale since I only regenerate it occasionally, when I update the code for some other
reason. The deployed app is updated daily via an AWS lambda (see `../datagen/`) so it stays up
to date. 

```bash
nvm use
cd datagen/
npm install
npm run generate-local-data
cd ../app/
npm install
npm run dev
```

## Deploying to AWS
The app is all static content, so it just lives in an S3 bucket.
For now, we just run `npm run build` and then manually upload the modified files in `dist/`
into the bucket via the AWS console. In the future we'll have an npm task for this.

```bash
npm run build
# For now, manually copy modified files from `dist/` into the bucket
```

The historical data in `data/2026/` will be updated by a separately deployed lambda. See
[../datagen]() for that.

## npm tasks
* `npm install` - Installs dependencies
* `npm run dev` - Starts local dev environment
* `npm run build` - Builds minified production artifact to `dist/`
* `npm run test:unit` - Runs unit tests (note: currently broken)
* `npm run lint` - Lints and fixes files
