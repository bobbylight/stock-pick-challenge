<template>
  <div class="todays-changes">
    <ul>
      <li>
        Today the overall market went <span class="emphasized">{{ marketDirection }}</span>&nbsp;
        <span :class="getAmountDeltaClass(gspcTodaysGain)">{{ $filters.percentage(gspcTodaysGain) }}</span>
      </li>
      <li>
        Today you <span class="emphasized">{{ todayVersusTheMarketVerb }}</span>
        the market by <span :class="getAmountDeltaClass(todayBeatMarketBy)">{{ $filters.percentage(todayBeatMarketBy) }}</span>
      </li>
      <li>
        Your best performer today was <span class="emphasized ticker">{{ bestPerformer }}</span>,
        which went {{ upOrDown(dailyChange(bestPerformer)) }}
        <span :class="getAmountDeltaClass(dailyChange(bestPerformer))">{{ $filters.percentage(dailyChange(bestPerformer)) }}</span>
      </li>
      <li>
        Your worst performer today was <span class="emphasized ticker">{{ worstPerformer }}</span>,
        which went {{ upOrDown(dailyChange(worstPerformer)) }}
        <span :class="getAmountDeltaClass(dailyChange(worstPerformer))">{{ $filters.percentage(dailyChange(worstPerformer)) }}</span>
      </li>
    </ul>
  </div>
</template>

<script>
import Utils from './utils'

export default {

  props: {
    portfolioName: String,
    userData: Object,
  },

  data() {

    return {
    }
  },

  components: {
  },

  computed: {

    bestPerformer() {

      const positions = this.userData.positions.slice()
      const best = positions.sort((a, b) => {
        const dailyChangeA = this.dailyChange(a.ticker)
        const dailyChangeB = this.dailyChange(b.ticker)
        return dailyChangeB - dailyChangeA // Will never overflow with our values
      })[0]
      return best.ticker
    },

    worstPerformer() {

      const positions = this.userData.positions.slice()
      const best = positions.sort((a, b) => {
        const dailyChangeA = this.dailyChange(a.ticker)
        const dailyChangeB = this.dailyChange(b.ticker)
        return dailyChangeA - dailyChangeB // Will never overflow with our values
      })[0]
      return best.ticker
    },

    currentValue() {
      return this.$store.getters.currentValue(this.portfolioName)
    },

    todayBeatMarketBy() {

      const yesterdaysValue = this.$store.getters.yesterdaysValue(this.portfolioName)
      const todaysGain = (this.currentValue - yesterdaysValue) / yesterdaysValue

      return todaysGain - this.gspcTodaysGain
    },

    todayVersusTheMarketVerb() {
      return this.todayBeatMarketBy >= 0 ? 'beat' : 'underperformed'
    },

    gspcTodaysGain() {
      const gspcHistory = this.$store.state.history['^gspc'].history
      const gspcYesterdaysValue = gspcHistory[gspcHistory.length - 2].close
      const gspcTodaysValue = gspcHistory[gspcHistory.length - 1].close
      return (gspcTodaysValue - gspcYesterdaysValue) / gspcYesterdaysValue
    },

    marketDirection() {
      return this.gspcTodaysGain >= 0 ? 'up' : 'down'
    },

    notableMovesUp() {

      const movedUp = []

      this.userData.positions.forEach(position => {
        const ticker = position.ticker
        const history = this.$store.state.history[ticker].history

        let day = history.length - 1
        while (day > 0 && history[day].close > history[day - 1].close) {
          day--
        }
        if (day < history.length - 1) {
          const dayCount = history.length - 1 - day
          const percentage = (history[history.length - 1].close - history[day].close) / history[day].close
          movedUp.push({ ticker, dayCount, percentage })
        }
      });

      return movedUp
    },

    notableMovesDown() {

      const movedDown = []

      this.userData.positions.forEach(position => {
        const ticker = position.ticker
        const history = this.$store.state.history[ticker].history

        let day = history.length - 1
        while (day > 0 && history[day].close < history[day - 1].close) {
          day--
        }
        if (day < history.length - 1) {
          const dayCount = history.length - 1 - day
          const percentage = (history[history.length - 1].close - history[day].close) / history[day].close
          movedDown.push({ ticker, dayCount, percentage })
        }
      });

      return movedDown
    },
  },

  methods: {

    dailyChange(ticker) {
      return this.$store.getters.dailyChange(ticker, true)
    },

    getAmountDeltaClass(value) {
      return Utils.getPrimaryDeltaClass(value)
    },

    upOrDown(amount) {
      // We're OK with 'went up 0%'
      return amount < 0 ? 'down' : 'up'
    }
  }
}
</script>

<style scoped>
.emphasized {
  font-weight: bold;
}
.ticker {
  text-transform: uppercase;
}
</style>
