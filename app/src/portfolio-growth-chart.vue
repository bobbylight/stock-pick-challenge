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
import { useStore } from './store'
import { useRoute } from 'vue-router'
import { useDisplay } from 'vuetify'
import Chart from 'chart.js/auto'
import { currency, percentage } from './app-filters'
import PortfolioGrowthChartTooltip from './portfolio-growth-chart-tooltip.vue'
import benchmarkData from '@/benchmark-data'

const store = useStore()
const route = useRoute()
const display = useDisplay()

const percentageYAxisLabelCallback = value => {
  return percentage(value)
}

const props = defineProps({
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
  dayCount: {
    type: Number,
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

/**
 * Creates a data array representing a benchmark's data, modified for the current scale
 * (absolute dollar value vs. percentage growth).
 */
const getBenchmarkData = ticker => {
  let data

  const tickerHistory = truncate(store.securityHistory(ticker, props.history[0].value), props.dayCount)
  if (percentages.value) {
    data = []
    tickerHistory.forEach(value => {
      data.push((value - tickerHistory[0]) / tickerHistory[0])
    })
  } else {
    data = tickerHistory
  }

  return data
}

/**
 * Creates a data array representing the current user's data, modified for the current scale
 * (absolute dollar value vs. percentage growth).
 */
const getUserData = () => {
  const history = truncate(props.history, props.dayCount)
  let result

  if (percentages.value) {
    const purchasePrice = history[0].value
    result = history.map(entry => (entry.value - purchasePrice) / purchasePrice)
  } else {
    result = history.map(entry => entry.value)
  }

  return result
}

/**
 * Returns a data set for a benchmark, suitable for passing directly into the chart component.
 */
const createBenchmarkDataset = ticker => {
  const color = benchmarkData.find(e => ticker === e.ticker).color
  return {
    backgroundColor: `${color}90`,
    borderColor: color,
    data: getBenchmarkData(ticker),
    ticker,
    label: store.displayName(ticker),
    fill: doFill.value,
    lineTension: 0.4,
  }
}

/**
 * Generates all data (user data + benchmarks) for this chart to display.
 */
const createAllDatasets = () => {
  const datasets = [
    {
      backgroundColor: '#3e6ecf90',
      borderColor: '#3e6ecf',
      data: getUserData(),
      label: 'Your Picks',
      fill: doFill.value,
      lineTension: 0.4,
    },
  ]

  props.comparisons.forEach(ticker => datasets.push(createBenchmarkDataset(ticker)))

  return datasets
}

const updateYAxis = () => {
  chart.value.options.scales.y.ticks.callback = percentages.value
    ? percentageYAxisLabelCallback
    : currencyYAxisLabelCallback
}

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
  return truncate(props.history, props.dayCount).map(entry => {
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

/**
 * Updates the set of benchmark data sets displayed to reflect the
 * specified comparisons. Used when a benchmark is added or removed.
 */
const updateBenchmarkDatasets = () => {
  // Add new benchmarks, and update existing ones
  props.comparisons.forEach(ticker => {
    const index = chart.value.data.datasets.findIndex(dataset => dataset.ticker === ticker)
    if (index > -1) {
      chart.value.data.datasets[index].data = getBenchmarkData(ticker)
    } else {
      chart.value.data.datasets.push(createBenchmarkDataset(ticker))
    }
  })

  // Remove any benchmarks that are no longer in our comparisons array
  chart.value.data.datasets = chart.value.data.datasets
    .filter((dataset, index) => index === 0 || props.comparisons.indexOf(dataset.ticker) > -1)
}

const truncate = (history, dayCount) => {
  return dayCount <= 0 || history.length <= dayCount ? history : history.slice(history.length - dayCount)
}

/**
 * Toggles between "dollar view" and "percentage view".
 */
const updateChartDataForNewDataType = () => {
  // Update portfolio
  const portfolioData = chart.value.data.datasets[0].data
  portfolioData.length = 0
  portfolioData.push.apply(portfolioData, getUserData())

  // Update benchmark data
  chart.value.data.datasets.forEach((dataset, index) => {
    if (index > 0) { // Skip user's portfolio data
      dataset.data = getBenchmarkData(dataset.ticker)
    }
  })

  // Refresh the chart to show the changes
  updateYAxis()
  armedX.value = armedY.value = 0
  chart.value.update()
}

const chartTypeRef = toRef(props, 'chartType')
watch(chartTypeRef, () => {
  chart.value.data.datasets.forEach(dataset => dataset.fill = doFill.value)
  chart.value.update()
})

const dataTypeRef = toRef(props, 'dataType')
watch(dataTypeRef, newVal => {
  percentages.value = newVal === 'percent'
  if (chart.value) {
    updateChartDataForNewDataType()
  }
},
{
  immediate: true, // Force handler to run with initial value
})
const dayCountRef = toRef(props, 'dayCount')
watch(dayCountRef, () => {
  chart.value.data.labels = generateLabels()
  updateChartDataForNewDataType()
})

const comparisonsRef = toRef(props, 'comparisons')
watch(comparisonsRef, () => {
  updateBenchmarkDatasets()
  chart.value.update()
})

// We must watch for route updates since our chart isn't bound
// to data and won't know to rerender when switching between
// users' pages
watch(route, () => {
  // Since chart styles & benchmarks are user-dependent, we'll
  // just start from scratch
  chart.value.data.datasets = createAllDatasets()
  chart.value.update()
})

onMounted(() => {
  chart.value = new Chart(canvas.value, {
    type: 'line',
    data: {
      labels: generateLabels(),
      datasets: createAllDatasets(),
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
            // y.value = position.top + tooltip.caretY + 'px'
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
            callback: percentages.value
              ? percentageYAxisLabelCallback
              : currencyYAxisLabelCallback,
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

const doFill = computed(() => props.chartType === 'area')
</script>

<style scoped>
.stocky-chart-parent {
  position: relative; /* To allow tool tip to position: absolute relative to it */
}
</style>
