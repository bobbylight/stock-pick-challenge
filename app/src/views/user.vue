<template>
  <v-container>
    <v-row>
      <v-col
        cols="12"
        sm="6"
      >
        <v-card
          class="user-card"
          title="Summary"
        >
          <v-skeleton-loader
            v-if="loading"
            type="text@4"
          />
          <v-card-text v-if="!loading && userData">
            <user-summary
              :portfolio-name="portfolioName"
              :user-data="userData"
            />
          </v-card-text>
        </v-card>
      </v-col>

      <v-col
        cols="12"
        sm="6"
      >
        <v-card
          class="user-card"
          title="Today's Changes"
        >
          <v-skeleton-loader
            v-if="loading"
            type="text@4"
          />
          <v-card-text v-if="!loading && userData">
            <todays-changes
              :portfolio-name="portfolioName"
              :user-data="userData"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <v-card
          class="user-card"
          title="Notable Movers"
        >
          <v-skeleton-loader
            v-if="loading"
            type="list-item-three-line"
          />
          <v-card-text
            v-if="!loading && userData"
          >
            <notable-movers
              :portfolio-name="portfolioName"
              :user-data="userData"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <v-card
          class="user-card"
          title="YTD Growth"
        >
          <template #append>
            <v-menu
              :close-on-content-click="false"
              offset-y
            >
              <template #activator="{ props }">
                <v-btn
                  flat
                  icon="mdi-settings"
                  v-bind="props"
                />
              </template>
              <v-card>
                <v-card-title>Options</v-card-title>
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
                        label="Show Investment Value"
                      />
                    </v-row>
                    <v-row>
                      <v-select
                        chips
                        v-model="chartComparisons"
                        :items="benchmarks"
                        color="primary"
                        label="Compare to..."
                        item-title="name"
                        item-value="ticker"
                        @update:model-value="storePreferences"
                        multiple
                      />
                    </v-row>
                  </v-container>
                </v-card-text>
              </v-card>
            </v-menu>
          </template>
          <v-card-text>
            <v-skeleton-loader
              ref="growthChartRef"
              v-if="loading || !growthChartInView"
              type="image"
            />
            <div
              class="chart-wrapper"
              v-if="!loading && growthChartInView && userData"
            >
              <date-range-selector v-model="dayCount" />
              <portfolio-growth-chart
                :history="userData.history"
                :chart-type="chartType"
                :data-type="chartDataType"
                :comparisons="chartComparisons"
                :day-count="dayCount"
              />
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <v-card
          class="user-card"
          title="Current Holdings"
        >
          <v-card-text class="pa-0">
            <v-skeleton-loader
              v-if="loading"
              type="table"
            />
            <lot-table
              class="d-none d-sm-flex"
              :portfolio-name="portfolioName"
              :user-data="userData"
              v-if="!loading && userData"
            />
            <lot-listing
              class="d-flex d-sm-none"
              :portfolio-name="portfolioName"
              :user-data="userData"
              v-if="!loading && userData"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col
        cols="12"
        md="6"
      >
        <v-card
          class="user-card"
          title="Sector Allocation"
        >
          <v-card-text>
            <v-skeleton-loader
              ref="sectorChartRef"
              v-if="loading || !sectorChartInView"
              type="image"
            />
            <sector-allocation-chart
              v-if="!loading && sectorChartInView && userData"
              :portfolio-name="portfolioName"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { computed, onBeforeMount, ref } from 'vue'
import { useRoute } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useStore } from '@/store'
import { useInView } from '@/composables/useInView'
import LotListing from '@/lot-listing.vue'
import LotTable from '@/lot-table.vue'
import PortfolioGrowthChart from '@/portfolio-growth-chart.vue'
import UserSummary from '@/user-summary.vue'
import TodaysChanges from '@/todays-changes.vue'
import benchmarkData from '@/benchmark-data'
import NotableMovers from '@/notable-movers.vue'
import DateRangeSelector from '@/date-range-selector.vue'
import SectorAllocationChart from '@/sector-allocation-chart.vue'

const store = useStore()
const route = useRoute()

const LATEST_PREFERENCES_VERSION = 1

const chartType = ref('line')
const chartDataType = ref('dollars')
const chartComparisons = ref([])
const benchmarks = ref(benchmarkData)
const dayCount = ref(-1)
const { loading } = storeToRefs(store)

const { target: growthChartRef, isInView: growthChartInView } = useInView()
const { target: sectorChartRef, isInView: sectorChartInView } = useInView()

const portfolioName = computed(() => route.params.user)

const userData = computed(() => store[portfolioName.value])

onBeforeMount(() => loadPreferences())

const loadPreferences = () => {
  const key = `portfolio-${portfolioName.value}`
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
  const key = `portfolio-${portfolioName.value}`
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
