# stock-pick-challenge
A simple application to see who is the better stock picker, me or my wife.

## What it does
Currently it simply tracks a static set of stocks we picked at the beginning of the
year and allows us to compare the performance of our picks.

The app currently loads the data from flat files that must be regenerated each
trading data with that day's updates.  A future update will update this data
in a batch job so things are hands-off.

## Project structure
* `app/` - The web application.  Written in Vue.
* `datagen/` - Scripts that fetch the data the app displays.  The top-level
  script is `scripts/generate-all.sh`.  After running that, all files under
  `datagen/output/` need to be copied to `app/src/data/` for the app to
  consume it.
  

## npm tasks
* `npm install` - Installs dependencies
* `npm run serve` - Compiles and hot-reloads for deployment
* `npm run build` - Minimizes for production
* `npm run test:unit` - Runs unit tests
* `npm run lint` - Lints and fixes files
