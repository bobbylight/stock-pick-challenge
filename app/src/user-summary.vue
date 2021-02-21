<template>
  <div class="user-summary text-left">

      <div class="user-summary-header">
        Initial investment:
      </div>
      <div class="user-summary-value">
        {{ initialInvestment | currency }}
      </div>

      <div class="user-summary-header">
        Current value:
      </div>
      <div class="user-summary-value">
        {{ currentValue | currency }}
      </div>

      <div class="user-summary-header">
        Today's gain:
      </div>
      <div class="user-summary-value" :class="getAmountDeltaClass(todaysGain)">
        {{ todaysGain | currency }}
      </div>

      <div class="user-summary-header">
        Net gain:
      </div>
      <div class="user-summary-value" :class="getAmountDeltaClass(currentValue - initialInvestment)">
        {{ currentValue - initialInvestment | currency }}
      </div>
    </div>
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
    }
  },

  components: {
  },

  computed: {

    currentValue() {
      return this.$store.getters.currentValue(this.portfolioName)
    },

    initialInvestment() {
      return this.$store.getters.initialInvestment(this.portfolioName)
    },

    todaysGain() {
      const yesterdaysValue = this.$store.getters.yesterdaysValue(this.portfolioName)
      return this.currentValue - yesterdaysValue
    }
  },

  methods: {

    getAmountDeltaClass(value) {
      return Utils.getPrimaryDeltaClass(value)
    },
  }
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
