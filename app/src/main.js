import { createApp } from 'vue'
import App from './app.vue'
import { createPinia } from 'pinia'
import router from './router'
import vuetify from './plugins/vuetify'
import './app.css'
import { useStore } from './store'
import { installGlobalFilters } from './app-filters'

const pinia = createPinia()
const app = createApp(App)
  .use(router)
  .use(pinia)
  .use(vuetify)

installGlobalFilters(app)
app.mount('#app')

useStore().setYear(2025)
