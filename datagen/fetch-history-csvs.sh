#!/bin/bash
#
# fetch-history-csvs.sh - Pulls historical data for interesting securities
# from Yahoo! Finance.
# If you get an error about invalid cookies, you might need to generate a
# fetch-history-cookies.txt file and include that in the executed curl
# statements.
#

benchmarks=( "^gspc" "arkg" "arkk")
investments_2021=("tdoc" "iova" "nvta" "twst" "pacb" "exas" "pstg" "vrtx" "edit" "ntla" "vcyt" "twlo")
robert=("amzn" "baba" "dkng" "icln" "ntdoy" "pltr" "sq")
carrow=("dal" "etsy" "dis" "sbux" "blnk" "t" "k" "aapl" "nke" "arvn" "kymr" "tgt" "brk-b" "tak")

all_securities=("${benchmarks[@]}" "${investments_2021[@]}" "${robert[@]}" "${carrow[@]}")

mkdir ./csv

for s in "${all_securities[@]}" ; do
  ticker=${s^^}
  start=1609359200
  end=1815496000
  interval=1d
  url="https://query1.finance.yahoo.com/v7/finance/download/${ticker}?period1=${start}&period2=${end}&interval=${interval}&events=history&includeAdjustedClose=true"
  
  file="./csv/${s}.csv"
  echo "Creating file ${file}..."
  echo "${url}"
  #curl -XGET -b "${url}" -o "${file}"
  curl -XGET "${url}" -o "${file}.tmp"
  awk '{print tolower($0)}' < "${file}.tmp" > "${file}"
  rm "${file}.tmp"
done
