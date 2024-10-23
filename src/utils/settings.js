import CryptoJS from 'crypto-js'
import { ModelMapping } from '@/constants/models'

/* eslint-disable no-unused-vars */
const PUBLIC_KEY_FLAG = 'xxx';
/* eslint-enable no-unused-vars */

const SETTINGS_KEY = 'settings'
const ENCRYPTION_KEY = 'YourEncryptionKey'

export async function loadSettings() {
  const savedSettings = localStorage.getItem(SETTINGS_KEY)
  return savedSettings ? JSON.parse(savedSettings) : getDefaultSettings()
}

export async function saveSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
}

export function getDefaultSettings() {
  return {
    apiKey: '',
    apiUrl: 'https://api.deepbricks.ai/v1/',
    advancedModel: 'gpt-4o-mini',
    basicModel: 'gpt-4o-mini',
    isPublicKey: false
  }
}

export async function fetchPublicKey() {
  const response = await fetch('https://tobenot.top/storage/keyb.txt')
  const encryptedKey = await response.text()
  return decrypt(encryptedKey, ENCRYPTION_KEY)
}

function decrypt(data, key) {
  const bytes = CryptoJS.AES.decrypt(data, key)
  return bytes.toString(CryptoJS.enc.Utf8)
}

export function getModel(modelType) {
  const savedSettings = JSON.parse(localStorage.getItem('settings'))
  return savedSettings ? (savedSettings[modelType] || ModelMapping[modelType]) : ModelMapping[modelType]
}

export function isLocalDevelopment() {
  return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
}

export function getApiUrl() {
  const savedSettings = JSON.parse(localStorage.getItem('settings'))
  const DEV_API_URL = 'https://api.deepbricks.ai/v1/'
  return isLocalDevelopment() ? DEV_API_URL : (savedSettings ? savedSettings.apiUrl : 'https://api.deepbricks.ai/v1/')
}
