#!/bin/bash
#
# fetch-history-htmls.sh - Pulls historical data for interesting securities
# from Yahoo! Finance.
# If you get an error about invalid cookies, you might need to generate a
# fetch-history-cookies.txt file and include that in the executed curl
# statements.
#

benchmarks=( "^gspc" "^ixic" "^dji" "^rut" "arkg" "arkk")
investments_2022=()
investments_2023=()
investments_2024=()
investments_2025=()
robert=("aapl" "amzn" "ceg" "crwd" "edit" "jpm" "lun.to" "nee" "nvo" "panw" "poet" "unh")
carrow=("a" "aapl" "brk-b" "crl" "dnli" "googl" "grmn" "imux" "mrkr" "nee" "nflx" "rpd" "tem" "vale" "xene")
extra_interesting=()

all_securities=("${benchmarks[@]}" "${investments_2022[@]}" "${investments_2023[@]}" "${investments_2024[@]}" "${investments_2025[@]}" "${robert[@]}" "${carrow[@]}" "${extra_interesting[@]}")

# You probably don't want to edit past this line.
echo "Security count: ${#all_securities[@]}"
all_securities=($(tr ' ' '\n' <<< "${all_securities[@]}" | sort -u | tr '\n' ' '))
echo "Security count after duplicate removal: ${#all_securities[@]}"

dir="$( cd "$( dirname "${BASH_SOURCE[0]}" )" >/dev/null 2>&1 && pwd )"

html_dir="/tmp/html"
mkdir -p "${html_dir}"

for s in "${all_securities[@]}" ; do
  ticker=$(echo "$s" | tr '[:lower:]' '[:upper:]')

  file="${html_dir}/${s}.html"
  echo "Creating file ${file}..."
  ${dir}/fetch-history-html-single.sh ${ticker} > "${file}.tmp"
  awk '{print tolower($0)}' < "${file}.tmp" > "${file}"
  rm "${file}.tmp"
done
