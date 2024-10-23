// 重构时需要参考的文件:
// - scripts/interaction/GameManager.js
// - scripts/interaction/GlobalState.js

import { loadSave, saveGame, clearSave } from '@/utils/saveLoad'
import GameManager from '@/utils/gameManager'
import Moderator from '@/utils/moderator'
import StreamHandler from '@/utils/streamHandler'

const state = {
  currentSectionId: null,
  completedSections: [],
  unlockedSections: [],
  globalInfluencePoints: [],
  storyTitle: '',
  storyContent: '',
  gameManager: null,
  suggestions: [],
  isLoading: false,
  moderator: null,
  conversationHistory: [],
  streamHandler: new StreamHandler(),
  streamingContent: ''
}

const mutations = {
  SET_CURRENT_SECTION(state, sectionId) {
    state.currentSectionId = sectionId
  },
  SET_COMPLETED_SECTIONS(state, sections) {
    state.completedSections = sections
  },
  SET_UNLOCKED_SECTIONS(state, sections) {
    state.unlockedSections = sections
  },
  SET_GLOBAL_INFLUENCE_POINTS(state, points) {
    state.globalInfluencePoints = points
  },
  SET_STORY_TITLE(state, title) {
    state.storyTitle = title
  },
  SET_STORY_CONTENT(state, content) {
    state.storyContent = content
  },
  SET_GAME_MANAGER(state, gameManager) {
    state.gameManager = gameManager
  },
  SET_SUGGESTIONS(state, suggestions) {
    state.suggestions = suggestions
  },
  SET_LOADING(state, isLoading) {
    state.isLoading = isLoading
  },
  SET_MODERATOR(state, moderator) {
    state.moderator = moderator
  },
  ADD_TO_CONVERSATION_HISTORY(state, message) {
    state.conversationHistory.push(message)
  },
  UPDATE_STREAMING_CONTENT(state, content) {
    state.streamingContent = content
  }
}

const actions = {
  initializeGameState({ commit }) {
    const savedData = loadSave()
    if (savedData) {
      commit('SET_CURRENT_SECTION', savedData.currentSectionId)
      commit('SET_COMPLETED_SECTIONS', savedData.completedSections)
      commit('SET_UNLOCKED_SECTIONS', savedData.unlockedSections)
      commit('SET_GLOBAL_INFLUENCE_POINTS', savedData.globalInfluencePoints)
    } else {
      commit('SET_CURRENT_SECTION', null)
      commit('SET_COMPLETED_SECTIONS', [])
      commit('SET_UNLOCKED_SECTIONS', [1])
      commit('SET_GLOBAL_INFLUENCE_POINTS', [])
    }
  },
  newGame({ dispatch }) {
    clearSave()
    dispatch('initializeGameState')
  },
  continueGame({ dispatch }) {
    dispatch('initializeGameState')
  },
  updateGameState({ state, commit }, { sectionId, result }) {
    // 更新游戏状态的逻辑...
    saveGame({
      currentSectionId: sectionId,
      completedSections: state.completedSections,
      unlockedSections: state.unlockedSections,
      globalInfluencePoints: state.globalInfluencePoints
    })
  },
  initializeGameManager({ commit, state }, section) {
    const gameManager = new GameManager(state)
    commit('SET_GAME_MANAGER', gameManager)
    const moderator = new Moderator(
      section.startEvent,
      section.commonKnowledge,
      section.GMDetails,
      state.playerInfo,
      section.objective,
      section.endConditions
    )
    commit('SET_MODERATOR', moderator)
  },
  async processUserInput({ state, commit }, input) {
    if (!state.moderator) {
      throw new Error('Moderator not initialized')
    }
    const validationResult = await state.moderator.validateAction(input)
    if (!validationResult.isValid) {
      return {
        content: validationResult.reason,
        isValid: false,
        suggestions: validationResult.suggestion ? [validationResult.suggestion] : []
      }
    }
    // ... 处理有效输入的逻辑
    commit('ADD_TO_CONVERSATION_HISTORY', { role: 'user', content: input })
    // ... 其他处理逻辑
  },
  async initializeGame({ commit, dispatch }, section) {
    commit('SET_LOADING', true)
    try {
      await dispatch('initializeGameManager')
      await state.gameManager.initializeGame(section)
      commit('SET_STORY_TITLE', section.title)
      commit('SET_STORY_CONTENT', section.backgroundInfo)
    } finally {
      commit('SET_LOADING', false)
    }
  },
  async handleOutcome({ commit, dispatch }, { sectionId, summary, section, isReplay }) {
    // 实现handleOutcome逻辑...
  },
  async processStreamingResponse({ commit, state }, prompt) {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.VUE_APP_API_KEY}`
      },
      body: JSON.stringify({ 
        model: getModel(ModelType.BASIC),
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000,
        stream: true
      })
    };

    try {
      await state.streamHandler.fetchStream(
        process.env.VUE_APP_API_URL,
        options,
        (partialResponse) => {
          commit('UPDATE_STREAMING_CONTENT', partialResponse);
        }
      );
    } catch (error) {
      console.error('Error in streaming response:', error);
      throw error;
    }
  }
}

const getters = {
  hasSave: state => state.currentSectionId !== null,
  getLastRound: (state) => {
    const lastFiveMessages = state.conversationHistory.slice(-5)
    return lastFiveMessages.map(m => `${m.role}: ${m.content}`).join('\n')
  }
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
