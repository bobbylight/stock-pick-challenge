import { createApp } from 'vue'
import App from './app.vue'
import { createPinia } from 'pinia'
import router from './router'
import vuetify from './plugins/vuetify'
import './app.css'
import { useStore } from './store'
import { installGlobalFilters } from './app-filters'
import Chart from 'chart.js/auto'

// Override chart.js fonts to match our app's CSS
Chart.defaults.font.family = "'Roboto', sans-serif"

const pinia = createPinia()
const app = createApp(App)
  .use(router)
  .use(pinia)
  .use(vuetify)

installGlobalFilters(app)
app.mount('#app')

useStore().setYear(2026)
