import { createStore } from 'vuex'

const data = {
    loading: true,
    year: 2023,
    // Most data is imported lazily
}

const store = createStore({
    state: data,
    mutations: {
        setLoading(state, loading) {
            state.loading = loading
        }
    },
    actions: {
        setYear({ commit }, year) {
            commit('setLoading', true)
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

                    store.replaceState({
                        loading: false,
                        year,
                        carrow: {
                            ...carrow,
                            history: carrowHistory,
                        },
                        robert: {
                            ...robert,
                            history: robertHistory,
                        },
                        history: tickerHistory,
                    })
                })
        },
    },
    modules: {
    },
    getters: {

        initialInvestment: state => (portfolioName) => {

            // Note: If we ever start to support mid-year purchaes this isn't guaranteed
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

        currentValue: state => (portfolioName) => {

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
            const previousCostPerShare = tickerHistory[tickerHistory.length - 2].close

            let change = currentCostPerShare - previousCostPerShare // Will never overflow with our values
            if (percentage) {
                change /= previousCostPerShare
            }
            return change
        },

        displayName: state => (ticker) => {
            return state.history[ticker].name || ticker
        },

        yesterdaysValue: state => (portfolioName) => {

            let currentValue = 0
            state[portfolioName].positions.forEach(position => {

                // TODO: Allow for sold shares
                const ticker = position.ticker
                const tickerHistory = state.history[ticker].history
                const targetDateClose = tickerHistory[tickerHistory.length - 2].close
                position.contributions.forEach(contribution => currentValue += contribution.count * targetDateClose)
            })
            return currentValue
        },

        securityHistory: state => (ticker, startBalance) => {

            // Get amount of shares equal the starting balance
            const history = state.history[ticker].history
            // Get first date after since we "bought" on a Sunday.  Compounding starts on FIRST_DAY's growth
            const initialPriceIndex = history.findIndex(record => record.date > FIRST_DAY) - 1
            const initialPrice = history[initialPriceIndex].close
            const shareCount = startBalance / initialPrice
            console.log(`Initial share count: ${shareCount}`)

            // Slice the history to remove all days prior to our "start" Sunday
            return history.slice(initialPriceIndex)
                .map(item => shareCount * item.close)
        },

        summaryInfo: state => (portfolio) => {

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
        }
    }
})

export default store
