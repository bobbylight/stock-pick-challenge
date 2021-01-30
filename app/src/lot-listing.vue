<template>

  <v-container class="lot-listing">
    <v-row>

      <v-col cols="12">

        <v-select v-model="sortBy" :items="sortOptions"
                  label="Sort by..."
                  />

        <div v-for="item in items" :key="item.ticker" class="lot">

          <div class="lot-title">
            <span class="lot-ticker text--primary">
              {{ item.ticker }}
            </span>
            <span class="lot-price-info">
              {{ item.currentCostPerShare | currency }}
              <span :class="getSecondaryValueClass(item.dailyPercentGain)">({{ item.dailyPercentGain | percentage }})</span>
            </span>
          </div>

          <v-container>
            <v-row>
              Shares:
              <v-spacer></v-spacer>
              <span>
                {{ item.shares }}
              </span>
            </v-row>
          </v-container>

          <v-container>
            <v-row>
              Market value:
              <v-spacer></v-spacer>
              <span>
                {{ item.marketValue | currency }}
              </span>
            </v-row>
          </v-container>

          <v-container>
            <v-row>
              Daily gain:
              <v-spacer></v-spacer>
              <span class="delta-value" :class="getPrimaryValueClass(item.dailyGain)">
                {{ item.dailyGain | currency }}
              </span>
            </v-row>
          </v-container>

          <v-container>
            <v-row>
              Total gain:
              <v-spacer></v-spacer>
              <span class="delta-value" :class="getPrimaryValueClass(item.totalGain)">
                {{ item.totalGain | currency }}
              </span>
            </v-row>
          </v-container>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import Utils from './utils';

export default {

  props: {
    portfolioName: String,
    userData: Object,
  },

  data() {

    return {
      sortBy: 'ticker',
      sortOptions: [
        {
          text: 'Ticker',
          value: 'ticker',
        },
        {
          text: 'Daily Gain',
          value: 'dailyGain',
        },
        {
          text: 'Total Gain',
          value: 'totalGain',
        },
      ]
    }
  },

  components: {
  },

  computed: {

    items() {
      return this.userData.positions.map(position => {

        let shares = 0
        let totalCost = 0
        position.contributions.forEach(c => {
          shares += c.count
          totalCost += (c.count * c.price)
        })

        const costPerShare = totalCost / shares

        const ticker = position.ticker
        const tickerHistory = this.$store.state.history[ticker].history
        const currentCostPerShare = tickerHistory[tickerHistory.length - 1].close
        const marketValue = currentCostPerShare * shares
        const dailyGain = (currentCostPerShare - tickerHistory[tickerHistory.length - 2].close) * shares
        const dailyPercentGain = dailyGain / (marketValue - dailyGain)
        const totalGain = (currentCostPerShare - costPerShare) * shares

        return {
          ticker: position.ticker,
          shares,
          costPerShare,
          currentCostPerShare,
          marketValue,
          dailyGain,
          dailyPercentGain,
          totalGain,
        }
      })
      .sort((a, b) => {
        switch (this.sortBy) {
          default:
          case 'ticker':
            return a.ticker - b.ticker
          case 'dailyGain': // descending
            return b.dailyGain - a.dailyGain
          case 'totalGain': // descending
            return b.totalGain - a.totalGain
        }
      })
    },
  },

  methods: {

    getSecondaryValueClass(value) {
      return Utils.getSecondaryDeltaClass(value)
    },

    getPrimaryValueClass(value) {
      return Utils.getPrimaryDeltaClass(value)
    },

    getDailyPercentageGain(item) {
      const history = this.$store.state.history[item.ticker].history
      const previousClose = history[history.length - 2].close * item.shares
      return item.dailyGain / previousClose
    },

    getTotalPercentageGain(item) {
      const totalCost = item.costPerShare * item.shares
      return item.totalGain / totalCost
    },

    getUrl(ticker) {
      // Yes, Yahoo Finance has both a positional and request parameter
      return `https://finance.yahoo.com/quote/${ticker}?p=${ticker}`
    }
  }
}
</script>

<style scoped>
.lot-ticker {
  font-size: large;
  font-weight: bolder;
  text-transform: uppercase;
}
.lot-price-info {
  margin-left: 0.5rem;
  font-weight: bolder;
}
.lot {
  padding: 1rem;
}
.lot:not(:last-child) {
  border-bottom: 1px solid lightgray;
}
</style>
