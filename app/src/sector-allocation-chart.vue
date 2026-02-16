<template>
  <canvas
    ref="canvas"
    width="640"
    height="480"
  />
</template>

<script setup>
import { computed, onMounted, ref, shallowRef, watch } from 'vue'
import { useTheme } from 'vuetify'
import Chart from 'chart.js/auto'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { useStore } from './store'
import { tickColor } from './chart-animation'

const store = useStore()
const vuetifyTheme = useTheme()

const props = defineProps({
  portfolioName: {
    type: String,
    required: true,
  },
})

const sectorColors = [
  '#8b5cf6', // violet
  '#3b82f6', // blue
  '#06b6d4', // cyan
  '#10b981', // emerald
  '#84cc16', // lime
  '#eab308', // yellow
  '#f97316', // orange
  '#ef4444', // red
  '#ec4899', // pink
  '#a855f7', // purple
  '#6366f1', // indigo
]

const sectorData = computed(() => {
  const positions = store[props.portfolioName].positions
  const sectorValues = {}

  positions.forEach(position => {
    const ticker = position.ticker
    const tickerHistory = store.history[ticker]?.history
    if (!tickerHistory?.length) return

    const lastClose = tickerHistory[tickerHistory.length - 1].close
    let shares = 0
    position.contributions.forEach(c => shares += c.count)
    const marketValue = shares * lastClose

    const info = store.sectorInfo(ticker)
    const sector = info?.sector || 'Unknown'
    sectorValues[sector] = (sectorValues[sector] || 0) + marketValue
  })

  const entries = Object.entries(sectorValues).sort((a, b) => b[1] - a[1])
  return {
    labels: entries.map(e => e[0]),
    values: entries.map(e => e[1]),
  }
})

const canvas = ref(null)
const chart = shallowRef(null)

onMounted(() => {
  const isDark = vuetifyTheme.global.name.value === 'dark'

  chart.value = new Chart(canvas.value, {
    type: 'pie',
    plugins: [ChartDataLabels],
    data: {
      labels: sectorData.value.labels,
      datasets: [{
        data: sectorData.value.values,
        backgroundColor: sectorColors.slice(0, sectorData.value.labels.length),
        hoverOffset: 20,
      }],
    },
    options: {
      plugins: {
        legend: {
          labels: {
            color: tickColor(isDark),
          },
        },
        tooltip: {
          filter: context => {
            const total = context.dataset.data.reduce((sum, val) => sum + val, 0)
            const pct = (context.parsed / total) * 100
            return pct < 5
          },
          callbacks: {
            label: context => {
              const total = context.dataset.data.reduce((sum, val) => sum + val, 0)
              const pct = ((context.parsed / total) * 100).toFixed(1)
              return ` ${context.label}: ${pct}%`
            },
          },
        },
        datalabels: {
          color: '#fff',
          font: {
            weight: 'bold',
            size: 12,
          },
          formatter: (value, context) => {
            const total = context.dataset.data.reduce((sum, val) => sum + val, 0)
            const pct = (value / total) * 100
            if (pct < 5) return ''
            const label = context.chart.data.labels[context.dataIndex].replace(/ /g, '\n')
            return `${label}\n${pct.toFixed(1)}%`
          },
          textAlign: 'center',
        },
      },
    },
  })
})

watch(() => vuetifyTheme.global.name.value, () => {
  const isDark = vuetifyTheme.global.name.value === 'dark'
  chart.value.options.plugins.legend.labels.color = tickColor(isDark)
  chart.value.update()
})

watch(sectorData, newData => {
  if (!chart.value) return
  chart.value.data.labels = newData.labels
  chart.value.data.datasets[0].data = newData.values
  chart.value.data.datasets[0].backgroundColor = sectorColors.slice(0, newData.labels.length)
  chart.value.update()
})
</script>
