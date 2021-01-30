#!/bin/bash
#
# generate-all.sh - Regenerates all test data.
#

dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

cd "${dir}" || exit 1
./fetch-history-csvs.sh

node ./generate-json-history-from-csvs.mjs || exit 2

for file in "../portfolios"/* ; do
  node ./generate-portfolio-history.js "${file}" || exit 3
done
