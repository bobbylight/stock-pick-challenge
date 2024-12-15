# datagen
Scripts that generate the data to display.

Note: This used to pull data in CSV format, but they moved that API to behind
a paywall. So for now we're scraping data from the site's HTML, which is obviously
fragile and needs to be updated whenever the page is modified. We might consider
moving to a new API if we can find one cheap enough.

The top-level script is `scripts/generate-all.sh`.  After running that, all files under
`datagen/output/` need to be copied to `app/src/data/` for the app to
consume it.
