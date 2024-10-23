// 从 scripts/ui.js 移动 UI 相关逻辑
export default {
  namespaced: true,
  state: {
    currentView: 'menu'
  },
  mutations: {
    SET_CURRENT_VIEW(state, view) {
      state.currentView = view
    }
  },
  actions: {
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
}
