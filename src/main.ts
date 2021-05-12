import Vue from 'vue'
import vuetify from '@/plugins/vuetify'
import App from './App.vue'
import './registerServiceWorker'
import router from './router'
import store from './store'
import moment from 'vue-moment'

Vue.config.productionTip = false
Vue.use(moment);

new Vue({
  router,
  store,
  vuetify,
  render: h => h(App)
}).$mount('#app')
