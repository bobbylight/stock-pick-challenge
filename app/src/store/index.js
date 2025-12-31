import { defineStore } from 'pinia'

const data = {
  loading: true,
  year: 2024,
  carrow: {
    cash: 0,
    positions: [],
    history: [],
  },
  robert: {
    cash: 0,
    positions: [],
    history: [],
  },
  history: {},
}

export const useStore = defineStore('store', {
  state: () => data,
  actions: {
    setYear(year) {
      this.loading = true
      this.year = year
      const urls = [
        `/data/${year}/carrow.json`,
        `/data/${year}/portfolio-history-carrow.json`,
        `/data/${year}/robert.json`,
        `/data/${year}/portfolio-history-robert.json`,
        `/data/${year}/ticker-history.json`,
      ]
      Promise.all(urls.map(url => fetch(url).then(response => response.json())))
        .then(responses => {
          const carrow = responses[0]
          const carrowHistory = responses[1]
          const robert = responses[2]
          const robertHistory = responses[3]
          const tickerHistory = responses[4]

          const startTime = Date.now()
          this.$patch(state => {
            state.loading = false
            state.carrow = {
              ...carrow,
              history: carrowHistory,
            }
            state.robert = {
              ...robert,
              history: robertHistory,
            }
            state.history = tickerHistory
          })
          const totalTime = Date.now() - startTime
          console.log(`Loaded data for year ${year} in ${totalTime}ms`)
        })
    },
  },
  getters: {

    initialInvestment: state => portfolioName => {
      // Note: If we ever start to support mid-year purchases this isn't guaranteed
      // to always work
      const positions = state[portfolioName].positions
      const firstDay = positions[0].contributions[0].date

      let initialValue = 0
      positions.forEach(position => {
        // Should be 0 or 1 contributions on the first day
        const contribution = position.contributions.find(contribution => contribution.date === firstDay)
        if (contribution) {
          initialValue += contribution.price * contribution.count
        }
      })
      return initialValue
    },

    currentValue: state => portfolioName => {
      let currentValue = 0
      state[portfolioName].positions.forEach(position => {
        // TODO: Allow for sold shares
        const ticker = position.ticker
        const tickerHistory = state.history[ticker].history
        const lastClose = tickerHistory[tickerHistory.length - 1].close
        position.contributions.forEach(contribution => currentValue += contribution.count * lastClose)
      })
      return currentValue
    },

    dailyChange: state => (ticker, percentage) => {
      const tickerHistory = state.history[ticker].history
      const currentCostPerShare = tickerHistory[tickerHistory.length - 1].close
      const previousCostPerShare = tickerHistory[tickerHistory.length - 2]?.close ?? 0

      let change = currentCostPerShare - previousCostPerShare // Will never overflow with our values
      if (percentage) {
        change /= previousCostPerShare
      }
      return change
    },

    displayName: state => ticker => {
      return state.history[ticker].name || ticker
    },

    yesterdaysValue: state => portfolioName => {
      let currentValue = 0
      state[portfolioName].positions.forEach(position => {
        // TODO: Allow for sold shares
        const ticker = position.ticker
        console.log('ticker: ' + ticker)
        const tickerHistory = state.history[ticker].history
        const targetDateClose = tickerHistory[tickerHistory.length - 2]?.close ?? 0
        position.contributions.forEach(contribution => currentValue += contribution.count * targetDateClose)
      })
      return currentValue
    },

    securityHistory: state => (ticker, startBalance) => {
      // Get amount of shares equal the starting balance
      const history = state.history[ticker].history
      // Get first date after since we may have "bought" on a Sunday.  Compounding starts on firstDay's growth
      const firstDay = state.robert.positions[0].contributions[0].date
      const initialPriceIndex = history.findIndex(record => record.date > firstDay) - 1
      const initialPrice = history[initialPriceIndex]?.close ?? 0
      const shareCount = startBalance / initialPrice
      console.log(`Initial share count: ${shareCount}`)

      // Slice the history to remove all days prior to our "start" Sunday
      return history.slice(initialPriceIndex)
        .map(item => shareCount * item.close)
    },

    summaryInfo: state => portfolio => {
      return state[portfolio].positions.map(position => {
        let shares = 0
        let totalCost = 0
        position.contributions.forEach(c => {
          shares += c.count
          totalCost += (c.count * c.price)
        })

        const costPerShare = totalCost / shares

        return {
          ticker: position.ticker,
          shares,
          totalCost,
          costPerShare,
        }
      })
    },

    lastUpdated: state => () => {
      const historyArray = state.history?.['^dji']?.history
      if (!historyArray) {
        return undefined
      }
      // Cheap way to ensure date isn't impacted by time zones, at least anywhere our users are
      const dateTime = `${historyArray[historyArray.length - 1].date}T12:00:00Z`
      return new Intl.DateTimeFormat('en-US', {
        weekday: 'long',
        month: 'numeric',
        day: 'numeric',
        year: 'numeric',
      }).format(new Date(dateTime))
    },

    // If a company gets bought out, it stops updating mid-year. The only way we
    // can know that is to compare their data set size to the trading day count
    stillActivelyTrading: state => ticker => {
      const tradingDayCount = state.history?.['^dji']?.history?.length ?? 0
      const tickerTradingDayCount = state.history?.[ticker]?.history?.length ?? 0
      return tickerTradingDayCount === tradingDayCount
    },
  },
})
