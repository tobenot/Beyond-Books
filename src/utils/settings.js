import CryptoJS from 'crypto-js'
import { ModelMapping } from '@/constants/models'

const SETTINGS_KEY = 'settings'
const ENCRYPTION_KEY = 'YourEncryptionKey'

export const ModelType = {
  ADVANCED: 'advanced',
  BASIC: 'basic'
};

export function getModel(modelType = ModelType.BASIC) {
  const savedSettings = JSON.parse(localStorage.getItem('settings'))
  return savedSettings ? (savedSettings[modelType] || ModelMapping[modelType]) : ModelMapping[modelType]
}

const state = {
  apiKey: '',
  apiUrl: 'https://api.deepbricks.ai/v1/',
  advancedModel: 'gpt-4o-mini',
  basicModel: 'gpt-4o-mini',
  isPublicKey: false
}

const mutations = {
  setSettings(state, settings) {
    state.apiKey = settings.apiKey
    state.apiUrl = settings.apiUrl
    state.advancedModel = settings.advancedModel
    state.basicModel = settings.basicModel
    state.isPublicKey = settings.isPublicKey
  },
  SET_PUBLIC_KEY(state, publicKey) {
    // 更新 state.apiKey，但不在界面上展示
    state.apiKey = publicKey
    state.isPublicKey = true
  }
}

const actions = {
  async loadSettings({ commit }) {
    const settings = await loadSettings()
    commit('setSettings', settings)
  },
  async saveSettings({ commit }, settings) {
    await saveSettings(settings)
    commit('setSettings', settings)
  },
  async getPublicKey({ commit }) {
    try {
      const publicKey = await fetchPublicKey()
      if (!publicKey) {
        throw new Error('Invalid public key')
      }
      commit('SET_PUBLIC_KEY', publicKey) // 传递 publicKey
      console.log('Public key fetched successfully:', publicKey)
      return true
    } catch (error) {
      console.error('获取公钥失败:', error)
      return false
    }
  },
  async resetSettings({ dispatch }) {
    await saveSettings(getDefaultSettings())
    dispatch('loadSettings')
  }
}

export function loadSettings() {
  const savedSettings = localStorage.getItem(SETTINGS_KEY)
  return savedSettings ? JSON.parse(savedSettings) : getDefaultSettings()
}

function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

function getDefaultSettings() {
  return {
    apiKey: '',
    apiUrl: 'https://api.deepbricks.ai/v1/',
    advancedModel: 'gpt-4o-mini',
    basicModel: 'gpt-4o-mini',
    isPublicKey: false
  }
}

async function fetchPublicKey() {
  try {
    const response = await fetch('https://tobenot.top/storage/keyb.txt')
    if (!response.ok) {
      throw new Error('Network response was not ok')
    }
    const encryptedKey = await response.text()
    const decryptedKey = decrypt(encryptedKey, ENCRYPTION_KEY)
    if (!decryptedKey) {
      throw new Error('Decryption failed')
    }
    return decryptedKey
  } catch (error) {
    console.error('Error fetching or decrypting public key:', error)
    throw error
  }
}

function decrypt(data, key) {
  const bytes = CryptoJS.AES.decrypt(data, key)
  return bytes.toString(CryptoJS.enc.Utf8)
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
