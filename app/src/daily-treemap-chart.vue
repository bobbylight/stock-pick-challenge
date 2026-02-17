<template>
  <canvas
    ref="canvas"
  />
</template>

<script setup>
import { computed, onMounted, ref, shallowRef, watch } from 'vue'
import { useTheme } from 'vuetify'
import { Chart } from 'chart.js'
import { TreemapController, TreemapElement } from 'chartjs-chart-treemap'
import { useStore } from './store'
import { gridColor } from './chart-animation'

Chart.register(TreemapController, TreemapElement)

const LOGO_TOKEN = 'pk_BE48kXYQS7GkDayksxF6YA'
const logoCache = {}
const MIN_LOGO_CELL = 60

function getLogoImage(ticker, chart) {
  if (logoCache[ticker]) return logoCache[ticker]
  const img = new Image()
  img.crossOrigin = 'anonymous'
  // Note this is a publishable key
  img.src = `https://img.logo.dev/ticker/${ticker}?token=${LOGO_TOKEN}&size=64&format=png`
  img.onload = () => chart.draw()
  img.onerror = () => {
    logoCache[ticker] = null
  }
  logoCache[ticker] = img
  return img
}

const treemapLogoPlugin = {
  id: 'treemapLogos',
  afterDatasetsDraw: chart => {
    const ctx = chart.ctx
    const meta = chart.getDatasetMeta(0)
    const tree = chart.data.datasets[0]?.tree
    if (!tree?.length) return

    meta.data.forEach(element => {
      const data = element.$context?.raw?._data
      if (!data?.ticker) return

      const { x, y, width, height } = element
      const centerX = x + width / 2
      const centerY = y + height / 2
      const hasLogo = width >= MIN_LOGO_CELL && height >= MIN_LOGO_CELL
      const offsetFromCenter = 2

      // Draw logo above center (skip in dev mode to avoid API calls)
      if (hasLogo && !import.meta.env.DEV) {
        const img = getLogoImage(data.ticker, chart)
        if (img?.complete && img.naturalWidth) {
          const imgSize = Math.min(width, height) * 0.2
          const imgX = centerX - imgSize / 2
          const imgY = centerY - imgSize - offsetFromCenter
          const circleCX = imgX + imgSize / 2
          const circleCY = imgY + imgSize / 2
          const radius = imgSize / 2
          ctx.save()
          ctx.beginPath()
          ctx.arc(circleCX, circleCY, radius, 0, Math.PI * 2)
          ctx.closePath()
          ctx.clip()
          ctx.drawImage(img, imgX, imgY, imgSize, imgSize)
          ctx.restore()
        }
      }

      // Draw labels below center
      if (width < 40 || height < 30) return
      const sign = data.dailyChangePct >= 0 ? '+' : ''
      const tickerText = data.ticker.toLocaleUpperCase()
      const pctText = `${sign}${(data.dailyChangePct * 100).toFixed(2)}%`
      const totalTextHeight = 14 + 16 // ticker line + gap to pct line
      const textY = hasLogo ? centerY + offsetFromCenter : centerY - totalTextHeight / 2

      ctx.save()
      ctx.fillStyle = '#ffffff'
      ctx.font = 'bold 14px sans-serif'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'top'
      ctx.fillText(tickerText, centerX, textY)
      ctx.font = 'bold 12px sans-serif'
      ctx.fillText(pctText, centerX, textY + 16)
      ctx.restore()
    })
  },
}

const store = useStore()
const vuetifyTheme = useTheme()

const props = defineProps({
  portfolioName: {
    type: String,
    required: true,
  },
})

const treemapData = computed(() => {
  const positions = store[props.portfolioName].positions
  const results = []

  positions.forEach(position => {
    const ticker = position.ticker
    const tickerHistory = store.history[ticker]?.history
    if (!tickerHistory?.length) return

    const lastClose = tickerHistory[tickerHistory.length - 1].close
    let shares = 0
    position.contributions.forEach(c => {
      shares += c.count
    })

    const marketValue = shares * lastClose
    if (marketValue <= 0) return

    const dailyChangePct = store.dailyChange(ticker, true)

    results.push({
      ticker,
      displayName: store.displayName(ticker),
      marketValue,
      dailyChangePct,
    })
  })

  return results
})

function changePctToColor(pct) {
  const p = pct * 100
  if (p <= -2.5) return '#8C2B2D'
  if (p <= -1.5) return '#DF484C'
  if (p <= -0.5) return '#E48181'
  if (p <= 0.5) return '#BFBFBF'
  if (p <= 1.5) return '#60B17C'
  if (p <= 2.5) return '#418F53'
  return '#2A5F38'
}

const canvas = ref(null)
const chart = shallowRef(null)

onMounted(() => {
  const isDark = vuetifyTheme.global.name.value === 'dark'

  chart.value = new Chart(canvas.value, {
    type: 'treemap',
    plugins: [treemapLogoPlugin],
    data: {
      datasets: [{
        tree: treemapData.value,
        key: 'marketValue',
        backgroundColor: ctx => {
          if (!ctx.raw?._data) return '#9ca3af'
          return changePctToColor(ctx.raw._data.dailyChangePct)
        },
        borderColor: gridColor(isDark) || '#e5e7eb',
        borderWidth: 2,
        labels: {
          display: false,
        },
      }],
    },
    options: {
      responsive: true,
      maintainAspectRatio: true,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            title: ctx => {
              const data = ctx[0]?.raw?._data
              return data?.displayName?.toLocaleUpperCase() || ''
            },
            label: ctx => {
              const data = ctx.raw?._data
              if (!data) return ''
              const sign = data.dailyChangePct >= 0 ? '+' : ''
              const changeLine = `Change: ${sign}${(data.dailyChangePct * 100).toFixed(2)}%`
              const valueLine = `Value: $${data.marketValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
              return [changeLine, valueLine]
            },
          },
          displayColors: false,
        },
      },
    },
  })
})

watch(() => vuetifyTheme.global.name.value, () => {
  const isDark = vuetifyTheme.global.name.value === 'dark'
  const c = chart.value
  if (!c) return
  c.data.datasets[0].borderColor = gridColor(isDark) || '#e5e7eb'
  c.update()
})

watch(treemapData, newData => {
  if (!chart.value) return
  chart.value.data.datasets[0].tree = newData
  chart.value.update()
})
</script>
