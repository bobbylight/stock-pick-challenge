#!/usr/bin/node
//
// generate-json-history-from-csvs.mjs - Generates a JSON file
// containing all data in the ../csvs/ folder.
//

import fs from 'fs'
import csv from 'csvtojson'

const history = {}
const displayNames = {
    '^dji': 'Dow Jones',
    '^gspc': 'S&P 500',
    '^ixic': 'Nasdaq',
    '^rut': 'Russel 2000',
    arkg: 'ARK Genomic Revolution ETF',
    arkk: 'ARK Innovation ETF',
}

const dir = '../csv'

const files = fs.readdirSync(dir).sort()

for (const file of files) {

    let json = await csv().fromFile(`${dir}/${file}`)

    // It seems sometimes Yahoo returns two records for the current date. Maybe after-hours data?
    const recordCount = json.length
    if (recordCount > 1 && json[recordCount - 1].date === json[recordCount - 2].date) {
        console.warn(`[warn] File ${file} has two records for ${json[recordCount - 1].date}. Ignoring the second one`)
        json.pop()
    }

    // Remove records with null values, e.g. znga was bought out mid-year
    json = json.filter(row => row.open !== 'null').map(row => {
        return {
            date: row.date,
            open: parseFloat(row.open),
            high: parseFloat(row.high),
            low: parseFloat(row.low),
            close: parseFloat(row.close),
            'adj close': parseFloat(row['adj close']),
            volume: parseFloat(row.volume),
        }
    })

    const ticker = file.substring(0, file.lastIndexOf('.'))
    history[ticker] = {
        name: displayNames[ticker] || ticker,
        history: json
    }
}

fs.writeFileSync('../output/ticker-history.json', JSON.stringify(history, null, 2))
