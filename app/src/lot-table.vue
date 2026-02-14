<template>
  <v-data-table
    class="lot-table"
    :headers="headers"
    :items="items"
    :single-expand="true"
    item-key="name"
    density="comfortable"
    :items-per-page="100"
  >
    <template #item.ticker="{ item }">
      <a
        class="ticker-link"
        :href="getYahooFinanceUrl(item.ticker)"
        target="_blank"
      >
        {{ item.ticker }}
      </a>
    </template>

    <template #item.costPerShare="{ item }">
      {{ $filters.currency(item.costPerShare) }}
    </template>

    <template #item.currentCostPerShare="{ item }">
      {{ $filters.currency(item.currentCostPerShare) }}
    </template>

    <template #item.marketValue="{ item }">
      {{ $filters.currency(item.marketValue) }}
    </template>

    <template #item.dailyGain="{ item }">
      <div>
        <div :class="getPercentageClass(item.dailyGain)">
          {{ $filters.percentage(getDailyPercentageGain(item)) }}
        </div>
        <div :class="getAmountDeltaClass(item.dailyGain)">
          {{ $filters.currency(item.dailyGain) }}
        </div>
      </div>
    </template>

    <template #item.totalGain="{ item }">
      <div>
        <div :class="getPercentageClass(item.totalGain)">
          {{ $filters.percentage(getTotalPercentageGain(item)) }}
        </div>
        <div :class="getAmountDeltaClass(item.totalGain)">
          {{ $filters.currency(item.totalGain) }}
        </div>
      </div>
    </template>

    <template #body.append="{ }">
      <tr
        class="text--primary lot-table-footer-row"
        v-if="!$vuetify.display.xs"
      >
        <td class="text-start">
          Total
        </td>
        <td />
        <td />
        <td />
        <td class="text-end">
          {{ $filters.currency(currentValue) }}
        </td>
        <td class="text-end">
          <div :class="getPercentageClass(averageDailyPercentageChange)">
            {{ $filters.percentage(averageDailyPercentageChange) }}
          </div>
          <div :class="getAmountDeltaClass(totalDailyGain)">
            {{ $filters.currency(totalDailyGain) }}
          </div>
        </td>
        <td class="text-end">
          <div :class="getPercentageClass(averageTotalPercentageChange)">
            {{ $filters.percentage(averageTotalPercentageChange) }}
          </div>
          <div :class="getAmountDeltaClass(totalGain)">
            {{ $filters.currency(totalGain) }}
          </div>
        </td>
      </tr>
    </template>

    <template #bottom />
  </v-data-table>
</template>

<script setup>
import { computed } from 'vue'
import { useStore } from './store'
import {getPrimaryDeltaClass, getSecondaryDeltaClass, getYahooFinanceUrl} from './utils'

const store = useStore()

const props = defineProps({
  portfolioName: {
    type: String,
    required: true,
  },
  userData: {
    type: Object,
    required: true,
  },
})

const headers = [
  {
    title: 'Ticker',
    value: 'ticker',
  },
  {
    title: 'Shares',
    value: 'shares',
    align: 'end',
  },
  {
    title: 'Avg Cost/Share',
    value: 'costPerShare',
    align: 'end',
  },
  {
    title: 'Current Cost/Share',
    value: 'currentCostPerShare',
    align: 'end',
  },
  {
    title: 'Market Value',
    value: 'marketValue',
    align: 'end',
  },
  {
    title: 'Daily Gain',
    value: 'dailyGain',
    align: 'end',
  },
  {
    title: 'Total Gain',
    value: 'totalGain',
    align: 'end',
  },
]

const averageDailyPercentageChange = computed(() => {
  const yesterdaysValue = store.yesterdaysValue(props.portfolioName)
  const todaysValue = currentValue.value
  return (todaysValue - yesterdaysValue) / yesterdaysValue
})

const averageTotalPercentageChange = computed(() => {
  return totalGain.value / store.initialInvestment(props.portfolioName)
})

const currentValue = computed(() => {
  return store.currentValue(props.portfolioName)
})

const items = computed(() => {
  return props.userData.positions.map(position => {
    let shares = 0
    let totalCost = 0
    position.contributions.forEach(c => {
      shares += c.count
      totalCost += (c.count * c.price)
    })

    const costPerShare = totalCost / shares

    const ticker = position.ticker
    const tickerHistory = store.history[ticker].history
    const currentCostPerShare = tickerHistory[tickerHistory.length - 1].close
    const marketValue = currentCostPerShare * shares
    const dailyGain = store.stillActivelyTrading(ticker) ?
      (currentCostPerShare - (tickerHistory[tickerHistory.length - 2]?.close ?? 0)) * shares : 0
    const totalGain = (currentCostPerShare - costPerShare) * shares

    return {
      ticker,
      shares,
      costPerShare,
      currentCostPerShare,
      marketValue,
      dailyGain,
      totalGain,
    }
  })
})

const totalDailyGain = computed(() => items.value.reduce((acc, curr) => acc + curr.dailyGain, 0))

const totalGain = computed(() => items.value.reduce((acc, curr) => acc + curr.totalGain, 0))

const getAmountDeltaClass = value => getSecondaryDeltaClass(value)

const getPercentageClass = value => getPrimaryDeltaClass(value)

const getDailyPercentageGain = item => {
  const history = store.history[item.ticker].history
  const previousClose = (history[history.length - 2]?.close ?? 0) * item.shares
  return item.dailyGain / previousClose
}

const getTotalPercentageGain = item => {
  const totalCost = item.costPerShare * item.shares
  return item.totalGain / totalCost
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
  text-decoration: none;
  color: #0ea5e9;
  font-weight: 500;
  transition: color 0.2s ease;
  &:hover {
    text-decoration: underline;
    color: #0284c7;
  }
}

.v-theme--dark .ticker-link {
  color: #38bdf8;
  &:hover {
    color: #7dd3fc;
  }
}
</style>
