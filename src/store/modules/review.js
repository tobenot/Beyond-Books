const state = {
  reviewRecords: []
}

const mutations = {
  SET_REVIEW_RECORDS(state, records) {
    state.reviewRecords = records
  },
  ADD_REVIEW_RECORD(state, record) {
    state.reviewRecords.push(record)
  },
  DELETE_REVIEW_RECORD(state, id) {
    state.reviewRecords = state.reviewRecords.filter(record => record.id !== id)
  },
  UPDATE_REVIEW_RECORD(state, updatedRecord) {
    const index = state.reviewRecords.findIndex(record => record.id === updatedRecord.id)
    if (index !== -1) {
      state.reviewRecords.splice(index, 1, updatedRecord)
    }
  }
}

const actions = {
  loadReviewRecords({ commit }) {
    const rawReviews = localStorage.getItem('reviewRecords')
    const reviews = rawReviews ? JSON.parse(rawReviews) : []
    commit('SET_REVIEW_RECORDS', reviews)
  },
  saveReviewRecord({ commit, state }, record) {
    commit('ADD_REVIEW_RECORD', record)
    localStorage.setItem('reviewRecords', JSON.stringify(state.reviewRecords))
  },
  deleteReviewRecord({ commit, state }, id) {
    commit('DELETE_REVIEW_RECORD', id)
    localStorage.setItem('reviewRecords', JSON.stringify(state.reviewRecords))
  },
  updateReviewRecord({ commit, state }, updatedRecord) {
    commit('UPDATE_REVIEW_RECORD', updatedRecord)
    localStorage.setItem('reviewRecords', JSON.stringify(state.reviewRecords))
  }
}

const getters = {
  getReviewRecords: state => state.reviewRecords
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
