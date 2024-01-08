<template>
  <div
    class="chart-tooltip-wrapper animated-tooltip"
    :style="positionStyle()"
    ref="root"
  >
    <div
      class="arrow-wrapper"
      v-if="onRightSide"
    >
      <div class="chart-tooltip-arrow left-side" />
    </div>

    <div class="portfolio-growth-chart-tooltip">
      <div class="chart-tooltip-main-content">
        <div class="chart-tooltip-title">
          {{ title() }}
        </div>

        <table class="tooltip-table">
          <tr
            v-for="dataPoint of dataPoints()"
            :key="dataPoint.datasetIndex"
          >
            <td>
              <span
                class="stocky-color-square"
                :style="getDataPointStyle(dataPoint)"
              />
              <span class="stocky-dataset-label">{{ datasets[dataPoint.datasetIndex].label }}:</span>
            </td>
            <td class="stocky-tooltip-value">
              {{ getValue(dataPoint) }}
            </td>
          </tr>
        </table>
      </div>
    </div>

    <div
      class="arrow-wrapper"
      v-if="!onRightSide"
    >
      <div class="chart-tooltip-arrow right-side" />
    </div>
  </div>
</template>

<script setup>
import {computed, ref} from 'vue'
import { currency, percentage } from './app-filters'

const props = defineProps({
  model: {
    type: Object,
    required: true,
  },
  datasets: {
    type: Array,
    required: true,
  },
  percentages: Boolean,
  canvasRect: {
    type: Object,
    required: true,
  },
  visible: Boolean,
})

const lastTitle = ref('')
const lastDatasets = ref([])
const lastX = ref(undefined)
const lastY = ref(undefined)
const root = ref(null)

const onRightSide = computed(() => props.model ? props.model.caretX < props.canvasRect.width / 2 : true)

  const getDataPointStyle = (dataPoint) => {
    return {
      background: props.datasets[dataPoint.datasetIndex].borderColor,
    }
  }

  const getValue = (dataPoint) => {
    const valueFunc = props.percentages ? percentage : currency
    return valueFunc(dataPoint.raw)
  }

  const positionStyle = () => {
    return {
      top: y(),
      left: x(),
      opacity: props.visible ? '1' : '0',
    }
  }

  const x = () => {
    if (!props.visible) {
      return lastX.value
    }

    if (onRightSide.value) {
      lastX.value = props.model.caretX + 'px'
      return lastX.value
    }
    const tipWidth = root.value.getBoundingClientRect().width
    lastX.value = (props.model.caretX - tipWidth) + 'px'
    return lastX.value
  }

  const y = () => {
    if (!props.visible) {
      return lastY.value
    }

    const tipHeight = root.value.getBoundingClientRect().height
    lastY.value = (props.model.caretY - tipHeight / 2) + 'px'
    return lastY.value
  }

  const dataPoints = () => lastDatasets.value = props.visible ? props.model.dataPoints : lastDatasets.value

  const title = () => lastTitle.value = props.visible ? props.model.dataPoints[0].label : lastTitle.value
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
