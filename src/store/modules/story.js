const state = () => ({
  content: '',
  tooltipInfo: {
    show: false,
    description: '',
    imageUrl: '',
    term: '',
    event: null
  }
})

const mutations = {
  SET_CONTENT(state, content) {
    state.content = content
  },
  APPEND_CONTENT(state, content) {
    state.content += content
  },
  SET_TOOLTIP_INFO(state, info) {
    state.tooltipInfo = info
  }
}

const actions = {
  showTermTooltip({ commit }, { term, event, termConfig }) {
    commit('SET_TOOLTIP_INFO', {
      show: true,
      description: termConfig.description,
      imageUrl: termConfig.imageUrl,
      term: term,
      event: event
    })
  },
  hideTermTooltip({ commit }) {
    commit('SET_TOOLTIP_INFO', {
      show: false,
      description: '',
      imageUrl: '',
      term: '',
      event: null
    })
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions
}
