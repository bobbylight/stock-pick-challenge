<template>
  <div class="home">

    <div v-for="position in portfolio" :key="position.ticker">
      {{ position.ticker }}: {{ position.shareCount }}
    </div>

    <div class="chart-wrapper">
      <portfolio-growth-chart :history="userData.history"/>
    </div>
  </div>
</template>

<script>

import PortfolioGrowthChart from '@/portfolio-growth-chart';
export default {

  name: 'User',

  components: {
    PortfolioGrowthChart
  },

  computed: {
    portfolio() {

      const portfolio = []

      this.userData.positions.forEach((position) => {

        let shareCount = 0
        position.contributions.forEach(share => shareCount += share.count)

        portfolio.push({
          ticker: position.ticker,
          shareCount,
        })
      })

      return portfolio
    },

    userData() {
      const user = this.$route.params.user
      return this.$store.state[user]
    }
  },

  methods: {

  }
}
</script>

<style scoped>
.chart-wrapper {
  max-width: 800px;
  margin: 0 auto;
}
</style>
