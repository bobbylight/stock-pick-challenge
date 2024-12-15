#!/bin/bash
#
# generate-all.sh - Regenerates all test data.
# This is obviously fragile, but necessary since they took away some endpoints that allowed
# pulling historical data for free.
#

dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

cd "${dir}" || exit 1
./fetch-history-htmls.sh

node ./generate-json-history-from-htmls.mjs || exit 2

for file in "../portfolios"/* ; do
  node ./generate-portfolio-history.js "${file}" || exit 3
done
