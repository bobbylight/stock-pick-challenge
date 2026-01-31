# stock-pick-challenge
![Build](https://github.com/bobbylight/stock-pick-challenge/actions/workflows/build-app.yml/badge.svg)

A simple application to see who is the better stock picker, me or my wife.

## What it does
Currently it simply tracks a static set of stocks we picked at the beginning of the year and
allows us to compare the performance of our picks. Prior years are preserved for continued
humiliation.

The app loads the data from JSON files that are updated each trading day by an AWS lambda.
The lambda code lives in `datagen/`, and it can be run locally to test the app before pushing
changes.

## Project structure
* `app/` - The web application. Written in Vue and packaged with Vite
* `datagen/` - The lambda that generates the JSON data the app consumes

See each subproject for more information.
