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
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useStore } from 'vuex'

// 添加组件名称定义
defineOptions({
  name: 'SettingsView'
})

const store = useStore()

const localSettings = ref({
  apiKey: '',
  apiUrl: '',
  advancedModel: '',
  basicModel: '',
  isPublicKey: false
})

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
  localSettings.value = { ...storeSettings.value }
}

const saveSettings = async () => {
  await store.dispatch('settings/saveSettings', localSettings.value)
  this.$toast.success(this.$t('settings.savedMessage'))
}

const getPublicKey = async () => {
  const success = await store.dispatch('settings/getPublicKey')
  if (success) {
    this.$toast.success(this.$t('settings.publicKeyFetched'))
    loadLocalSettings()
  } else {
    this.$toast.error(this.$t('settings.publicKeyFetchFailed'))
  }
}

const resetSettings = async () => {
  await store.dispatch('settings/resetSettings')
  loadLocalSettings()
  this.$toast.info(this.$t('settings.resetMessage'))
}

const showHelp = () => {
  this.$modal.show('settings-help', {
    title: this.$t('settings.helpTitle'),
    content: this.$t('settings.helpContent')
  })
}

onMounted(() => {
  store.dispatch('settings/loadSettings')
  loadLocalSettings()
})
</script>

