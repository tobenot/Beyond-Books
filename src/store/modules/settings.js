import { loadSettings, saveSettings, getDefaultSettings, fetchPublicKey } from '@/utils/settings'

export const ModelType = {
  ADVANCED: 'advanced',
  BASIC: 'basic'
};

export function getModel(modelType = ModelType.BASIC) {
  // 这里应该返回正确的模型名称，可能需要从 state 中获取
  return modelType === ModelType.ADVANCED ? 'gpt-4o-mini' : 'gpt-4o-mini';
}

const state = {
  apiKey: '',
  apiUrl: 'https://api.deepbricks.ai/v1/',
  advancedModel: 'gpt-4o-mini',
  basicModel: 'gpt-4o-mini',
  isPublicKey: false
}

const mutations = {
  SET_SETTINGS(state, settings) {
    Object.assign(state, settings)
  },
  SET_API_KEY(state, apiKey) {
    state.apiKey = apiKey
  },
  SET_IS_PUBLIC_KEY(state, isPublicKey) {
    state.isPublicKey = isPublicKey
  }
}

const actions = {
  async loadSettings({ commit }) {
    const settings = await loadSettings()
    commit('SET_SETTINGS', settings)
  },
  async saveSettings({ state }) {
    await saveSettings(state)
  },
  async getPublicKey({ commit }) {
    try {
      const publicKey = await fetchPublicKey()
      commit('SET_API_KEY', publicKey)
      commit('SET_IS_PUBLIC_KEY', true)
      return true
    } catch (error) {
      console.error('获取公共key失败:', error)
      return false
    }
  },
  resetSettings({ commit }) {
    const defaultSettings = getDefaultSettings()
    commit('SET_SETTINGS', defaultSettings)
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
