#!/usr/bin/node
//
// generate-portfolio-history.js - Generates a history file for a portfolio
//
const fs = require('fs')

// Get the data file representing a portfolio to parse
if (process.argv.length < 3) {
    console.error('No input file specified')
    console.error('Example usage: node generate-portfolio-history.js my-portfolio.json')
    process.exit(1)
}
const dataFile = process.argv[2]
if (!fs.existsSync(dataFile)) {
    console.error(`Input file does not exist: ${dataFile}`)
    process.exit(2)
}
const data = require(`./${dataFile}`)
const tickerHistory = require('../output/ticker-history.json')

// The day we made our picks
const FIRST_DAY = '2023-01-03'

// Returns the next trading day from a given date.  Really just skips weekends.
const getNextTradingDay = (date) => {

    // Create a Date object representing midnight today.  The timezone shift ensures
    // we end up at midnight in our timezone and not off by a day by a few hours
    // since "date" is a UTC datestamp only
    const next = new Date(date)
    const timezoneOffset = next.getTimezoneOffset() * 60000
    next.setMilliseconds(next.getMilliseconds() + timezoneOffset)

    // Return weekdays only, skip weekends
    do {
        next.setDate(next.getDate() + 1)
        //console.log('... ' + date + ' => ' + next)
    } while (next.getDay() === 0 || next.getDay() === 6)
    return next.toISOString().substring(0, 10)
}

// Computes the initial value of a portfolio from the investments on day 1
const getInitialPortfolioValue = () => {
    let initialValue = data.cash || 0
    data.positions.forEach((position) => {
        // Should be 0 or 1 contributions on the first day
        const contribution = position.contributions.find(contribution => contribution.date === FIRST_DAY)
        if (contribution) {
            initialValue += contribution.price * contribution.count
        }
    })
    return initialValue
}




// Initialize variables.  Portfolio history starts with a record for our initial investments.
// We "bought" on a Sunday with the prior close's prices just to keep things clean
let date = FIRST_DAY
const portfolioHistory = [
    {
        date,
        value: getInitialPortfolioValue()
    }
]
date = getNextTradingDay(date)

// Loop through every trading day up to day
const today = new Date()
while (new Date(date) < today) {

    let value = 0 // cash added later to keep logic simpler

    data.positions.forEach((position) => {

        let index = position.contributions.findIndex(contribution => {
            return contribution.date > date
        })
        if (index === -1) {
            index = position.contributions.length
        }
        const closestContribution = position.contributions[index - 1]
        //console.log(`Closest contribution: ${JSON.stringify(closestContribution)}`)

        const ticker = position.ticker
        const historyRecord = tickerHistory[ticker].history.find(record => record.date === date)
        if (historyRecord) { // i.e. it wasn't a market holiday
            const price = historyRecord['adj close']
            value += closestContribution.count * price
        }
    })

    console.log(`${date}: ${value ? (value + data.cash) : '(no trades)'}`)
    if (value) {
        portfolioHistory.push({date, value: value + data.cash})
    }
    date = getNextTradingDay(date)
}

//console.log(JSON.stringify(portfolioHistory, null, 2))
const portfolioName = dataFile.substring(dataFile.lastIndexOf('/') + 1, dataFile.lastIndexOf('.'))
fs.writeFileSync(`../output/portfolio-history-${portfolioName}.json`, JSON.stringify(portfolioHistory, null, 2))
