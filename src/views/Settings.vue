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

<script>
import { mapState, mapActions } from 'vuex'

export default {
  name: 'SettingsView',
  data() {
    return {
      localSettings: {
        apiKey: '',
        apiUrl: '',
        advancedModel: '',
        basicModel: '',
        isPublicKey: false
      }
    }
  },
  computed: {
    ...mapState('settings', ['apiKey', 'apiUrl', 'advancedModel', 'basicModel', 'isPublicKey'])
  },
  methods: {
    ...mapActions('settings', ['loadSettings', 'saveSettings', 'getPublicKey', 'resetSettings']),
    async saveSettings() {
      await this.saveSettings(this.localSettings)
      this.$toast.success(this.$t('settings.savedMessage'))
    },
    async getPublicKey() {
      const success = await this.getPublicKey()
      if (success) {
        this.$toast.success(this.$t('settings.publicKeyFetched'))
        this.loadLocalSettings()
      } else {
        this.$toast.error(this.$t('settings.publicKeyFetchFailed'))
      }
    },
    async resetSettings() {
      await this.resetSettings()
      this.loadLocalSettings()
      this.$toast.info(this.$t('settings.resetMessage'))
    },
    showHelp() {
      this.$modal.show('settings-help', {
        title: this.$t('settings.helpTitle'),
        content: this.$t('settings.helpContent')
      })
    },
    loadLocalSettings() {
      this.localSettings = {
        apiKey: this.apiKey,
        apiUrl: this.apiUrl,
        advancedModel: this.advancedModel,
        basicModel: this.basicModel,
        isPublicKey: this.isPublicKey
      }
    }
  },
  created() {
    this.loadSettings()
    this.loadLocalSettings()
  }
}
</script>

