import Vue from 'vue'
import Vuex from 'vuex'

import carrow from '../data/carrow.json'
import carrowHistory from '../data/portfolio-history-carrow.json'
import robert from '../data/robert.json'
import robertHistory from '../data/portfolio-history-robert.json'
import tickerHistory from '../data/ticker-history.json'

const data = {
    carrow: {
        ...carrow,
        history: carrowHistory
    },
    robert: {
        ...robert,
        history: robertHistory
    },
    history: tickerHistory,
}

Vue.use(Vuex)

export default new Vuex.Store({
  state: data,
  mutations: {
  },
  actions: {
  },
  modules: {
  }
})
