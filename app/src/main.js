import { createApp } from 'vue'
import App from './app.vue'
import router from './router'
import store from './store'
import vuetify from './plugins/vuetify'
import './app.css'
import { installGlobalFilters } from './app-filters';

const app = createApp(App)
    .use(router)
    .use(store)
    .use(vuetify)

installGlobalFilters(app)
app.mount('#app')

store.dispatch('setYear', 2023);
