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

const urls = [
    '/data/carrow.json',
    '/data/portfolio-history-carrow.json',
    '/data/robert.json',
    '/data/portfolio-history-robert.json',
    '/data/ticker-history.json',
]
Promise.all(urls.map(url => fetch(url).then(response => response.json())))
    .then(responses => {

        const carrow = responses[0]
        const carrowHistory = responses[1]
        const robert = responses[2]
        const robertHistory = responses[3]
        const tickerHistory = responses[4]

        store.replaceState({
            loading: false,
            carrow: {
                ...carrow,
                history: carrowHistory,
            },
            robert: {
                ...robert,
                history: robertHistory,
            },
            history: tickerHistory,
        })
    })
