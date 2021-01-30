import Vue from 'vue'
import App from './app.vue'
import router from './router'
import store from './store'
import vuetify from './plugins/vuetify'
import { currency, percentage } from './app-filters'
import './app.css'

Vue.config.productionTip = false

Vue.filter('currency', currency)
Vue.filter('percentage', percentage)

new Vue({
  router,
  store,
  vuetify,
  render: h => h(App)
}).$mount('#app')

// import carrow from '../data/carrow.json'
// import carrowHistory from '../data/portfolio-history-carrow.json'
// import robert from '../data/robert.json'
// import robertHistory from '../data/portfolio-history-robert.json'
// import tickerHistory from '../data/ticker-history.json'
import('./data/carrow.json').then(carrow => {
    import('./data/portfolio-history-carrow.json').then(carrowHistory => {
        import ('./data/robert.json').then(robert => {
            import ('./data/portfolio-history-robert.json').then(robertHistory => {
                import('./data/ticker-history.json').then(tickerHistory => {
                    store.replaceState({
                        loading: false,
                        carrow: {
                            ...carrow.default,
                            history: carrowHistory.default,
                        },
                        robert: {
                            ...robert.default,
                            history: robertHistory.default,
                        },
                        history: tickerHistory.default,
                    })
                })
            })
        })
    })
})
