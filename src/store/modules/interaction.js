// 从 scripts/interaction/InteractionProcess.js 移动交互相关逻辑
const state = () => ({
  isProcessing: false,
  userInput: ''
})

const mutations = {
  SET_PROCESSING(state, value) {
    state.isProcessing = value
  },
  SET_USER_INPUT(state, value) {
    state.userInput = value
  }
}

const actions = {
  async handleUserInput({ commit, dispatch, rootState }, input) {
    if (rootState.game.isSubmitting || rootState.game.isCooldown) return
    
    commit('SET_PROCESSING', true)
    try {
      // 保存用户输入到游戏状态
      commit('game/SET_USER_INPUT', input, { root: true })
      
      // 添加用户消息到对话历史
      commit('game/ADD_CONVERSATION_HISTORY', { 
        role: 'user', 
        content: input 
      }, { root: true })

      // 处理用户输入
      await dispatch('game/processUserInput', input, { root: true })
      
      // 清空输入
      commit('game/SET_USER_INPUT', '', { root: true })
      
    } catch (error) {
      console.error('处理用户输入时出错:', error)
    } finally {
      commit('SET_PROCESSING', false)
    }
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
