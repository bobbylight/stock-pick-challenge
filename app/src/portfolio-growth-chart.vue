<template>
  <div class="stocky-chart-parent">
    <canvas ref="canvas" width="640" height="480" />
    <portfolio-growth-chart-tooltip
        :title="tipTitle"
        :model="tooltipModel"
        :datasets="datasets"
        :percentages="percentages"
        :canvas-rect="canvasRect"
        :visible="visible"/>
  </div>
</template>

<script>
import Chart from 'chart.js'
import { currency, percentage } from './app-filters'
import PortfolioGrowthChartTooltip from './portfolio-growth-chart-tooltip';

const percentageYAxisLabelCallback = (value) => {
  return percentage(value)
}

export default {
  components: {PortfolioGrowthChartTooltip},
  props: {
    history: Array,
    type: String,
    dataType: String,
    comparisons: Array,
  },

  data() {
    return {
      armedX: 0,
      armedY: 0,
      chart: null,
      percentages: false,
      tooltipModel: null,
      tipTitle: null,
      datasets: null,
      visible: false,
      canvasRect: null,
      comparisonColors: [ '#e6439f', '#27ba67', '#494f9c', '#d1871f', '#893168', '#f5e616' ],
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

      const color = this.getUnusedColor(index)
      return {
        backgroundColor: `${color}90`,
        borderColor: color,
        data,
        ticker,
        label: this.$store.getters.displayName(ticker),
        fill: this.doFill,
      }
    },

    currencyYAxisLabelCallback(value) {
      // We assume our value will never drop below $1000 or go above $1 million
      let str = currency(value)
      if (this.$vuetify.breakpoint.xs) {
        const lastComma = str.lastIndexOf(',')
        if (lastComma > -1) {
          str = str.substr(0, lastComma) + '.' + str.charAt(lastComma + 1) + 'K'
        }
      }
      else {
        str = str.substring(0, str.length - 3)
      }
      return str
    },

    generateLabels() {
      //return this.history.map(entry => entry.date)
      return this.history.map(entry => {
        // Use close of the market to avoid timezone drift of date
        const date = new Date(`${entry.date}T16:00:00-05:00`)
        return date.toLocaleDateString('en', {dateStyle: 'medium'})
      })
    },

    getUnusedColor(index) {

      if (this.chart) {
        for (let color of this.comparisonColors) {
          if (this.chart.data.datasets.findIndex(dataset => color === dataset.borderColor) === -1) {
            return color
          }
        }
      }

      // Only happens when the chart doesn't yet exist - just go in index order
      return this.comparisonColors[index]
    },

    refreshChartAnnotations(e) {

      const xAxis = this.chart.scales['x-axis-0']
      if (e.offsetX < xAxis.left || e.offsetX > xAxis.right) {
        this.armedX = this.armedY = 0
        return
      }

      const elem = this.chart.getElementsAtXAxis(e)[0]
      this.armedX = elem?._model?.x || 0
      this.armedY = elem?._model?.y || 0
    },

    updateBenchmarkData() {

      // Add new benchmarks, and update existing ones
      this.comparisons.forEach(ticker => {
        const index = this.chart.data.datasets.findIndex(dataset => dataset.ticker === ticker)
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
          this.chart.data.datasets.push(this.createBenchmarkDataset(ticker, this.chart.data.datasets.length - 1))
        }
      })

      // Remove any benchmarks that are no longer in our comparisons array
      this.chart.data.datasets = this.chart.data.datasets
          .filter((dataset, index) => index === 0 || this.comparisons.indexOf(dataset.ticker) > -1)
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
        this.chart.options.scales.yAxes[0].ticks.callback = this.currencyYAxisLabelCallback
      }

      // Update benchmark data
      this.chart.data.datasets.forEach((dataset, index) => {

        if (index === 0) {
          return;
        }

        const ticker = dataset.ticker
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

    xAxisLabelCallback(value) {
      // Abbreviate the year, but keep label array using 4-digit year for tooltip
      return value.replace('202', '2')
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
    const thisVue = this

    this.chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: this.generateLabels(),
        datasets,
      },
      plugins: [
        {
          afterDatasetsDraw: (chart) => {
            if (this.armedX) {

              const xAxis = this.chart.scales['x-axis-0']
              const yAxis = this.chart.scales['y-axis-0']
              const ctx = chart.canvas.getContext('2d')
              ctx.strokeStyle = '#606060'

              const origCompositionOperation = ctx.globalCompositeOperation
              ctx.globalCompositeOperation = 'xor'
              ctx.setLineDash([ 3, 3 ])
              ctx.beginPath()
              ctx.moveTo(this.armedX, yAxis.top)
              ctx.lineTo(this.armedX, yAxis.bottom)
              ctx.moveTo(xAxis.left, this.armedY)
              ctx.lineTo(xAxis.right, this.armedY)
              ctx.stroke()
              ctx.globalCompositeOperation = origCompositionOperation
            }
          },
        },
      ],
      options: {

        scales: {
          xAxes: [{
            ticks: {
              maxTicksLimit: 10,
              callback: this.xAxisLabelCallback,
            },
          }],
          yAxes: [{
            ticks: {
              callback: this.currencyYAxisLabelCallback,
            },
          }],
        },

        tooltips: {
          mode: 'index', // Show all dataset values for this x-coordinate
          intersect: false,
          enabled: false,
          custom: function(tooltipModel) {

            // Hide if no tool tip
            if (tooltipModel.opacity === 0) {
              thisVue.visible = false
              return
            }

            thisVue.visible = true
            thisVue.tipTitle = tooltipModel.dataPoints[0].label
            thisVue.tooltipModel = tooltipModel
            thisVue.datasets = this._chart.config.data.datasets

            const position = this._chart.canvas.getBoundingClientRect()
            thisVue.canvasRect = { top: position.top, left: position.left, width: position.width, height: position.height, }
            thisVue.y = position.top + tooltipModel.caretY + 'px'
          },
        },

        onHover: (e) => {
          this.refreshChartAnnotations(e)
        },

        annotation: {
          annotations: [],
        },
      },
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
.stocky-chart-parent {
  position: relative; /* To allow tool tip to position: absolute relative to it */
}
</style>
