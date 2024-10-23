// 重构时需要参考的文件:
// - scripts/startup.js (用于初始化逻辑)
// - scripts/settings.js (用于加载设置)
// - scripts/loadLanguage.js (用于加载语言文件)

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import store from './store'
import i18n from './plugins/i18n'
import ModalPlugin from './plugins/modal'
import { loadSettings } from '@/utils/settings'
import './assets/styles/review.scss'
import Toast from './plugins/toast'
import { toastOptions } from './plugins/toast'

async function initializeApp() {
  try {
    await loadSettings()
    console.log('Settings loaded successfully')
    
    const app = createApp(App)
    
    app.config.errorHandler = (err, vm, info) => {
      console.error('Vue Error:', err)
      console.log('Component:', vm)
      console.log('Error Info:', info)
    }
    
    console.log('Vue app initialization starting...');
    
    console.log('Creating Vue app instance...');
    
    app.use(router)
    app.use(store)
    app.use(i18n)
    app.use(ModalPlugin)
    app.use(Toast, toastOptions)
    
    console.log('Adding plugins and router...');
    
    console.log('Mounting app...');
    app.mount('#app');
    
    console.log('App mounted!');
  } catch (error) {
    console.error('初始化失败:', error)
  }
}

initializeApp()
