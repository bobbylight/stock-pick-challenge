<template>
  <v-container>
    <v-row>
      <v-col
        cols="12"
        sm="6"
      >
        <v-skeleton-loader
          v-if="$store.state.loading"
          elevation="2"
          type="article"
        />
        <v-card
          class="user-card"
          v-if="!$store.state.loading && userData"
        >
          <v-card-title>Summary</v-card-title>

          <v-card-text>
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
        <v-skeleton-loader
          v-if="$store.state.loading"
          elevation="2"
          type="article"
        />
        <v-card
          class="user-card"
          v-if="!$store.state.loading && userData"
        >
          <v-card-title>Today's Changes</v-card-title>

          <v-card-text>
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
        <v-skeleton-loader
          v-if="$store.state.loading"
          elevation="2"
          type="article"
        />
        <v-card
          class="user-card"
          v-if="!$store.state.loading && userData"
        >
          <v-card-title>Notable Movers</v-card-title>

          <v-card-text>
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
        <v-skeleton-loader
          v-if="$store.state.loading"
          elevation="2"
          type="article"
        />
        <v-card
          class="user-card"
          title="YTD Growth"
          v-if="!$store.state.loading && userData"
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
            <div class="chart-wrapper">
              <portfolio-growth-chart
                :history="userData.history"
                :chart-type="chartType"
                :data-type="chartDataType"
                :comparisons="chartComparisons"
              />
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>

    <v-row>
      <v-col>
        <v-skeleton-loader
          v-if="$store.state.loading"
          elevation="2"
          type="table"
        />
        <v-card
          class="user-card"
          v-if="!$store.state.loading && userData"
        >
          <v-card-title>Current Holdings</v-card-title>
          <v-card-text class="pa-0">
            <lot-table
              class="d-none d-sm-flex"
              :portfolio-name="portfolioName"
              :user-data="userData"
            />
            <lot-listing
              class="d-flex d-sm-none"
              :portfolio-name="portfolioName"
              :user-data="userData"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import {computed, onBeforeMount, ref} from 'vue'
import {useStore} from 'vuex'
import {useRoute} from 'vue-router'
import LotListing from '@/lot-listing.vue'
import LotTable from '@/lot-table.vue'
import PortfolioGrowthChart from '@/portfolio-growth-chart.vue'
import UserSummary from '@/user-summary.vue'
import TodaysChanges from '@/todays-changes.vue'
import benchmarkData from '@/benchmark-data'
import NotableMovers from '@/notable-movers.vue'

const store = useStore()
const route = useRoute()

const LATEST_PREFERENCES_VERSION = 1

const chartType = ref('line')
const chartDataType = ref('dollars')
const chartComparisons = ref([])
const benchmarks = ref(benchmarkData)

const portfolioName = computed(() => route.params.user)

const userData = computed(() => store.state[portfolioName.value])

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
