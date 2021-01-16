#!/usr/bin/node
//
// generate-json-history-from-csvs.mjs - Generates a JSON file
// containing all data in the ./csvs/ folder.
//

import fs from 'fs'
import csv from 'csvtojson'

let history = {}

const dir = './csv'

let files = fs.readdirSync(dir).sort()

for (const file of files) {
    let json = await csv().fromFile(`./csv/${file}`)

    const ticker = file.substr(0, file.lastIndexOf('.'))
    history[ticker] = {
        history: json
    }
}

fs.writeFileSync('./output/ticker-history.json', JSON.stringify(history, null, 2))
