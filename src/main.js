// 重构时需要参考的文件:
// - scripts/startup.js (用于初始化逻辑)
// - scripts/settings.js (用于加载设置)
// - scripts/loadLanguage.js (用于加载语言文件)

import Vue from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import i18n from './plugins/i18n'
import ModalPlugin from './plugins/modal'
import { loadSettings } from '@/utils/settings'

Vue.use(ModalPlugin)

Vue.config.productionTip = false

async function initializeApp() {
  await loadSettings()
  
  new Vue({
    router,
    store,
    i18n,
    render: h => h(App)
  }).$mount('#app')
}

initializeApp()
