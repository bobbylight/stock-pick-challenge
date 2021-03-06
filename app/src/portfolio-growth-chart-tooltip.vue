<template>
  <div class="portfolio-growth-chart-tooltip animated-tooltip" :style="positionStyle()">

    <div class="chart-tooltip-title">{{title()}}</div>

    <table class="tooltip-table">
      <tr v-for="dataPoint of dataPoints()" :key="dataPoint.datasetIndex">
        <td>
          <span class="stocky-color-square" :style="getDataPointStyle(dataPoint)"></span>
          {{ datasets[dataPoint.datasetIndex].label }}:
        </td>
        <td class="stocky-tooltip-value">
          {{ getValue(dataPoint) }}
        </td>
      </tr>
    </table>
  </div>
</template>

<script>
import { currency, percentage } from './app-filters'

export default {

  props: {
    model: Object,
    datasets: Array,
    percentages: Boolean,
    canvasRect: Object,
    visible: Boolean,
  },

  data() {
    return {
      lastTitle: '',
      lastDatasets: [],
      lastX: undefined,
      lastY: undefined,
    }
  },

  methods: {

    getDataPointStyle(dataPoint) {
      return {
        background: this.datasets[dataPoint.datasetIndex].borderColor
      }
    },

    getValue(dataPoint) {
      const valueFunc = this.percentages ? percentage : currency
      return valueFunc(dataPoint.yLabel)
    },

    positionStyle() {
      return {
        top: this.y(),
        left: this.x(),
        opacity: this.visible ? '1' : '0',
      }
    },

    x() {

      if (!this.visible) {
        return this.lastX
      }

      const onRight = this.model.caretX < this.canvasRect.width / 2
      if (onRight) {
        this.lastX = this.model.caretX + 20 + 'px'
        return this.lastX
      }
      const tipWidth = this.$el.getBoundingClientRect().width
      this.lastX = (this.model.caretX - tipWidth - 20) + 'px'
      return this.lastX
    },

    y() {
      if (!this.visible) {
        return this.lastY
      }

      const tipHeight = this.$el.getBoundingClientRect().height
      this.lastY = (this.model.caretY - tipHeight / 2) + 'px'
      return this.lastY
    },

    dataPoints() {
      return this.lastDatasets = this.visible ? this.model.dataPoints : this.lastDatasets
    },

    title() {
      return this.lastTitle = this.visible ? this.model.dataPoints[0].label : this.lastTitle
    },
  },
}
</script>


<style scoped>
.portfolio-growth-chart-tooltip {
  background: #000000c0;
  color: white;
  font-size: smaller;
  position: absolute;
  padding: .5rem;
  border-radius: 4px;
  pointer-events: none;
}

.animated-tooltip {
  transition: opacity .25s ease-in-out, left .1s ease-in-out, top .1s ease-in-out;
}

.chart-tooltip-title {
  font-weight: bold;
  margin-bottom: 0.5rem;
}

.stocky-color-square {
  width: 1rem;
  height: 1rem;
  display: inline-block;
  vertical-align: text-bottom;
  border: 1px solid white;
}

.stocky-tooltip-value {
  text-align: end;
}

.tooltip-table {
  border-collapse: separate;
  border-spacing: 0;
  line-height: 1.1rem;
}
</style>
