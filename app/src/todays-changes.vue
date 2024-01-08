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

<script setup>
import Utils from './utils'
import { computed } from 'vue'
import { useStore } from 'vuex'

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

const bestPerformer = computed(() => {
  const positions = props.userData.positions.slice()
  const best = positions.sort((a, b) => {
    const dailyChangeA = dailyChange(a.ticker)
    const dailyChangeB = dailyChange(b.ticker)
    return dailyChangeB - dailyChangeA // Will never overflow with our values
  })[0]
  return best.ticker
})

const worstPerformer = computed(() => {
  const positions = props.userData.positions.slice()
  const best = positions.sort((a, b) => {
    const dailyChangeA = dailyChange(a.ticker)
    const dailyChangeB = dailyChange(b.ticker)
    return dailyChangeA - dailyChangeB // Will never overflow with our values
  })[0]
  return best.ticker
})

const currentValue = computed(() => store.getters.currentValue(props.portfolioName))

const todayBeatMarketBy = computed(() => {
  const yesterdaysValue = store.getters.yesterdaysValue(props.portfolioName)
  const todaysGain = (currentValue.value - yesterdaysValue) / yesterdaysValue
  return todaysGain - gspcTodaysGain.value
})

const todayVersusTheMarketVerb = computed(() => {
  return todayBeatMarketBy.value >= 0 ? 'beat' : 'underperformed'
})

const gspcTodaysGain = computed(() => {
  const gspcHistory = store.state.history['^gspc'].history
  const gspcYesterdaysValue = gspcHistory[gspcHistory.length - 2]?.close ?? 0
  const gspcTodaysValue = gspcHistory[gspcHistory.length - 1].close
  return (gspcTodaysValue - gspcYesterdaysValue) / gspcYesterdaysValue
})

const marketDirection = computed(() => {
  return gspcTodaysGain.value >= 0 ? 'up' : 'down'
})

const dailyChange = (ticker) => store.getters.dailyChange(ticker, true)

const getAmountDeltaClass = (value) => Utils.getPrimaryDeltaClass(value)

// We're OK with 'went up 0%'
const upOrDown = (amount) => amount < 0 ? 'down' : 'up'
</script>

<style scoped>
.emphasized {
  font-weight: bold;
}
.ticker {
  text-transform: uppercase;
}
</style>
