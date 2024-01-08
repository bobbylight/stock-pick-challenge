<template>
  <div class="notable-moves">
    <ul v-if="notableMovesUp.length || notableMovesDown.length">
      <li
        v-for="moveUp in notableMovesUp"
        :key="'move-up-' + moveUp.ticker"
      >
        <span class="emphasized ticker">{{ moveUp.ticker }}</span> has been going up the past
        <span class="emphasized">{{ moveUp.dayCount }} trading days</span>
        for a total of <span :class="getAmountDeltaClass(moveUp.percentage)">{{ $filters.percentage(moveUp.percentage) }}</span>
      </li>

      <li
        v-for="moveDown in notableMovesDown"
        :key="'move-down-' + moveDown.ticker"
      >
        <span class="emphasized ticker">{{ moveDown.ticker }}</span> has been going down the past
        <span class="emphasized">{{ moveDown.dayCount }} trading days</span>
        for a total of <span :class="getAmountDeltaClass(moveDown.percentage)">{{ $filters.percentage(moveDown.percentage) }}</span>
      </li>
    </ul>

    <span
      class="no-movers"
      v-else
    >
      Nothing momentous to report!
    </span>
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

const MINIMUM_MOVE_COUNT = 3

const notableMovesUp = computed(() => {

  const movedUp = []

  props.userData.positions.forEach(position => {
    const ticker = position.ticker
    const history = store.state.history[ticker].history

    let day = history.length - 1
    while (day > 0 && parseFloat(history[day].close) > parseFloat(history[day - 1].close)) {
      day--
    }
    console.log(`For ${ticker}, day stops at ${day} - ${history[day].close} <= ${history[day - 1]?.close}`)
    if (day <= history.length - 1 - MINIMUM_MOVE_COUNT) {
      const dayCount = history.length - 1 - day
      const percentage = (history[history.length - 1].close - history[day].close) / history[day].close
      movedUp.push({ticker, dayCount, percentage})
    }
  })

  return movedUp.sort((a, b) => b.percentage - a.percentage) // Never overflows
})

const notableMovesDown = computed(() => {

  const movedDown = []

  props.userData.positions.forEach(position => {
    const ticker = position.ticker
    const history = store.state.history[ticker].history

    let day = history.length - 1
    while (day > 0 && parseFloat(history[day].close) < parseFloat(history[day - 1].close)) {
      day--
    }
    if (day < history.length - 1 - MINIMUM_MOVE_COUNT) {
      const dayCount = history.length - 1 - day
      const percentage = (history[history.length - 1].close - history[day].close) / history[day].close
      movedDown.push({ticker, dayCount, percentage})
    }
  })

  return movedDown
})

const getAmountDeltaClass = (value) => Utils.getPrimaryDeltaClass(value)
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
