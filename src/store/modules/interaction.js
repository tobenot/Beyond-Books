// 从 scripts/interaction/InteractionProcess.js 移动交互相关逻辑
const state = () => ({
  isProcessing: false
})

const mutations = {
  SET_PROCESSING(state, value) {
    state.isProcessing = value
  }
}

const actions = {
  async handleUserInput({ commit, dispatch, rootState }) {
    if (rootState.game.isSubmitting || rootState.game.isCooldown) return

    const userInput = rootState.game.userInput
    if (!userInput) return

    commit('game/ADD_CONVERSATION_HISTORY', { 
      role: 'user', 
      content: userInput 
    }, { root: true })

    await dispatch('game/processUserInput', userInput, { root: true })
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
