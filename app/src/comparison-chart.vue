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

<script setup>
import { computed, onMounted, ref, shallowRef, toRef, watch } from 'vue'
import { useDisplay } from 'vuetify'
import Chart from 'chart.js/auto'
import { currency, percentage } from './app-filters'
import PortfolioGrowthChartTooltip from './portfolio-growth-chart-tooltip.vue'

const display = useDisplay()

const percentageYAxisLabelCallback = value => {
  return percentage(value)
}

const props = defineProps({
  userInfos: {
    type: Array,
    required: true,
  },
  dayCount: {
    type: Number,
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
})

// TODO: Some of these may need to be reactive() if they're objects, or simply not ref if they never change
const armedX = ref(0)
const armedY = ref(0)
const chart = shallowRef(null)
const percentages = ref(false)
const tooltipModel = ref(null)
const tipTitle = ref(null)
const datasets = ref([])
const visible = ref(false)
const canvasRect = ref({
  top: 0,
  left: 0,
  width: 0,
  height: 0,
})
const canvas = ref(null)
const userColors = ['#e6439f', '#27ba67', '#494f9c', '#d1871f', '#893168', '#f5e616']

const currencyYAxisLabelCallback = value => {
  // We assume our value will never drop below $1000 or go above $1 million
  let str = currency(value)
  if (display.xs.value) {
    const lastComma = str.lastIndexOf(',')
    if (lastComma > -1) {
      str = str.substring(0, lastComma) + '.' + str.charAt(lastComma + 1) + 'K'
    }
  } else {
    str = str.substring(0, str.length - 3)
  }
  return str
}

const generateLabels = () => {
  return truncate(props.userInfos[0].history, props.dayCount).map(entry => {
    // Use close of the market to avoid timezone drift of date
    const date = new Date(`${entry.date}T16:00:00-05:00`)
    return date.toLocaleDateString('en', { dateStyle: 'medium' })
  })
}

const refreshChartAnnotations = e => {
  const xAxis = chart.value.scales.x
  if (e.native.offsetX < xAxis.left || e.native.offsetX > xAxis.right) {
    armedX.value = armedY.value = 0
    return
  }

  const elem = chart.value.getElementsAtEventForMode(e, 'index', { intersect: false }, false)[0]
  armedX.value = elem?.element?.x || 0
  armedY.value = elem?.element?.y || 0
}

const truncate = (history, dayCount) => {
  return dayCount <= 0 || history.length <= dayCount ? history : history.slice(history.length - dayCount)
}

const updateChartDataForNewDataType = () => {
  props.userInfos.forEach((userInfo, index) => {
    const history = truncate(userInfo.history, props.dayCount)
    const portfolioData = chart.value.data.datasets[index].data
    portfolioData.length = 0

    // Update portfolio data and y-axis to reflect new scale
    if (percentages.value) {
      history.forEach(entry => {
        portfolioData.push((entry.value - history[0].value) / history[0].value)
      })
      chart.value.options.scales.y.ticks.callback = percentageYAxisLabelCallback
    } else {
      history.forEach(entry => portfolioData.push(entry.value))
      chart.value.options.scales.y.ticks.callback = currencyYAxisLabelCallback
    }
  })

  // Refresh the chart to show the changes
  armedX.value = armedY.value = 0
  chart.value.update()
}

const typeRef = toRef(props, 'type')
watch(typeRef, () => {
  chart.value.data.datasets.forEach(dataset => dataset.fill = doFill.value)
  chart.value.update()
})

const dataTypeRef = toRef(props, 'dataType')
watch(dataTypeRef, newVal => {
  percentages.value = newVal === 'percent'
  updateChartDataForNewDataType()
})
const dayCountRef = toRef(props, 'dayCount')
watch(dayCountRef, () => {
  chart.value.data.labels = generateLabels()
  updateChartDataForNewDataType()
})

onMounted(() => {
  const initialDatasets = props.userInfos.map((userInfo, index) => {
    return {
      backgroundColor: `${userColors[index]}90`,
      borderColor: userColors[index],
      data: truncate(userInfo.history, props.dayCount).map(entry => entry.value),
      label: userInfo.name,
      fill: doFill.value,
      lineTension: 0.4,
    }
  })

  chart.value = new Chart(canvas.value, {
    type: 'line',
    data: {
      labels: generateLabels(),
      datasets: initialDatasets,
    },
    plugins: [
      {
        afterDatasetsDraw: chart => {
          if (armedX.value > 0) {
            const xAxis = chart.scales.x
            const yAxis = chart.scales.y
            const ctx = chart.canvas.getContext('2d')
            ctx.strokeStyle = '#606060'

            const origCompositionOperation = ctx.globalCompositeOperation
            ctx.globalCompositeOperation = 'xor'
            ctx.setLineDash([3, 3])
            ctx.beginPath()
            ctx.moveTo(armedX.value, yAxis.top)
            ctx.lineTo(armedX.value, yAxis.bottom)
            ctx.moveTo(xAxis.left, armedY.value)
            ctx.lineTo(xAxis.right, armedY.value)
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
          external: function ({ chart, tooltip }) {
            // Hide if no tool tip
            if (tooltip.opacity === 0) {
              visible.value = false
              return
            }

            visible.value = true
            tipTitle.value = tooltip.dataPoints[0].label
            tooltipModel.value = tooltip
            datasets.value = chart.config.data.datasets

            const position = chart.canvas.getBoundingClientRect()
            canvasRect.value = {
              top: position.top,
              left: position.left,
              width: position.width,
              height: position.height,
            }
          },
        },
      },

      scales: {
        x: {
          ticks: {
            maxTicksLimit: 10,
            callback: function (index, value) {
              // Abbreviate the year, but keep label array using 4-digit year for tooltip
              return this.getLabelForValue(value).replace('202', '2')
            },
          },
        },
        y: {
          ticks: {
            callback: currencyYAxisLabelCallback,
          },
        },
      },

      onHover: e => {
        refreshChartAnnotations(e)
      },

      annotation: {
        annotations: [],
      },
    },
  })
})

const doFill = computed(() => props.type === 'area')
</script>

<style scoped>
.stocky-chart-parent {
  position: relative; /* To allow tool tip to position: absolute relative to it */
}
</style>
