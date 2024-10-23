import CryptoJS from 'crypto-js'

const SETTINGS_KEY = 'settings'
const PUBLIC_KEY_FLAG = 'publicKey'
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
