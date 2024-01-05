<template>
  <div class="stocky-chart-parent">
    <canvas
      ref="canvas"
      width="640"
      height="480"
    />
    <portfolio-growth-chart-tooltip
      :title="tipTitle"
      :model="tooltipModel"
      :datasets="datasets"
      :percentages="percentages"
      :canvas-rect="canvasRect"
      :visible="visible"
    />
  </div>
</template>

<script>
import { shallowRef } from 'vue'
import Chart from 'chart.js/auto'
import { currency, percentage } from './app-filters'
import PortfolioGrowthChartTooltip from './portfolio-growth-chart-tooltip.vue'
import benchmarkData from '@/benchmark-data'

const percentageYAxisLabelCallback = (value) => {
  return percentage(value)
}

export default {
  components: {PortfolioGrowthChartTooltip},
  props: {
    history: {
      type: Array,
      required: true,
    },
    chartType: {
      type: String,
      required: true,
    },
    dataType: {
      type: String,
      required: true,
    },
    comparisons: {
      type: Array,
      required: true,
    },
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
    }
  },

  methods: {

    /**
     * Creates a data array representing a benchmark's data, modified for the current scale
     * (absolute dollar value vs. percentage growth).
     */
    getBenchmarkData(ticker) {

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

      return data
    },

    /**
     * Creates a data array representing the current user's data, modified for the current scale
     * (absolute dollar value vs. percentage growth).
     */
    getUserData() {

      let result

      if (this.percentages) {
        const purchasePrice = this.history[0].value
        result = this.history.map(entry => (entry.value - purchasePrice) / purchasePrice)
      }
      else {
        result = this.history.map(entry => entry.value)
      }

      return result
    },

    /**
     * Returns a data set for a benchmark, suitable for passing directly into the chart component.
     */
    createBenchmarkDataset(ticker) {
      const color = benchmarkData.find(e => ticker === e.ticker).color
      return {
        backgroundColor: `${color}90`,
        borderColor: color,
        data: this.getBenchmarkData(ticker),
        ticker,
        label: this.$store.getters.displayName(ticker),
        fill: this.doFill,
        lineTension: 0.4,
      }
    },

    /**
     * Generates all data (user data + benchmarks) for this chart to display.
     */
    createAllDatasets() {

      const datasets = [
        {
          backgroundColor: '#3e6ecf90',
          borderColor: '#3e6ecf',
          data: this.getUserData(),
          label: 'Your Picks',
          fill: this.doFill,
          lineTension: 0.4,
        },
      ]

      this.comparisons.forEach(ticker => datasets.push(this.createBenchmarkDataset(ticker)))

      return datasets
    },

    updateYAxis() {
      this.chart.options.scales.y.ticks.callback = this.percentages ? percentageYAxisLabelCallback :
          this.currencyYAxisLabelCallback
    },

    currencyYAxisLabelCallback(value) {
      // We assume our value will never drop below $1000 or go above $1 million
      let str = currency(value)
      if (this.$vuetify.display.xs) {
        const lastComma = str.lastIndexOf(',')
        if (lastComma > -1) {
          str = str.substring(0, lastComma) + '.' + str.charAt(lastComma + 1) + 'K'
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

    refreshChartAnnotations(e) {

      const xAxis = this.chart.scales.x
      if (e.offsetX < xAxis.left || e.offsetX > xAxis.right) {
        this.armedX = this.armedY = 0
        return
      }

      const elem = this.chart.getElementsAtEventForMode(e, 'index', { intersect: false }, false)[0]
      this.armedX = elem?.element?.x || 0
      this.armedY = elem?.element?.y || 0
    },

    /**
     * Updates the set of benchmark data sets displayed to reflect the
     * specified comparisons. Used when a benchmark is added or removed.
     */
    updateBenchmarkDatasets() {

      // Add new benchmarks, and update existing ones
      this.comparisons.forEach(ticker => {
        const index = this.chart.data.datasets.findIndex(dataset => dataset.ticker === ticker)
        if (index > -1) {
          this.chart.data.datasets[index].data = this.getBenchmarkData(ticker)
        }
        else {
          this.chart.data.datasets.push(this.createBenchmarkDataset(ticker))
        }
      })

      // Remove any benchmarks that are no longer in our comparisons array
      this.chart.data.datasets = this.chart.data.datasets
          .filter((dataset, index) => index === 0 || this.comparisons.indexOf(dataset.ticker) > -1)
    },

    /**
     * Toggles between "dollar view" and "percentage view".
     */
    updateChartDataForNewDataType() {

      // Update portfolio
      const portfolioData = this.chart.data.datasets[0].data
      portfolioData.length = 0
      portfolioData.push.apply(portfolioData, this.getUserData())

      // Update benchmark data
      this.chart.data.datasets.forEach((dataset, index) => {
        if (index > 0) { // Skip user's portfolio data
          dataset.data = this.getBenchmarkData(dataset.ticker)
        }
      })

      // Refresh the chart to show the changes
      this.updateYAxis()
      this.chart.update()
    },
  },

  watch: {

    chartType() {
      this.chart.data.datasets.forEach(dataset => dataset.fill = this.doFill)
      this.chart.update()
    },

    dataType: {
      handler(newVal) {
        this.percentages = newVal === 'percent'
        if (this.chart) {
          this.updateChartDataForNewDataType()
        }
      },
      immediate: true, // Force handler to run with initial value
    },

    comparisons() {
      this.updateBenchmarkDatasets()
      this.chart.update()
    },

    // We must watch for route updates since our chart isn't bound
    // to data and won't know to rerender when switching between
    // users' pages
    $route() {
      // Since chart styles & benchmarks are user-dependent, we'll
      // just start from scratch
      this.chart.data.datasets = this.createAllDatasets()
      this.chart.update()
    }
  },

  mounted() {

    const canvas = this.$refs.canvas
    const thisVue = this

    this.chart = shallowRef(new Chart(canvas, {
      type: 'line',
      data: {
        labels: this.generateLabels(),
        datasets: this.createAllDatasets(),
      },
      plugins: [
        {
          afterDatasetsDraw: (chart) => {
            if (this.armedX) {

              const xAxis = this.chart.scales.x
              const yAxis = this.chart.scales.y
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

        interaction: {
          mode: 'index',
          intersect: false,
        },

        plugins: {

          tooltip: {
            mode: 'index', // Show all dataset values for this x-coordinate
            intersect: false,
            enabled: false,
            external: function({ chart, tooltip: tooltipModel }) {

              // Hide if no tool tip
              if (tooltipModel.opacity === 0) {
                thisVue.visible = false
                return
              }

              thisVue.visible = true
              thisVue.tipTitle = tooltipModel.dataPoints[0].label
              thisVue.tooltipModel = tooltipModel
              thisVue.datasets = chart.config.data.datasets

              const position = chart.canvas.getBoundingClientRect()
              thisVue.canvasRect = { top: position.top, left: position.left, width: position.width, height: position.height, }
              thisVue.y = position.top + tooltipModel.caretY + 'px'
            },
          },
        },

        scales: {
          x: {
            ticks: {
              maxTicksLimit: 10,
              callback: function(index, value) {
                // Abbreviate the year, but keep label array using 4-digit year for tooltip
                return this.getLabelForValue(value).replace('202', '2')
              },
            },
          },
          y: {
            ticks: {
              callback: this.percentages ? percentageYAxisLabelCallback :
                  this.currencyYAxisLabelCallback
            },
          },
        },

        onHover: (e) => {
          this.refreshChartAnnotations(e)
        },

        annotation: {
          annotations: [],
        },
      },
    }))
  },

  computed: {

    doFill() {
      return this.chartType === 'area'
    },
  },
}
</script>

<style scoped>
.stocky-chart-parent {
  position: relative; /* To allow tool tip to position: absolute relative to it */
}
</style>
