const state = () => ({
  content: ''
})

const mutations = {
  SET_CONTENT(state, content) {
    state.content = content
  },
  APPEND_CONTENT(state, content) {
    state.content += content
  }
}

export default {
  namespaced: true,
  state,
  mutations
}
