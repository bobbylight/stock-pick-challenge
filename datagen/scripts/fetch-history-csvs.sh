#!/bin/bash
#
# fetch-history-csvs.sh - Pulls historical data for interesting securities
# from Yahoo! Finance.
# If you get an error about invalid cookies, you might need to generate a
# fetch-history-cookies.txt file and include that in the executed curl
# statements.
#

benchmarks=( "^gspc" "^ixic" "^dji" "^rut" "arkg" "arkk")
investments_2022=()
investments_2023=()
robert=("dis" "eigr" "gthx" "ko" "msft" "nke" "nvda" "nvo" "vz")  # "tgt" skipped since Carrow's portfolio also has it
carrow=("aapl" "crgx" "dal" "gps" "lulu" "meta" "otly" "pfe" "tgt" "tsla")
extra_interesting=("pbw" "gld")

all_securities=("${benchmarks[@]}" "${investments_2022[@]}" "${investments_2023[@]}" "${robert[@]}" "${carrow[@]}" "${extra_interesting[@]}")

# You probably don't want to edit past this line.
echo "Security count: ${#all_securities[@]}"
all_securities=($(tr ' ' '\n' <<< "${all_securities[@]}" | sort -u | tr '\n' ' '))
echo "Duplicates removed count: ${#all_securities[@]}"

dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

csv_dir="${dir}/../csv"
mkdir "${csv_dir}"

# January 1, 2022: 1640998800
# January 1, 2023: 1672578000
# January 1, 2024: 1704067200
start=1704067200
end=1815496000  # 2027-07-13T04:26:40Z

for s in "${all_securities[@]}" ; do
  ticker=$(echo "$s" | tr '[:lower:]' '[:upper:]')
  interval=1d
  url="https://query1.finance.yahoo.com/v7/finance/download/${ticker}?period1=${start}&period2=${end}&interval=${interval}&events=history&includeAdjustedClose=true"
  
  file="${csv_dir}/${s}.csv"
  echo "Creating file ${file}..."
  echo "${url}"
  #curl -XGET -b "${url}" -o "${file}"
  curl -XGET "${url}" -o "${file}.tmp"
  awk '{print tolower($0)}' < "${file}.tmp" > "${file}"
  rm "${file}.tmp"
done
