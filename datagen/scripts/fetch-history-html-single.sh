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
# January 1, 2025: 1735689600
start=1735689600
end=1815496000  # 2027-07-13T04:26:40Z
frequency=1d
ticker=$1

curl --compressed "https://finance.yahoo.com/quote/${ticker}/history/?period1=${start}&period2=${end}&frequency=${frequency}" \
  -H ':authority: finance.yahoo.com' \
  -H ':method: GET' \
  -H 'Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7' \
  -H 'Accept-Encoding: gzip, deflate, br, zstd' \
  -H 'Accept-Language: en-US,en;q=0.9,fr;q=0.8,es;q=0.7,de-DE;q=0.6,de;q=0.5,it;q=0.4' \
  -H 'Cache-Control: no-cache' \
  -H 'user-agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/135.0.0.0 Safari/537.36' \

