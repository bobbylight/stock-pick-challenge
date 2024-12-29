# stock-pick-challenge
![Java Build](https://github.com/bobbylight/stock-pick-challenge/actions/workflows/build-app.yml/badge.svg)

A simple application to see who is the better stock picker, me or my wife.

## What it does
Currently it simply tracks a static set of stocks we picked at the beginning of the
year and allows us to compare the performance of our picks.

The app currently loads the data from flat files that must be regenerated each
trading data with that day's updates.  A future update will update this data
in a batch job so things are hands-off.

## Project structure
* `app/` - The web application.  Written in Vue and packaged with Vite
* `datagen/` - Scripts that fetch the data the app displays

See each subproject for more information.
