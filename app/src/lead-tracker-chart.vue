<template>
  <div class="stocky-chart-parent">
    <canvas
      ref="canvas"
      width="640"
      height="480"
    />
    <portfolio-growth-chart-tooltip
      :model="tooltipModel"
      :datasets="tooltipDatasets"
      :percentages="percentages"
      :canvas-rect="canvasRect"
      :visible="visible"
    />
  </div>
</template>

<script setup>
import { computed, onMounted, ref, shallowRef, toRef, watch } from 'vue'
import { useDisplay, useTheme } from 'vuetify'
import Chart from 'chart.js/auto'
import { currency, percentage } from './app-filters'
import PortfolioGrowthChartTooltip from './portfolio-growth-chart-tooltip.vue'
import { progressiveLineAnimation, tickColor, gridColor } from './chart-animation'

const display = useDisplay()
const vuetifyTheme = useTheme()

const props = defineProps({
  userInfos: {
    type: Array,
    required: true,
  },
  dayCount: {
    type: Number,
    required: true,
  },
  dataType: {
    type: String,
    required: true,
  },
  perspective: {
    type: Number,
    default: 0,
  },
})

const GREEN = '#10b981'
const RED = '#ef4444'

const chart = shallowRef(null)
const tooltipModel = ref(null)
const tooltipDatasets = ref([])
const visible = ref(false)
const canvasRect = ref({ top: 0, left: 0, width: 0, height: 0 })
const canvas = ref(null)

const percentages = computed(() => props.dataType === 'percent')

const truncate = (history, dayCount) => {
  return dayCount <= 0 || history.length <= dayCount ? history : history.slice(history.length - dayCount)
}

const generateLabels = () => {
  return truncate(props.userInfos[0].history, props.dayCount).map(entry => {
    const date = new Date(`${entry.date}T16:00:00-05:00`)
    return date.toLocaleDateString('en', { dateStyle: 'medium' })
  })
}

const computeDelta = () => {
  const primaryIdx = props.perspective
  const secondaryIdx = props.perspective === 0 ? 1 : 0
  const primaryHistory = truncate(props.userInfos[primaryIdx].history, props.dayCount)
  const secondaryHistory = truncate(props.userInfos[secondaryIdx].history, props.dayCount)

  if (percentages.value) {
    const primaryStart = primaryHistory[0].value
    const secondaryStart = secondaryHistory[0].value
    return primaryHistory.map((entry, i) => {
      const primaryPct = (entry.value - primaryStart) / primaryStart
      const secondaryPct = (secondaryHistory[i].value - secondaryStart) / secondaryStart
      return primaryPct - secondaryPct
    })
  }

  return primaryHistory.map((entry, i) => entry.value - secondaryHistory[i].value)
}

const yAxisCallback = value => {
  if (percentages.value) {
    return percentage(value)
  }
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

const updateChartData = () => {
  const delta = computeDelta()
  chart.value.data.labels = generateLabels()
  chart.value.data.datasets[0].data = delta
  chart.value.data.datasets[1].data = delta
  chart.value.options.scales.y.ticks.callback = yAxisCallback
  chart.value.update()
}

watch(toRef(props, 'dataType'), updateChartData)
watch(toRef(props, 'dayCount'), updateChartData)
watch(toRef(props, 'perspective'), updateChartData)

watch(() => vuetifyTheme.global.name.value, () => {
  const isDark = vuetifyTheme.global.name.value === 'dark'
  const tColor = tickColor(isDark)
  const gColor = gridColor(isDark)
  chart.value.options.scales.x.ticks.color = tColor
  chart.value.options.scales.y.ticks.color = tColor
  chart.value.options.scales.x.grid.color = gColor
  chart.value.options.scales.y.grid.color = gColor
  chart.value.update()
})

const currentLead = computed(() => {
  const primaryIdx = props.perspective
  const secondaryIdx = props.perspective === 0 ? 1 : 0
  const primaryHistory = truncate(props.userInfos[primaryIdx].history, props.dayCount)
  const secondaryHistory = truncate(props.userInfos[secondaryIdx].history, props.dayCount)
  if (!primaryHistory.length) return null
  const last = primaryHistory.length - 1
  const diff = primaryHistory[last].value - secondaryHistory[last].value
  if (diff === 0) return { leader: 'Tied', amount: '' }
  const leader = diff > 0 ? props.userInfos[primaryIdx].name : props.userInfos[secondaryIdx].name
  return { leader, amount: currency(Math.abs(diff)) }
})

defineExpose({ currentLead })

onMounted(() => {
  const delta = computeDelta()
  const isDark = vuetifyTheme.global.name.value === 'dark'

  // Plugin that creates a vertical gradient for the line color, transitioning from green
  // to red at the y=0 crossing point. Without this, the data curve can only change colors
  // at data points, not in between them.
  const zeroLineGradientPlugin = {
    id: 'zeroLineGradient',
    beforeDatasetsDraw(chart) {
      const yScale = chart.scales.y
      const { top, bottom } = chart.chartArea
      if (top >= bottom) return
      const zeroPixel = yScale.getPixelForValue(0)
      const ctx = chart.ctx
      const gradient = ctx.createLinearGradient(0, top, 0, bottom)

      if (zeroPixel <= top) {
        gradient.addColorStop(0, RED)
        gradient.addColorStop(1, RED)
      } else if (zeroPixel >= bottom) {
        gradient.addColorStop(0, GREEN)
        gradient.addColorStop(1, GREEN)
      } else {
        const zeroStop = (zeroPixel - top) / (bottom - top)
        gradient.addColorStop(0, GREEN)
        gradient.addColorStop(zeroStop, GREEN)
        gradient.addColorStop(zeroStop, RED)
        gradient.addColorStop(1, RED)
      }

      // Apply gradient directly to the line element
      const meta = chart.getDatasetMeta(0)
      if (meta.dataset) {
        meta.dataset.options.borderColor = gradient
      }
    },
  }

  chart.value = new Chart(canvas.value, {
    type: 'line',
    plugins: [zeroLineGradientPlugin],
    data: {
      labels: generateLabels(),
      datasets: [
        {
          label: 'Lead (green)',
          data: delta,
          borderColor: GREEN,
          backgroundColor: `${GREEN}40`,
          fill: { target: 'origin', above: `${GREEN}40`, below: 'transparent' },
          pointRadius: 0,
          pointHoverBackgroundColor: ctx => ctx.raw >= 0 ? GREEN : RED,
          pointHoverBorderColor: ctx => ctx.raw >= 0 ? GREEN : RED,
          lineTension: 0.4,
        },
        {
          label: 'Deficit (red)',
          data: delta,
          borderColor: RED,
          backgroundColor: `${RED}40`,
          fill: { target: 'origin', above: 'transparent', below: `${RED}40` },
          pointRadius: 0,
          borderWidth: 0,
          lineTension: 0.4,
        },
      ],
    },
    options: {
      animation: progressiveLineAnimation,

      interaction: {
        mode: 'index',
        intersect: false,
      },

      plugins: {
        legend: {
          display: false,
        },

        tooltip: {
          mode: 'index',
          intersect: false,
          enabled: false,
          external: function ({ chart: c, tooltip }) {
            if (tooltip.opacity === 0) {
              visible.value = false
              return
            }

            visible.value = true
            tooltipModel.value = tooltip
            const personAhead = tooltip.dataPoints[0].raw >= 0

            // Provide a single synthetic dataset for the tooltip display
            tooltipDatasets.value = [{
              label: `${props.userInfos[props.perspective].name} ${personAhead ? 'leading' : 'trailing'}`,
              borderColor: personAhead ? GREEN : RED,
            }]

            const position = c.canvas.getBoundingClientRect()
            canvasRect.value = {
              top: position.top,
              left: position.left,
              width: position.width,
              height: position.height,
            }
          },
          filter: item => item.datasetIndex === 0,
        },
      },

      scales: {
        x: {
          grid: {
            color: gridColor(isDark),
          },
          ticks: {
            color: tickColor(isDark),
            maxTicksLimit: 10,
            callback: function (index, value) {
              return this.getLabelForValue(value).replace('202', '2')
            },
          },
        },
        y: {
          grid: {
            color: gridColor(isDark),
          },
          ticks: {
            color: tickColor(isDark),
            callback: yAxisCallback,
          },
        },
      },
    },
  })
})
</script>

<style scoped>
.stocky-chart-parent {
  position: relative;
}
</style>
