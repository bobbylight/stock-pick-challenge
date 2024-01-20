<template>
  <div class="user-summary text-left">
    <div class="user-summary-header">
      Initial investment:
    </div>
    <div class="user-summary-value">
      {{ $filters.currency(initialInvestment) }}
    </div>

    <div class="user-summary-header">
      Current value:
    </div>
    <div class="user-summary-value">
      {{ $filters.currency(currentValue) }}
    </div>

    <div class="user-summary-header">
      Today's gain:
    </div>
    <div
      class="user-summary-value"
      :class="getAmountDeltaClass(todaysGain)"
    >
      {{ $filters.currency(todaysGain) }}
    </div>

    <div class="user-summary-header">
      Net gain:
    </div>
    <div
      class="user-summary-value"
      :class="getAmountDeltaClass(currentValue - initialInvestment)"
    >
      {{ $filters.currency(currentValue - initialInvestment) }}
    </div>
  </div>
</template>

<script setup>
import Utils from './utils'
import { computed } from 'vue'
import { useStore } from './store'

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

const currentValue = computed(() => {
  return store.currentValue(props.portfolioName)
})

const initialInvestment = computed(() => {
  return store.initialInvestment(props.portfolioName)
})

const todaysGain = computed(() => {
  const yesterdaysValue = store.yesterdaysValue(props.portfolioName)
  return currentValue.value - yesterdaysValue
})

const getAmountDeltaClass = (value) => {
  return Utils.getPrimaryDeltaClass(value)
}
</script>

<style scoped>
.user-summary {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-auto-rows: minmax(min-content, max-content);
  grid-column-gap: 0;
  grid-row-gap: 0;
  /*min-width:70%;*/
  max-width: 80%;
  margin: 0 auto 1rem;
}

.user-summary-header {
  font-size: larger;
  font-weight: bold;
}
.user-summary-value {
  text-align:right;
}
</style>
