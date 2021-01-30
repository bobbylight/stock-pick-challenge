<template>
  <div>
    <canvas ref="canvas" width="640" height="480" />
  </div>
</template>

<script>
import Chart from 'chart.js'
import {currency, percentage} from './app-filters'

const currencyYAxisLabelCallback = (value) => {
  const str = currency(value)
  return str.substring(0, str.length - 3)
}

const percentageYAxisLabelCallback = (value) => {
  return percentage(value)
}

export default {

  props: {
    history: Array,
    type: String,
    dataType: String,
    comparisons: Array,
  },

  data() {
    return {
      chart: null,
      percentages: false,
      comparisonColors: [ '#9e9519', '#f5e616', '#27ba67', '#e6439f', '#494f9c', '#d1871f' ],
    }
  },

  methods: {

    createBenchmarkDataset(ticker, index) {

      let data
      const tickerHistory = this.$store.getters.securityHistory(ticker, this.history[0].value)
      if (this.percentages) {
        data = []
        tickerHistory.forEach(value => {
          data.push((value - tickerHistory[0]) / tickerHistory[0])
        })
      }
      else {
        data = tickerHistory
      }

      return {
        backgroundColor: `${this.comparisonColors[index]}90`,
        borderColor: this.comparisonColors[index],
        data,
        label: ticker,
        fill: this.doFill,
      }
    },

    generateLabels() {
      return this.history.map(entry => entry.date)
    },

    updateBenchmarkData() {

      // Add new benchmarks, and update existing ones
      this.comparisons.forEach(ticker => {
        const index = this.chart.data.datasets.findIndex(dataset => dataset.label === ticker)
        if (index > -1) {
          let data
          const tickerHistory = this.$store.getters.securityHistory(ticker, this.history[0].value)
          if (this.percentages) {
            data = []
            tickerHistory.forEach(value => {
              data.push((value - tickerHistory[0]) / tickerHistory[0])
            })
          }
          else {
            data = tickerHistory
          }
          this.chart.data.datasets[index].data = data
        }
        else {
          this.chart.data.datasets.push(this.createBenchmarkDataset(ticker, this.comparisons.length))
        }
      })

      // Remove any benchmarks that are no longer in our comparisons array
      this.chart.data.datasets = this.chart.data.datasets.filter((dataset, index) => index === 0 || this.comparisons.indexOf(dataset.label) > -1)
    },

    updateChartDataForNewDataType() {

      const portfolioData = this.chart.data.datasets[0].data
      portfolioData.length = 0

      // Update portfolio data and y-axis to reflect new scale
      if (this.percentages) {
        this.history.forEach(entry => {
          portfolioData.push((entry.value - this.history[0].value) / this.history[0].value)
        })
        this.chart.options.scales.yAxes[0].ticks.callback = percentageYAxisLabelCallback
      }
      else {
        this.history.forEach(entry => portfolioData.push(entry.value))
        this.chart.options.scales.yAxes[0].ticks.callback = currencyYAxisLabelCallback
      }

      // Update benchmark data
      this.chart.data.datasets.forEach((dataset, index) => {

        if (index === 0) {
          return;
        }

        const ticker = dataset.label
        const tickerHistory = this.$store.getters.securityHistory(ticker, this.history[0].value)
        let data
        if (this.percentages) {
          data = []
          tickerHistory.forEach(value => {
            data.push((value - tickerHistory[0]) / tickerHistory[0])
          })
        }
        else {
          data = tickerHistory
        }
        dataset.data = data
      })

      // Refresh the chart to show the changes
      this.chart.update()
    },
  },

  watch: {

    type() {
      this.chart.data.datasets.forEach(dataset => dataset.fill = this.doFill)
      this.chart.update()
    },

    dataType(newVal) {
      this.percentages = newVal === 'percent'
      this.updateChartDataForNewDataType()
    },

    comparisons() {
      this.updateBenchmarkData()
      this.chart.update()
    }
  },

  mounted() {

    const datasets = [
      {
        backgroundColor: '#3e6ecf90',
        borderColor: '#3e6ecf',
        data: this.history.map(entry => entry.value),
        label: 'Your Picks',
        fill: this.doFill,
      },
    ]
    this.comparisons.forEach((ticker, index) => datasets.push(this.createBenchmarkDataset(ticker, index)))

    const canvas = this.$refs.canvas

    this.chart = new Chart(canvas, {
      type: this.type,
      data: {
        labels: this.generateLabels(),
        datasets,
      },
      options: Chart.helpers.merge({}, {

        scales: {
          yAxes: [{
            ticks: {
              callback: currencyYAxisLabelCallback,
            },
          }],
        },

        tooltips: {
          mode: 'x',
          callbacks: {
            label: (toolTipItem, data) => {
              const valueFunc = this.percentages ? percentage : currency
              return `${data.datasets[toolTipItem.datasetIndex].label}: ${valueFunc(toolTipItem.yLabel)}`
            },
          },
        }
      }),
    })
  },

  computed: {

    doFill() {
      return this.type === 'area'
    },
  },
}
</script>

<style scoped>

</style>
