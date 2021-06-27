<template>

  <v-container>

    <v-row>
      <v-col>
        <v-skeleton-loader v-if="$store.state.loading" elevation="2" type="article"/>
        <v-card class="user-card" v-if="!$store.state.loading">

          <v-card-title>
            Head to Head!
            <v-spacer/>
            <v-menu
                :close-on-content-click="false"
                offset-y>
              <template v-slot:activator="{ on, attrs }">
                <v-btn icon v-bind="attrs" v-on="on">
                  <v-icon>mdi-settings</v-icon>
                </v-btn>
              </template>
              <v-card>
                <v-card-title>Options</v-card-title>
                <v-card-text>
                  <v-container>
                    <v-row>
                      <v-switch v-model="chartType" true-value="area" false-value="line"
                                @change="storePreferences"
                                label="Area Chart"/>
                    </v-row>
                    <v-row>
                      <v-switch v-model="chartDataType" true-value="dollars" false-value="percent"
                                @change="storePreferences"
                                label="Show Investment Growth"/>
                    </v-row>
                  </v-container>
                </v-card-text>
              </v-card>
            </v-menu>
          </v-card-title>
          <v-card-text>
            <div class="chart-wrapper">
              <comparison-chart :user-infos="userInfos"
                                :type="chartType"
                                :data-type="chartDataType"/>
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import ComparisonChart from "../comparison-chart"

const LATEST_PREFERENCES_VERSION = 1

export default {

  components: {
    ComparisonChart,
  },

  data() {
    return {
      chartType: 'line',
      chartDataType: 'dollars',
    }
  },

  computed: {
    
    userInfos() {
      return [
        {
          name: 'Robert',
          history: this.$store.state['robert'].history,
        },
        {
          name: 'Carrow',
          history: this.$store.state['carrow'].history,
        },
      ]
    },
  },

  mounted() {
    this.loadPreferences()
  },

  methods: {

    getLabelForBenchmark(ticker) {
      return this.$store.state.history[ticker].name || ticker
    },

    loadPreferences() {

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

      const key = 'comparison-page'
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
