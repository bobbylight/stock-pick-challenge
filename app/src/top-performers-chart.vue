<template>
  <canvas
    ref="canvas"
  />
</template>

<script setup>
import { computed, onMounted, ref, shallowRef, watch } from 'vue'
import { useTheme } from 'vuetify'
import Chart from 'chart.js/auto'
import ChartDataLabels from 'chartjs-plugin-datalabels'
import { useStore } from './store'
import { tickColor, gridColor } from './chart-animation'

const store = useStore()
const vuetifyTheme = useTheme()

const props = defineProps({
  portfolioName: {
    type: String,
    required: true,
  },
})

const topPerformers = computed(() => {
  const positions = store[props.portfolioName].positions
  const results = []

  positions.forEach(position => {
    const ticker = position.ticker
    const tickerHistory = store.history[ticker]?.history
    if (!tickerHistory?.length) return

    const lastClose = tickerHistory[tickerHistory.length - 1].close
    let totalCost = 0
    let shares = 0
    position.contributions.forEach(c => {
      totalCost += c.price * c.count
      shares += c.count
    })

    const marketValue = shares * lastClose
    if (totalCost === 0) return

    const pctReturn = (marketValue - totalCost) / totalCost
    results.push({
      ticker,
      label: store.displayName(ticker),
      pctReturn,
    })
  })

  results.sort((a, b) => b.pctReturn - a.pctReturn)
  const top8 = results.slice(0, 8)

  return {
    labels: top8.map(r => r.label.toLocaleUpperCase()),
    values: top8.map(r => r.pctReturn * 100),
  }
})

const canvas = ref(null)
const chart = shallowRef(null)

onMounted(() => {
  const isDark = vuetifyTheme.global.name.value === 'dark'

  chart.value = new Chart(canvas.value, {
    type: 'bar',
    plugins: [ChartDataLabels],
    data: {
      labels: topPerformers.value.labels,
      datasets: [{
        data: topPerformers.value.values,
        backgroundColor: topPerformers.value.values.map(v => v >= 0 ? '#10b981' : '#ef4444'),
      }],
    },
    options: {
      aspectRatio: 1,
      indexAxis: 'y',
      plugins: {
        legend: { display: false },
        datalabels: {
          anchor: 'end',
          align: 'start',
          color: '#fff',
          font: { weight: 'bold' },
          formatter: value => `${value.toFixed(1)}%`,
        },
        tooltip: {
          callbacks: {
            label: ctx => `${ctx.raw.toFixed(1)}%`,
          },
          displayColors: false,
        },
      },
      scales: {
        x: {
          ticks: {
            color: tickColor(isDark),
            callback: value => `${value}%`,
          },
          grid: { color: gridColor(isDark) },
        },
        y: {
          ticks: { color: tickColor(isDark) },
          grid: { color: gridColor(isDark) },
        },
      },
    },
  })
})

watch(() => vuetifyTheme.global.name.value, () => {
  const isDark = vuetifyTheme.global.name.value === 'dark'
  const c = chart.value
  c.options.plugins.datalabels.color = '#fff'
  c.options.scales.x.ticks.color = tickColor(isDark)
  c.options.scales.x.grid.color = gridColor(isDark)
  c.options.scales.y.ticks.color = tickColor(isDark)
  c.options.scales.y.grid.color = gridColor(isDark)
  c.update()
})

watch(topPerformers, newData => {
  if (!chart.value) return
  chart.value.data.labels = newData.labels
  chart.value.data.datasets[0].data = newData.values
  chart.value.data.datasets[0].backgroundColor = newData.values.map(v => v >= 0 ? '#10b981' : '#ef4444')
  chart.value.update()
})
</script>
