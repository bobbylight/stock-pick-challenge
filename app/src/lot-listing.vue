<template>
  <v-container class="lot-listing">
    <v-row>
      <v-col cols="12">
        <v-select
          v-model="sortBy"
          :items="sortOptions"
          label="Sort by..."
        />

        <div
          v-for="item in items"
          :key="item.ticker"
          class="lot"
        >
          <div class="lot-title">
            <a
              class="ticker-link"
              :href="getYahooFinanceUrl(item.ticker)"
              target="_blank"
            >
              {{ item.ticker }}
            </a>
            <span class="lot-price-info">
              {{ $filters.currency(item.currentCostPerShare) }}
              <span :class="getSecondaryValueClass(item.dailyPercentGain)">({{ $filters.percentage(item.dailyPercentGain) }})</span>
            </span>
          </div>

          <v-container>
            <v-row>
              Shares:
              <v-spacer />
              <span>
                {{ item.shares }}
              </span>
            </v-row>
          </v-container>

          <v-container>
            <v-row>
              Market value:
              <v-spacer />
              <span>
                {{ $filters.currency(item.marketValue) }}
              </span>
            </v-row>
          </v-container>

          <v-container>
            <v-row>
              Daily gain:
              <v-spacer />
              <span
                class="delta-value"
                :class="getPrimaryValueClass(item.dailyGain)"
              >
                {{ $filters.currency(item.dailyGain) }}
              </span>
            </v-row>
          </v-container>

          <v-container>
            <v-row>
              Total gain:
              <v-spacer />
              <span
                class="delta-value"
                :class="getPrimaryValueClass(item.totalGain)"
              >
                {{ $filters.currency(item.totalGain) }}
              </span>
            </v-row>
          </v-container>
        </div>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { computed, ref } from 'vue'
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

const sortBy = ref('ticker')
const sortOptions = [
  {
    title: 'Ticker',
    value: 'ticker',
  },
  {
    title: 'Daily Gain',
    value: 'dailyGain',
  },
  {
    title: 'Total Gain',
    value: 'totalGain',
  },
]

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
    const dailyPercentGain = dailyGain / (marketValue - dailyGain)
    const totalGain = (currentCostPerShare - costPerShare) * shares

    return {
      ticker,
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
      switch (sortBy.value) {
        default:
        case 'ticker':
          return a.ticker.localeCompare(b.ticker)
        case 'dailyGain': // descending
          return b.dailyGain - a.dailyGain
        case 'totalGain': // descending
          return b.totalGain - a.totalGain
      }
    })
})

const getSecondaryValueClass = value => getSecondaryDeltaClass(value)

const getPrimaryValueClass = value => getPrimaryDeltaClass(value)
</script>

<style scoped>
.lot-price-info {
  margin-left: 0.5rem;
  font-weight: bolder;
}
.lot {
  padding: 1rem;

  .lot-title {
    font-size: large;
    font-weight: bolder;
    text-transform: uppercase;
    .ticker-link {
      text-decoration: none;
      &:hover {
        text-decoration: inherit;
      }
    }
  }
}
.lot:not(:last-child) {
  border-bottom: 1px solid lightgray;
}
</style>
