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
                        @change="storePreferences"
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
              v-if="!$vuetify.display.xs"
              :portfolio-name="portfolioName"
              :user-data="userData"
            />
            <lot-listing
              v-if="$vuetify.display.xs"
              :portfolio-name="portfolioName"
              :user-data="userData"
            />
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import LotListing from '@/lot-listing.vue'
import LotTable from '@/lot-table.vue'
import PortfolioGrowthChart from '@/portfolio-growth-chart.vue'
import UserSummary from '@/user-summary.vue'
import TodaysChanges from '@/todays-changes.vue'
import benchmarkData from '@/benchmark-data'
import NotableMovers from '@/notable-movers.vue'

const LATEST_PREFERENCES_VERSION = 1

export default {

  components: {
    NotableMovers,
    LotListing,
    LotTable,
    PortfolioGrowthChart,
    TodaysChanges,
    UserSummary,
  },

  data() {
    return {
      chartType: 'line',
      chartDataType: 'dollars',
      chartComparisons: [],
      benchmarks: benchmarkData,
    }
  },

  computed: {
    portfolio() {

      const portfolio = []

      this.userData.positions.forEach((position) => {

        let shareCount = 0
        position.contributions.forEach(share => shareCount += share.count)

        portfolio.push({
          ticker: position.ticker,
          shareCount,
        })
      })

      return portfolio
    },

    portfolioName() {
      return this.$route.params.user
    },

    userData() {
      return this.$store.state[this.portfolioName]
    },
  },

  beforeMount() {
    this.loadPreferences()
  },

  methods: {

    getLabelForBenchmark(ticker) {
      return this.$store.state.history[ticker].name || ticker
    },

    loadPreferences() {

      const key = `portfolio-${this.portfolioName}`
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

          this.chartType = json.chartType || 'line'
          this.chartDataType = json.chartDataType || 'dollars'
          this.chartComparisons = json.benchmarks || []
        } catch (e) {
          console.error('Error loading preferences', e)
          localStorage.removeItem(key)
        }
      }
    },

    storePreferences() {

      const key = `portfolio-${this.portfolioName}`
      const value = {
        v: LATEST_PREFERENCES_VERSION,
        chartType: this.chartType,
        chartDataType: this.chartDataType,
        benchmarks: this.chartComparisons,
      }

      localStorage.setItem(key, JSON.stringify(value))
      console.log('Preferences updated!')
    }
  }
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
