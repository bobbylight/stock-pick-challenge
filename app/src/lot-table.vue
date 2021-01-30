<template>
  <v-data-table
      class="lot-table"
      :headers="headers"
      :items="items"
      :single-expand="true"
      :expand.sync="expanded"
      item-key="name"
      :show-expand="!$vuetify.breakpoint.mobile"
      dense
      :items-per-page="100"
      hide-default-footer
  >

    <template v-slot:item.ticker="{ item }">
      <a class="ticker-link" :href="getUrl(item.ticker)" target="_blank">{{ item.ticker }}</a>
    </template>

    <template v-slot:item.costPerShare="{ item }">
      {{ item.costPerShare | currency }}
    </template>

    <template v-slot:item.currentCostPerShare="{ item }">
      {{ item.currentCostPerShare | currency }}
    </template>

    <template v-slot:item.marketValue="{ item }">
      {{ item.marketValue | currency }}
    </template>

    <template v-slot:item.dailyGain="{ item }">
      <div>
        <div :class="getPercentageClass(item.dailyGain)">
          {{ getDailyPercentageGain(item) | percentage }}
        </div>
        <div :class="getAmountDeltaClass(item.dailyGain)">
          {{ item.dailyGain | currency }}
        </div>
      </div>
    </template>

    <template v-slot:item.totalGain="{ item }">
      <div>
        <div :class="getPercentageClass(item.totalGain)">
          {{ getTotalPercentageGain(item) | percentage }}
        </div>
        <div :class="getAmountDeltaClass(item.totalGain)">
          {{ item.totalGain | currency }}
        </div>
      </div>
    </template>

    <template v-slot:body.append="{ }">
      <tr class="text--primary lot-table-footer-row" v-if="!$vuetify.breakpoint.mobile">
        <td></td>
        <td class="text-start">Total</td>
        <td></td>
        <td></td>
        <td></td>
        <td class="text-end">{{ currentValue | currency }}</td>
        <td class="text-end">
          <div :class="getPercentageClass(averageDailyPercentageChange)">
            {{ averageDailyPercentageChange | percentage }}
          </div>
          <div :class="getAmountDeltaClass(totalDailyGain)">
            {{ totalDailyGain | currency }}
          </div>
        </td>
        <td class="text-end">
          <div :class="getPercentageClass(averageTotalPercentageChange)">
            {{ averageTotalPercentageChange | percentage }}
          </div>
          <div :class="getAmountDeltaClass(totalGain)">
            {{ totalGain | currency }}
          </div>
        </td>
      </tr>
    </template>
  </v-data-table>
</template>

<script>
import Utils from './utils';

export default {

  name: 'LotTable',

  props: {
    portfolioName: String,
    userData: Object,
  },

  data() {

    return {

      expanded: [],

      headers: [
        {
          text: 'Ticker',
          value: 'ticker'
        },
        {
          text: 'Shares',
          value: 'shares',
          align: 'end',
        },
        {
          text: 'Avg Cost/Share',
          value: 'costPerShare',
          align: 'end',
        },
        {
          text: 'Current Cost/Share',
          value: 'currentCostPerShare',
          align: 'end',
        },
        {
          text: 'Market Value',
          value: 'marketValue',
          align: 'end',
        },
        {
          text: 'Daily Gain',
          value: 'dailyGain',
          align: 'end',
        },
        {
          text: 'Total Gain',
          value: 'totalGain',
          align: 'end',
        },
      ],
    }
  },

  components: {
  },

  computed: {

    averageDailyPercentageChange() {
      const yesterdaysValue = this.$store.getters.yesterdaysValue(this.portfolioName)
      const todaysValue = this.currentValue
      return (todaysValue - yesterdaysValue) / yesterdaysValue
    },

    averageTotalPercentageChange() {
      return this.totalGain / this.$store.getters.initialInvestment(this.portfolioName)
    },

    currentValue() {
      return this.$store.getters.currentValue(this.portfolioName)
    },

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
        const totalGain = (currentCostPerShare - costPerShare) * shares

        return {
          ticker: position.ticker,
          shares,
          costPerShare,
          currentCostPerShare,
          marketValue,
          dailyGain,
          totalGain,
        }
      })
    },

    totalDailyGain() {
      let total = 0
      this.items.forEach(item => total += item.dailyGain)
      return total
    },

    totalGain() {
      let total = 0
      this.items.forEach(item => total += item.totalGain)
      return total
    }
  },

  methods: {

    getAmountDeltaClass(value) {
      return Utils.getSecondaryDeltaClass(value)
    },

    getPercentageClass(value) {
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
.lot-table {
  padding-bottom: 16px; /* Matches top padding of card */
}

.lot-table-footer-row {
  font-weight: bold;
}

.ticker-link {
  text-transform: uppercase;
}
</style>
