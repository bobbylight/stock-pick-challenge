<template>
  <div class="stocky-chart-parent">
    <canvas
      ref="canvas"
      width="640"
      height="200"
    />
  </div>
</template>

<script setup>
import { onMounted, ref, shallowRef, watch } from 'vue'
import { useTheme } from 'vuetify'
import Chart from 'chart.js/auto'
import { percentage } from './app-filters'
import { tickColor, gridColor } from './chart-animation'
import { useStore } from '@/store'

const vuetifyTheme = useTheme()
const store = useStore()

const props = defineProps({
  userInfos: {
    type: Array,
    required: true,
  },
})

const GREEN = '#10b981'
const RED = '#ef4444'

const chart = shallowRef(null)
const canvas = ref(null)

const computeLatestChange = userIndex => {
  const history = props.userInfos[userIndex].history
  if (history.length < 2) return 0
  const prev = history[history.length - 2].value
  const curr = history[history.length - 1].value
  return (curr - prev) / prev
}

const computeMarketChange = () => {
  const djiHistory = store.history['^dji']?.history
  if (!djiHistory || djiHistory.length < 2) return 0
  const prev = djiHistory[djiHistory.length - 2].close
  const curr = djiHistory[djiHistory.length - 1].close
  return (curr - prev) / prev
}

const barColor = value => value >= 0 ? GREEN : RED

const getLatestDate = () => {
  const history = props.userInfos[0].history
  if (!history.length) return ''
  const date = new Date(`${history[history.length - 1].date}T16:00:00-05:00`)
  return date.toLocaleDateString('en', { dateStyle: 'medium' })
}

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

onMounted(() => {
  const isDark = vuetifyTheme.global.name.value === 'dark'

  const allValues = [...props.userInfos.map((_, i) => computeLatestChange(i)), computeMarketChange()]
  const maxAbs = Math.max(...allValues.map(Math.abs)) * 1.1 // Small gap for longest bar

  chart.value = new Chart(canvas.value, {
    type: 'bar',
    data: {
      labels: [...props.userInfos.map(u => u.name), 'Market'],
      datasets: [{
        label: getLatestDate(),
        data: allValues,
        backgroundColor: allValues.map(v => `${barColor(v)}90`),
        borderColor: allValues.map(v => barColor(v)),
        borderWidth: 1,
      }],
    },
    options: {
      indexAxis: 'y',

      plugins: {
        legend: {
          display: false,
        },
        tooltip: {
          callbacks: {
            title: () => getLatestDate(),
            label: ctx => `${ctx.label}: ${percentage(ctx.raw)}`,
          },
        },
      },

      scales: {
        x: {
          min: -maxAbs,
          max: maxAbs,
          grid: {
            color: gridColor(isDark),
          },
          ticks: {
            color: tickColor(isDark),
            callback: value => percentage(value),
          },
        },
        y: {
          grid: {
            color: gridColor(isDark),
          },
          ticks: {
            color: tickColor(isDark),
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
