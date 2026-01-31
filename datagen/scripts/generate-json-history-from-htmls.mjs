#!/usr/bin/node
//
// generate-json-history-from-htmls.mjs - Generates a JSON file
// containing all data in the ${dir} folder.
//

import fs from 'fs'
import { parse } from 'node-html-parser'

const history = {}
const displayNames = {
    '^dji': 'Dow Jones',
    '^gspc': 'S&P 500',
    '^ixic': 'Nasdaq',
    '^rut': 'Russel 2000',
    arkg: 'ARK Genomic Revolution ETF',
    arkk: 'ARK Innovation ETF',
}

const dir = '/tmp/html'

const files = fs.readdirSync(dir).sort()

for (const file of files) {

    // Initialize the history entry to an empty array
    const ticker = file.substring(0, file.lastIndexOf('.'))
    history[ticker] = {
        name: displayNames[ticker] ?? ticker,
        history: []
    }

    const text = fs.readFileSync(`${dir}/${file}`, {encoding: 'utf8', flag: 'r'})
    const root = parse(text)

    // 2024-12-14 - there's currently a single table on this page
    //console.log(root.querySelector('tbody'))
    const tbody = root.querySelector('tbody')
    if (!tbody) {
        // Look for manually-created data, such as last-known data after a buyout
        const buyoutFile = `${__dirname}/../buyout-partial-datas/${ticker}.json`
        if (fs.existsSync(buyoutFile)) {
            const buyoutData = JSON.parse(fs.readFileSync(buyoutFile, {encoding: 'utf8', flag: 'r'}))
            history[ticker].history = buyoutData.history
        } else {
            console.warn(`[warn]: file has no historical data: ${dir}/${file}`)
        }
        continue
    }

    // Iterate through each row
    const rows = tbody.querySelectorAll('tr')
    rows.forEach(row => {

        // TODO: Handle dividends somehow? Would be nice to add to user balances
        const tds = row.querySelectorAll('td')
        if (tds.length !== 7) {
            //console.log(`[note]: ticker=${ticker}: Skipping apparent event row: ${row.outerHTML}`)
            return
        }

        history[ticker].history.unshift({
            date: new Date(tds[0].text).toISOString().substring(0, 10),
            open: parseFloat(tds[1].text.replaceAll(',', '')),
            high: parseFloat(tds[2].text.replaceAll(',', '')),
            low: parseFloat(tds[3].text.replaceAll(',', '')),
            close: parseFloat(tds[4].text.replaceAll(',', '')),
            'adj close': parseFloat(tds[5].text.replaceAll(',', '')),
            volume: parseFloat(tds[6].text.replaceAll(',', '')),
        })
    })

    fs.writeFileSync('/tmp/ticker-history.json', JSON.stringify(history, null, 2))
}
