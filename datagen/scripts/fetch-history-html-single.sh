#!/bin/sh
#
# fetch-history-html-single.sh - Fetches the HTML for a single ticker's history from Yahoo Finance.
# Can be used for scraping.
#
# Usage
#   ./scripts/fetch-history-html-single.sh AMZN
#

# January 1, 2022: 1640998800
# January 1, 2023: 1672578000
# January 1, 2024: 1704067200
start=1704067200
end=1815496000  # 2027-07-13T04:26:40Z
frequency=1d
ticker=$1

curl "https://finance.yahoo.com/quote/${ticker}/history/?period1=${start}&period2=${end}&frequency=${frequency}" \
  -H 'user-agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36' \

