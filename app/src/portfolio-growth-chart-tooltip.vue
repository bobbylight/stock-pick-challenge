<template>

  <div class="chart-tooltip-wrapper animated-tooltip" :style="positionStyle()">

    <div class="arrow-wrapper" v-if="onRightSide">
      <div class="chart-tooltip-arrow left-side"/>
    </div>

    <div class="portfolio-growth-chart-tooltip">

      <div class="chart-tooltip-main-content">

        <div class="chart-tooltip-title">{{title()}}</div>

        <table class="tooltip-table">
          <tr v-for="dataPoint of dataPoints()" :key="dataPoint.datasetIndex">
            <td>
              <span class="stocky-color-square" :style="getDataPointStyle(dataPoint)"></span>
              <span class="stocky-dataset-label">{{ datasets[dataPoint.datasetIndex].label }}:</span>
            </td>
            <td class="stocky-tooltip-value">
              {{ getValue(dataPoint) }}
            </td>
          </tr>
        </table>
      </div>
    </div>

    <div class="arrow-wrapper" v-if="!onRightSide">
      <div class="chart-tooltip-arrow right-side"/>
    </div>
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

  computed: {

    onRightSide() {
      return this.model ? this.model.caretX < this.canvasRect.width / 2 : true
    },
  },

  methods: {

    getDataPointStyle(dataPoint) {
      return {
        background: this.datasets[dataPoint.datasetIndex].borderColor,
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

      if (this.onRightSide) {
        this.lastX = this.model.caretX + 'px'
        return this.lastX
      }
      const tipWidth = this.$el.getBoundingClientRect().width
      this.lastX = (this.model.caretX - tipWidth) + 'px'
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
.chart-tooltip-wrapper {
  font-size: smaller;
  position: absolute;
  pointer-events: none;
  display: table;
}

.arrow-wrapper {
  display:table-cell;
  vertical-align: middle;
}
.chart-tooltip-arrow {
  background: #000000c0;
  width: 1rem;
  height: 1rem;
}
.chart-tooltip-arrow.left-side {
  clip-path: polygon(102% 10%, 102% 90%, 50% 50%); /* > 100% to avoid sub-pixel issues */
}
.chart-tooltip-arrow.right-side {
  clip-path: polygon(-3% 10%, -3% 90%, 50% 50%); /* > -2% to avoid sub-pixel issues */
}

.portfolio-growth-chart-tooltip {
  display:table-cell;
  background: #000000c0;
  color: white;
  padding: .5rem;
  border-radius: 4px;
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
  border: 1px solid #e0e0e0;
}

.stocky-dataset-label {
  margin-left: 3px;
  margin-right: .5rem; /* space between label and value */
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
