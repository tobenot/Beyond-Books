// 在文件顶部添加
import { defineOptions } from 'vue'

<template>
  <div class="settings-container">
    <h2>{{ $t('settings.title') }}</h2>
    <div class="settings-form">
      <label for="api-key">{{ $t('settings.apiKeyLabel') }}</label>
      <input 
        type="password" 
        id="api-key" 
        v-model="localSettings.apiKey" 
        :placeholder="$t('settings.apiKeyPlaceholder')"
        :disabled="localSettings.isPublicKey"
        autocomplete="off"
      >

      <label for="api-url">{{ $t('settings.apiUrlLabel') }}</label>
      <input 
        type="text" 
        id="api-url" 
        v-model="localSettings.apiUrl" 
        :placeholder="$t('settings.apiUrlPlaceholder')"
      >

      <label for="advanced-model">{{ $t('settings.advancedModelLabel') }}</label>
      <select id="advanced-model" v-model="localSettings.advancedModel">
        <option value="gpt-4o-mini">gpt-4o-mini</option>
      </select>

      <label for="basic-model">{{ $t('settings.basicModelLabel') }}</label>
      <select id="basic-model" v-model="localSettings.basicModel">
        <option value="gpt-4o-mini">gpt-4o-mini</option>
      </select>

      <div class="button-container">
        <button @click="saveSettings">{{ $t('settings.saveButton') }}</button>
        <button @click="getPublicKey">{{ $t('settings.publicKeyButton') }}</button>
        <button @click="resetSettings">{{ $t('settings.resetButton') }}</button>
        <button @click="showHelp">{{ $t('settings.helpButton') }}</button>
        <!-- 新增不保存退出按钮 -->
        <button @click="exitWithoutSaving">{{ $t('settings.exitButton') }}</button>
      </div>
      <!-- 显示消息 -->
      <div v-if="message" class="message">{{ message }}</div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, getCurrentInstance } from 'vue'
import { useStore } from 'vuex'

// 添加组件名称定义
defineOptions({
  name: 'SettingsView'
})

const store = useStore()
const { proxy } = getCurrentInstance()

const localSettings = ref({
  apiKey: '', // 仅在用户输入时更新
  apiUrl: '',
  advancedModel: '',
  basicModel: '',
  isPublicKey: false
})

// 添加消息状态
const message = ref('')

// 计算属性
const storeSettings = computed(() => ({
  apiKey: store.state.settings.apiKey,
  apiUrl: store.state.settings.apiUrl,
  advancedModel: store.state.settings.advancedModel,
  basicModel: store.state.settings.basicModel,
  isPublicKey: store.state.settings.isPublicKey
}))

// 方法
const loadLocalSettings = () => {
  localSettings.value = { ...storeSettings.value, apiKey: '' } // 不展示 apiKey
}

const saveSettings = async () => {
  const settingsToSave = { 
    ...localSettings.value, 
    apiKey: localSettings.value.apiKey || store.state.settings.apiKey // 确保 apiKey 不为空
  }
  // 移除 console.log
  await store.dispatch('settings/saveSettings', settingsToSave)
  message.value = proxy.$t('settings.savedMessage')
  proxy.$router.push({ name: 'Home' }) // 假设要跳转到 Home 页面
}

const getPublicKey = async () => {
  try {
    const fsuccess = await store.dispatch('settings/getPublicKey')
    if (fsuccess) {
      message.value = proxy.$t('settings.publicKeyFetched')
      loadLocalSettings()
    } else {
      throw new Error('Failed to fetch public key')
    }
  } catch (error) {
    console.error('Error fetching public key:', error)
    message.value = proxy.$t('settings.publicKeyFetchFailed')
  }
}

const resetSettings = async () => {
  await store.dispatch('settings/resetSettings')
  loadLocalSettings()
  message.value = proxy.$t('settings.resetMessage')
}

const showHelp = () => {
  proxy.$modal.show('settings-help', {
    title: proxy.$t('settings.helpTitle'),
    content: proxy.$t('settings.helpContent')
  })
}

const exitWithoutSaving = () => {
  proxy.$router.push({ name: 'Home' }) // 假设要跳转到 Home 页面
}

onMounted(() => {
  store.dispatch('settings/loadSettings')
  loadLocalSettings()
})
</script>

<style>
.message {
  margin-top: 10px;
  color: #4caf50; /* 绿色 */
}
</style>
