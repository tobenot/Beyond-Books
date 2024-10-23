import CryptoJS from 'crypto-js'

const SAVE_KEY = "beyondBooksSaveData"
const EXPORT_SECRET_KEY = "YourExportSecretKey"
const REVIEW_KEY = "reviewRecords"

const state = () => ({
  hasSave: false,
  currentSectionId: null,
  completedSections: [],
  unlockedSections: [],
  globalInfluencePoints: [],
  gameData: null
})

const mutations = {
  SET_HAS_SAVE(state, value) {
    state.hasSave = value
  },
  SET_SAVE_DATA(state, data) {
    if (data) {
      state.currentSectionId = data.currentSectionId
      state.completedSections = data.completedSections
      state.unlockedSections = data.unlockedSections
      state.globalInfluencePoints = data.globalInfluencePoints
      state.hasSave = true
    } else {
      state.currentSectionId = null
      state.completedSections = []
      state.unlockedSections = [1]
      state.globalInfluencePoints = []
      state.hasSave = false
    }
  },
  SET_GAME_DATA(state, data) {
    state.gameData = data
  },
  CLEAR_SAVE(state) {
    state.gameData = null
  }
}

const actions = {
  loadSave({ commit }) {
    const rawData = localStorage.getItem(SAVE_KEY)
    const saveData = rawData ? JSON.parse(rawData) : null
    commit('SET_SAVE_DATA', saveData)
    return saveData
  },
  
  saveSave({ state }) {
    const saveData = {
      currentSectionId: state.currentSectionId,
      completedSections: state.completedSections,
      unlockedSections: state.unlockedSections,
      globalInfluencePoints: state.globalInfluencePoints
    }
    localStorage.setItem(SAVE_KEY, JSON.stringify(saveData))
  },
  
  clearSave({ commit }) {
    commit('CLEAR_SAVE')
    localStorage.removeItem(SAVE_KEY)
  },
  
  async exportSave({ state }) {
    const gameData = JSON.stringify({
      currentSectionId: state.currentSectionId,
      completedSections: state.completedSections,
      unlockedSections: state.unlockedSections,
      globalInfluencePoints: state.globalInfluencePoints
    })
    
    const reviewData = localStorage.getItem(REVIEW_KEY) || '{}'
    
    const combinedData = JSON.stringify({
      gameData: CryptoJS.AES.encrypt(gameData, EXPORT_SECRET_KEY).toString(),
      reviewData: CryptoJS.AES.encrypt(reviewData, EXPORT_SECRET_KEY).toString()
    })
    
    const blob = new Blob([combinedData], { type: 'application/octet-stream' })
    const url = URL.createObjectURL(blob)
    
    const now = new Date()
    const timestamp = now.toISOString().replace(/[:.]/g, '-').slice(0, 19)
    const filename = `BeyondBooks存档_${timestamp}.savegame`
    
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  },
  
  async importSave({ commit }, file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      
      reader.onload = async (e) => {
        try {
          const combinedData = JSON.parse(e.target.result)
          const gameData = JSON.parse(
            CryptoJS.AES.decrypt(combinedData.gameData, EXPORT_SECRET_KEY)
              .toString(CryptoJS.enc.Utf8)
          )
          const reviewData = JSON.parse(
            CryptoJS.AES.decrypt(combinedData.reviewData, EXPORT_SECRET_KEY)
              .toString(CryptoJS.enc.Utf8)
          )
          
          // 保存游戏数据
          localStorage.setItem(SAVE_KEY, JSON.stringify(gameData))
          commit('SET_SAVE_DATA', gameData)
          
          // 保存回顾数据
          localStorage.setItem(REVIEW_KEY, JSON.stringify(reviewData))
          
          resolve()
        } catch (error) {
          reject(new Error('导入失败，密钥不匹配或数据损坏'))
        }
      }
      
      reader.onerror = () => reject(new Error('读取文件失败'))
      reader.readAsText(file)
    })
  }
}

const getters = {
  saveData: state => ({
    currentSectionId: state.currentSectionId,
    completedSections: state.completedSections,
    unlockedSections: state.unlockedSections,
    globalInfluencePoints: state.globalInfluencePoints
  }),
  hasSave: (state) => !!state.gameData
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
