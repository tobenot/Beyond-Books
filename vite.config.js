import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import DefineOptions from 'unplugin-vue-define-options/vite'
import { DEPLOY_CONFIG } from './src/config/deploy'

export default defineConfig({
  plugins: [
    vue(),
    DefineOptions()
  ],
  base: DEPLOY_CONFIG.BASE_PATH,
})
