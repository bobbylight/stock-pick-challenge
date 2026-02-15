const delayBetweenPoints = 16

export const tickColor = isDark => isDark ? '#cbd5e1' : undefined
export const gridColor = isDark => isDark ? '#334155' : undefined

export const progressiveLineAnimation = {
  x: {
    type: 'number',
    easing: 'linear',
    duration: delayBetweenPoints,
    from: NaN, // point not drawn until its turn
    delay(ctx) {
      if (ctx.type !== 'data' || ctx.xStarted) {
        return 0
      }
      ctx.xStarted = true
      return ctx.index * delayBetweenPoints
    },
  },
  y: {
    type: 'number',
    easing: 'linear',
    duration: delayBetweenPoints,
    from: ctx => {
      const prevIndex = ctx.index - 1
      const dataset = ctx.chart.data.datasets[ctx.datasetIndex]
      return prevIndex >= 0 ? dataset.data[prevIndex] : ctx.chart.scales.y.getPixelForValue(dataset.data[0])
    },
    delay(ctx) {
      if (ctx.type !== 'data' || ctx.yStarted) {
        return 0
      }
      ctx.yStarted = true
      return ctx.index * delayBetweenPoints
    },
  },
}
