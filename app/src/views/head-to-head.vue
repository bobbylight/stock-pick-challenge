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
          subtitle="Overall portfolio performance this year."
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
              <date-range-selector v-model="dayCount" />
              <comparison-chart
                :user-infos="userInfos"
                :day-count="dayCount"
                :type="chartType"
                :data-type="chartDataType"
              />
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <v-row v-if="!loading">
      <v-col>
        <v-card
          class="user-card"
          :title="dailyChangeTitle"
          :subtitle="dailyChangeSubtitle"
        >
          <v-card-text>
            <div class="chart-wrapper">
              <daily-change-chart
                :user-infos="userInfos"
              />
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
    <v-row v-if="!loading">
      <v-col>
        <v-card
          class="user-card"
          title="Lead Tracker"
          :subtitle="leadSubtitle"
        >
          <template #append>
            <v-btn-toggle
              v-model="leadPerspective"
              mandatory
              density="compact"
              color="primary"
              variant="outlined"
            >
              <v-btn
                v-for="(user, index) in userInfos"
                :key="user.name"
                :value="index"
                size="small"
              >
                {{ user.name }}
              </v-btn>
            </v-btn-toggle>
          </template>
          <v-card-text>
            <div class="chart-wrapper">
              <lead-tracker-chart
                ref="leadTrackerRef"
                :user-infos="userInfos"
                :day-count="dayCount"
                :data-type="chartDataType"
                :perspective="leadPerspective"
              />
            </div>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useStore } from '@/store'
import ComparisonChart from '../comparison-chart.vue'
import DateRangeSelector from '@/date-range-selector.vue'
import DailyChangeChart from '../daily-change-chart.vue'
import LeadTrackerChart from '../lead-tracker-chart.vue'

const store = useStore()

const LATEST_PREFERENCES_VERSION = 1

const chartType = ref('line')
const chartDataType = ref('dollars')
const chartComparisons = ref([])
const { carrow, loading, robert } = storeToRefs(store)
const dayCount = ref(-1)
const leadTrackerRef = ref(null)
const leadPerspective = ref(0)

const dailyChangeTitle = computed(() => {
  const history = robert.value.history
  if (!history.length) return 'Daily Change'
  const date = new Date(`${history[history.length - 1].date}T16:00:00-05:00`)
  const formatted = date.toLocaleDateString('en', { dateStyle: 'medium' })
  return `Daily Change (${formatted})`
})

const dailyChangeSubtitle = computed(() => {
  const histories = userInfos.value.map(u => u.history)
  if (histories.some(h => h.length < 2)) return ''

  const changes = histories.map(h => {
    const prev = h[h.length - 2].value
    const curr = h[h.length - 1].value
    return (curr - prev) / prev
  })

  const djiHistory = store.history['^dji']?.history
  const marketChange = djiHistory?.length >= 2
    ? (djiHistory[djiHistory.length - 1].close - djiHistory[djiHistory.length - 2].close) / djiHistory[djiHistory.length - 2].close
    : 0

  const [name0, name1] = userInfos.value.map(u => u.name)

  if (changes[0] === changes[1]) {
    return `${name0} and ${name1} had the same gains today!`
  }

  const [winner, loser] = changes[0] > changes[1] ? [name0, name1] : [name1, name0]
  const winnerChange = Math.max(changes[0], changes[1])

  if (winnerChange > marketChange) {
    return `${winner} outperformed ${loser} today, and also beat the market.`
  }
  return `${winner} outperformed ${loser} today, but underperformed the market.`
})

const leadSubtitle = computed(() => {
  const lead = leadTrackerRef.value?.currentLead
  if (!lead) return ''
  if (lead.leader === 'Tied') return 'Currently tied!'
  const perspectiveName = userInfos.value[leadPerspective.value].name
  const verb = lead.leader === perspectiveName ? 'leads' : 'trails'
  return `${perspectiveName} currently ${verb} by ${lead.amount}.`
})

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
      leadPerspective.value = json.leadPerspective || 0
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
    leadPerspective: leadPerspective.value,
  }

  localStorage.setItem(key, JSON.stringify(value))
  console.log('Preferences updated!')
}

watch(leadPerspective, storePreferences)
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
