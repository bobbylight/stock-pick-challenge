<template>
  <v-container>
    <v-row>
      <v-col>
        <v-skeleton-loader
          v-if="loading"
          elevation="2"
          type="article"
        />
        <v-card
          class="user-card"
          title="Head to Head!"
          v-if="!loading"
        >
          <template #append>
            <v-menu
              :close-on-content-click="false"
            >
              <template #activator="{ props }">
                <v-btn
                  flat
                  icon="mdi-settings"
                  v-bind="props"
                />
              </template>
              <v-card title="Options">
                <v-card-text>
                  <v-container>
                    <v-row>
                      <v-switch
                        v-model="chartType"
                        true-value="area"
                        false-value="line"
                        color="primary"
                        @change="storePreferences"
                        label="Area Chart"
                      />
                    </v-row>
                    <v-row>
                      <v-switch
                        v-model="chartDataType"
                        true-value="dollars"
                        false-value="percent"
                        color="primary"
                        @change="storePreferences"
                        label="Show Investment Growth"
                      />
                    </v-row>
                  </v-container>
                </v-card-text>
              </v-card>
            </v-menu>
          </template>
          <v-card-text>
            <div class="chart-wrapper">
              <comparison-chart
                :user-infos="userInfos"
                :type="chartType"
                :data-type="chartDataType"
              />
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { computed, onMounted, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useStore } from '@/store'
import ComparisonChart from '../comparison-chart.vue'

const store = useStore()

const LATEST_PREFERENCES_VERSION = 1

const chartType = ref('line')
const chartDataType = ref('dollars')
const chartComparisons = ref([])
const { carrow, loading, robert } = storeToRefs(store)

const userInfos = computed(() => {
  return [
    {
      name: 'Robert',
      history: robert.value.history,
    },
    {
      name: 'Carrow',
      history: carrow.value.history,
    },
  ]
})

onMounted(() => loadPreferences())

const loadPreferences = () => {
  const key = 'comparison-page'
  console.log('Loading preferences: ' + key)
  const temp = localStorage.getItem(key)

  if (temp) {
    try {
      const json = JSON.parse(temp)

      const version = json.v || 0
      if (version !== LATEST_PREFERENCES_VERSION) {
        localStorage.removeItem(key)
        return
      }

      chartType.value = json.chartType || 'line'
      chartDataType.value = json.chartDataType || 'dollars'
      chartComparisons.value = json.benchmarks || []
    } catch (e) {
      console.error('Error loading preferences', e)
      localStorage.removeItem(key)
    }
  }
}

const storePreferences = () => {
  const key = 'comparison-page'
  const value = {
    v: LATEST_PREFERENCES_VERSION,
    chartType: chartType.value,
    chartDataType: chartDataType.value,
    benchmarks: chartComparisons.value,
  }

  localStorage.setItem(key, JSON.stringify(value))
  console.log('Preferences updated!')
}
</script>

<style scoped>
.user-card {
  height: 100%;
}

.chart-wrapper {
  max-width: 800px;
  margin: 0 auto;
}
</style>
