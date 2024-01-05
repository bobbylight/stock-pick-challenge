<template>
  <div class="notable-moves">

    <ul v-if="notableMovesUp.length || notableMovesDown.length">

      <li v-for="moveUp in notableMovesUp" :key="'move-up-' + moveUp.ticker">
        <span class="emphasized ticker">{{moveUp.ticker}}</span> has been going up the past
        <span class="emphasized">{{moveUp.dayCount}} trading days</span>
        for a total of <span :class="getAmountDeltaClass(moveUp.percentage)">{{$filters.percentage(moveUp.percentage)}}</span>
      </li>

      <li v-for="moveDown in notableMovesDown" :key="'move-down-' + moveDown.ticker">
        <span class="emphasized ticker">{{moveDown.ticker}}</span> has been going down the past
        <span class="emphasized">{{moveDown.dayCount}} trading days</span>
        for a total of <span :class="getAmountDeltaClass(moveDown.percentage)">{{$filters.percentage(moveDown.percentage)}}</span>
      </li>
    </ul>

    <span class="no-movers" v-else>
      Nothing momentous to report!
    </span>
  </div>
</template>

<script>
import Utils from './utils'

const MINIMUM_MOVE_COUNT = 3

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

    notableMovesUp() {

      const movedUp = []

      this.userData.positions.forEach(position => {
        const ticker = position.ticker
        const history = this.$store.state.history[ticker].history

        let day = history.length - 1
        while (day > 0 && parseFloat(history[day].close) > parseFloat(history[day - 1].close)) {
          day--
        }
        console.log(`For ${ticker}, day stops at ${day} - ${history[day].close} <= ${history[day - 1]?.close}`)
        if (day <= history.length - 1 - MINIMUM_MOVE_COUNT) {
          const dayCount = history.length - 1 - day
          const percentage = (history[history.length - 1].close - history[day].close) / history[day].close
          movedUp.push({ ticker, dayCount, percentage })
        }
      })

      return movedUp.sort((a, b) => b.percentage - a.percentage) // Never overflows
    },

    notableMovesDown() {

      const movedDown = []

      this.userData.positions.forEach(position => {
        const ticker = position.ticker
        const history = this.$store.state.history[ticker].history

        let day = history.length - 1
        while (day > 0 && parseFloat(history[day].close) < parseFloat(history[day - 1].close)) {
          day--
        }
        if (day < history.length - 1 - MINIMUM_MOVE_COUNT) {
          const dayCount = history.length - 1 - day
          const percentage = (history[history.length - 1].close - history[day].close) / history[day].close
          movedDown.push({ ticker, dayCount, percentage })
        }
      })

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
.no-movers {
  margin: 0 1rem;
}

.emphasized {
  font-weight: bold;
}
.ticker {
  text-transform: uppercase;
}
</style>
