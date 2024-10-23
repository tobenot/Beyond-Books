// 从 scripts/ui.js 移动 UI 相关逻辑
const state = () => ({
  currentView: 'menu'
})

const mutations = {
  SET_CURRENT_VIEW(state, view) {
    state.currentView = view
  }
}

const actions = {
  initializeUI({ commit }) {
    commit('SET_CURRENT_VIEW', 'menu')
  },
  showSettings({ commit }) {
    commit('SET_CURRENT_VIEW', 'settings')
  },
  hideSettings({ commit }) {
    commit('SET_CURRENT_VIEW', 'menu')
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
