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
const FIRST_DAY = '2026-01-02'

// If a ticker has some trading days this year, but stopped trading at some point,
// it likely got sold. We use tradingDayCount to determine this.
const tradingDayCount = tickerHistory['^dji'].history.length

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

const getHistoryRecord = (ticker, historyArray, targetDate) => {
    // TODO: Remove me when we always have at least buyout data as a backup
    if (!historyArray?.length) {
        return undefined
    }

    // If the ticker traded for a while, but stopped some time before the most recent
    // trading day, it was likely sold. In that case, return its last price
    const tickerTradedDaysCount = historyArray.length
    if (tickerTradedDaysCount > 0 && tickerTradedDaysCount < tradingDayCount) {
        return historyArray[historyArray.length - 1]
    }

    // ISO-8601 date strings are ordered.
    // Also note this may be undefined if this script is run on the weekend of a market holiday.
    // That's expected, and the calling code will handle this properly
    return historyArray.find(record => record.date === targetDate)
}


// Initialize variables.  Portfolio history starts with a record for our initial investments.
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
today.setHours(16) // 4pm ET, the time zone we run in
while (new Date(date) < today) {

    let value = 0 // cash added later to keep logic simpler
    // Hack to ensure we properly handle buyout, no-longer-traded records.
    // For holidays we assume a 0 value => no trades that day. But we don't
    // know how to account for holidays when using the "last" value for
    // tickers no longer trading
    let allAdded = true

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
        if (!tickerHistory[ticker]) {
            throw new Error(`${dataFile}: no history for ticker: ${ticker}`)
        }
        // If data stopped, say from a buyout, take the last price as the "final" one
        const historyRecord = getHistoryRecord(ticker, tickerHistory[ticker].history, date)
        if (historyRecord) { // i.e. it wasn't a market holiday
            const price = historyRecord['adj close']
            value += closestContribution.count * price
        } else {
            allAdded = false
        }
    })

    console.log(`${date}: ${value ? (value + data.cash) : '(no trades)'}`)
    if (value && allAdded) {
        portfolioHistory.push({date, value: value + data.cash})
    }
    date = getNextTradingDay(date)
}

//console.log(JSON.stringify(portfolioHistory, null, 2))
const portfolioName = dataFile.substring(dataFile.lastIndexOf('/') + 1, dataFile.lastIndexOf('.'))
fs.writeFileSync(`../output/portfolio-history-${portfolioName}.json`, JSON.stringify(portfolioHistory, null, 2))
