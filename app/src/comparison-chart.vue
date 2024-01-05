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

const percentageYAxisLabelCallback = (value) => {
  return percentage(value)
}

export default {
  components: {PortfolioGrowthChartTooltip},
  props: {
    userInfos: {
      type: Array,
      required: true,
    },
    type: {
      type: String,
      required: true,
    },
    dataType: {
      type: String,
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
      comparisonColors: [ '#e6439f', '#27ba67', '#494f9c', '#d1871f', '#893168', '#f5e616' ],
    }
  },

  methods: {

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
      return this.userInfos[0].history.map(entry => {
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

    updateChartDataForNewDataType() {

      this.userInfos.forEach((userInfo, index) => {

        const history = userInfo.history
        const portfolioData = this.chart.data.datasets[index].data
        portfolioData.length = 0

        // Update portfolio data and y-axis to reflect new scale
        if (this.percentages) {
          history.forEach(entry => {
            portfolioData.push((entry.value - history[0].value) / history[0].value)
          })
          this.chart.options.scales.y.ticks.callback = percentageYAxisLabelCallback
        } else {
          history.forEach(entry => portfolioData.push(entry.value))
          this.chart.options.scales.y.ticks.callback = this.currencyYAxisLabelCallback
        }
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
  },

  mounted() {

    const datasets = this.userInfos.map((userInfo, index) => {
      return {
        backgroundColor: `${this.comparisonColors[index]}90`,
        borderColor: this.comparisonColors[index],
        data: userInfo.history.map(entry => entry.value),
        label: userInfo.name,
        fill: this.doFill,
        lineTension: 0.4,
      }
    })

    const canvas = this.$refs.canvas
    const thisVue = this

    this.chart = shallowRef(new Chart(canvas, {
      type: 'line',
      data: {
        labels: this.generateLabels(),
        datasets,
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
              callback: this.currencyYAxisLabelCallback,
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
