<template>
  <div>
    <canvas ref="canvas" width="640" height="480" />
  </div>
</template>

<script>
import Chart from 'chart.js'

export default {
  name: "portfolio-growth-chart",

  props: {
    history: Array,
  },

  methods: {

    generateLabels() {
      return this.history.map(entry => entry.date)
    },
  },

  mounted() {

    const canvas = this.$refs.canvas

    new Chart(canvas, {
      type: 'line',
      data: {
        labels: this.generateLabels(),
        datasets: [
          {
            backgroundColor: '#e0e0ff90',
            borderColor: '#e0e0ff',
            data: this.history.map(entry => entry.value),
            label: 'Growth',
            fill: 'origin',
          }
        ]
      },
      options: Chart.helpers.merge({}, {
        title: {
          text: 'Whoopdie doo',
          display: true,
        }
      }),
    })
  },
}
</script>

<style scoped>

</style>
