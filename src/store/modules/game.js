// 重构时需要参考的文件:
// - scripts/interaction/GameManager.js
// - scripts/interaction/GlobalState.js

import GameManager from '@/utils/gameManager'
import Moderator from '@/utils/moderator'
import StreamHandler from '@/utils/streamHandler'
import { ModelType } from '@/constants/models'
import { getModel } from '@/utils/settings'
import i18n from '@/plugins/i18n'

const state = () => ({
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
  streamingContent: '',
  showTutorial: false,
  tutorialContent: {
    title: '',
    content: ''
  },
  isSubmitting: false,
  isCooldown: false,
  selectedCharacter: '罗伯特',
  currentSection: null,
  currentIsReplay: false,
  optimizedConversationHistory: [],
  turnCount: 0,
  plotTriggers: [],
  isGameInitialized: false,
  userInput: '',
  interactionStage: {
    stage: '',
    info: '',
    visible: false
  },
  apiKey: '',
  apiUrl: ''
})

const mutations = {
  SET_CURRENT_SECTION(state, section) {
    state.currentSection = section
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
  SET_GAME_MANAGER(state, manager) {
    state.gameManager = manager
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
  },
  SET_SHOW_TUTORIAL(state, show) {
    state.showTutorial = show
  },
  SET_TUTORIAL_CONTENT(state, content) {
    state.tutorialContent = content
  },
  SET_SUBMITTING(state, value) {
    state.isSubmitting = value
  },
  SET_COOLDOWN(state, value) {
    state.isCooldown = value
  },
  SET_SELECTED_CHARACTER(state, character) {
    state.selectedCharacter = character
  },
  SET_CURRENT_IS_REPLAY(state, value) {
    state.currentIsReplay = value
  },
  ADD_CONVERSATION_HISTORY(state, entry) {
    state.conversationHistory.push(entry)
  },
  ADD_OPTIMIZED_CONVERSATION_HISTORY(state, entry) {
    state.optimizedConversationHistory.push(entry)
  },
  INCREMENT_TURN_COUNT(state) {
    state.turnCount++
  },
  SET_PLOT_TRIGGERS(state, triggers) {
    state.plotTriggers = triggers
  },
  RESET_STATE(state) {
    state.isSubmitting = false
    state.isCooldown = false
    state.conversationHistory = []
    state.optimizedConversationHistory = []
    state.currentSection = null
    state.currentIsReplay = false
    state.turnCount = 0
    state.plotTriggers = []
  },
  SET_USER_INPUT(state, value) {
    state.userInput = value
  },
  SET_GAME_INITIALIZED(state, value) {
    state.isGameInitialized = value
  },
  SET_INTERACTION_STAGE(state, { stage, info }) {
    state.interactionStage = {
      stage,
      info,
      visible: true
    }
  },
  HIDE_INTERACTION_STAGE(state) {
    state.interactionStage.visible = false
  },
  SET_API_KEY(state, apiKey) {
    state.apiKey = apiKey
  },
  SET_API_URL(state, apiUrl) {
    state.apiUrl = apiUrl
  }
}

const actions = {
  initializeGameState({ commit, dispatch }) {
    const savedData = dispatch('save/loadSave', null, { root: true })
    if (savedData) {
      commit('SET_CURRENT_SECTION', savedData.currentSectionId)
      commit('SET_COMPLETED_SECTIONS', savedData.completedSections)
      commit('SET_UNLOCKED_SECTIONS', savedData.unlockedSections)
      commit('SET_GLOBAL_INFLUENCE_POINTS', savedData.globalInfluencePoints)
      // 从存档中加载 apiKey 和 apiUrl
      commit('SET_API_KEY', savedData.apiKey)
      commit('SET_API_URL', savedData.apiUrl)
    } else {
      commit('SET_CURRENT_SECTION', null)
      commit('SET_COMPLETED_SECTIONS', [])
      commit('SET_UNLOCKED_SECTIONS', [1])
      commit('SET_GLOBAL_INFLUENCE_POINTS', [])
    }
  },
  newGame({ dispatch }) {
    // 使用 save 模块替代直接调用 clearSave
    dispatch('save/clearSave', null, { root: true })
    dispatch('initializeGameState')
  },
  continueGame({ dispatch }) {
    dispatch('initializeGameState')
  },
  updateGameState({ state, dispatch }, { sectionId }) {
    // 使用 save 模块的 saveSave action
    dispatch('save/saveSave', {
      currentSectionId: sectionId,
      completedSections: state.completedSections,
      unlockedSections: state.unlockedSections,
      globalInfluencePoints: state.globalInfluencePoints
    }, { root: true })
  },
  async initializeGameManager({ commit, state, rootGetters }) {
    const section = rootGetters['sections/getCurrentSectionData']
    if (!section) {
      console.error('初始化游戏管理器时缺少section数据');
      return;
    }

    const gameManager = new GameManager(state, section)
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
    
    if (!state.gameManager) {
      console.error('GameManager 实例未创建');
      return;
    }
  },
  async processUserInput({ commit, state, dispatch }, userInput) {
    commit('SET_SUBMITTING', true)
    commit('SET_INTERACTION_STAGE', { 
      stage: '处理中',
      info: '正在分析你的行动...'
    })

    try {
      // 使用 GameManager 处理输入
      const result = await state.gameManager.processMainPlayerAction(userInput)
      
      if (result.isValid) {
        // 更新对话历史
        commit('ADD_OPTIMIZED_CONVERSATION_HISTORY', {
          role: 'assistant',
          content: result.finalResult
        })
        
        // 检查是否需要结束章节
        if (state.gameManager.moderator.endSectionFlag) {
          await dispatch('handleSectionEnd')
        }
      } else {
        // 添加反馈信息
        commit('ADD_TO_CONVERSATION_HISTORY', {
          role: 'system',
          content: result.feedback
        })
      }
    } catch (error) {
      console.error('处理用户输入时出错:', error)
      commit('ADD_TO_CONVERSATION_HISTORY', {
        role: 'system',
        content: '处理输入时发生错误，请重试。'
      })
    } finally {
      commit('SET_SUBMITTING', false)
      commit('HIDE_INTERACTION_STAGE')
      
      // 添加输入冷却
      commit('SET_COOLDOWN', true)
      setTimeout(() => {
        commit('SET_COOLDOWN', false)
      }, 1000)
    }
  },
  async initializeGame({ commit, dispatch, state, rootGetters }) {
    const section = rootGetters['sections/getCurrentSectionData']
    if (!section) {
      console.error('初始化游戏时缺少section数据');
      return;
    }
    
    commit('SET_LOADING', true)
    try {
      await dispatch('initializeGameManager')
      
      const gameManager = state.gameManager
      
      if (!gameManager) {
        throw new Error('GameManager 初始化失败')
      }
      
      await gameManager.setupGame()
      
      const initialContent = createInitialContent(section)
      commit('SET_STORY_CONTENT', initialContent)
      
      await dispatch('showGameTutorial')
      
      commit('SET_STORY_TITLE', section.title)
      
      const playerInfo = await dispatch('createPlayerInfo')
      commit('ADD_TO_CONVERSATION_HISTORY', {
        role: 'info',
        content: playerInfo
      })
      
      commit('ADD_TO_CONVERSATION_HISTORY', {
        role: 'assistant',
        content: section.startEvent
      })
      
    } finally {
      commit('SET_LOADING', false)
    }
  },
  async handleOutcome({ commit, dispatch }, { sectionId, summary, isReplay }) {
    try {
      if (summary.objective) {
        if (!isReplay) {
          await dispatch('updateGameState', {
            sectionId,
            result: {
              objectiveAchieved: summary.objective,
              influencePoints: summary.influencePoints
            }
          });
        }
        
        commit('ADD_TO_CONVERSATION_HISTORY', {
          role: 'system',
          content: `${summary.objective_judge}\n桥段目标完成`
        });

        if (!isReplay) {
          await dispatch('review/storeSectionReview', {
            sectionId,
            conversationHistory: state.conversationHistory,
            storyContent: document.getElementById('storyContent').innerHTML
          }, { root: true });
        }
      } else {
        commit('ADD_TO_CONVERSATION_HISTORY', {
          role: 'system', 
          content: `${summary.objective_judge}\n桥段目标未达成`
        });
      }
    } catch (error) {
      console.error('处理结果时出错:', error);
      throw error;
    }
  },
  async processStreamingResponse({ commit, state }, prompt) {
    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.apiKey}` // 使用 state 中的 apiKey
      },
      body: JSON.stringify({ 
        model: getModel(ModelType.BASIC),
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000,
        stream: true
      })
    }

    try {
      await state.streamHandler.fetchStream(
        state.apiUrl, // 使用 state 中的 apiUrl
        options,
        (partialResponse) => {
          commit('UPDATE_STREAMING_CONTENT', partialResponse)
        }
      )
    } catch (error) {
      console.error('Error in streaming response:', error)
      throw error
    }
  },
  showGameTutorial({ commit }) {
    commit('SET_TUTORIAL_CONTENT', {
      title: i18n.global.t('tutorial.title'),
      content: i18n.global.t('tutorial.content')
    })
    commit('SET_SHOW_TUTORIAL', true)
  },
  async handleUserInput({ commit, state, dispatch }) {
    if (state.isSubmitting || state.isCooldown) return

    const userInput = state.userInput
    if (!userInput) return

    commit('ADD_CONVERSATION_HISTORY', { role: 'user', content: userInput })
    dispatch('updateDisplay', { role: 'user', content: userInput })

    if (state.conversationHistory.length > 40) {
      await dispatch('endSection')
      return
    }

    await dispatch('processUserInput', userInput)
  },

  async callLargeLanguageModel({ state }, prompt) {
    const response = await fetch(state.apiUrl, { // 使用 state 中的 apiUrl
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${state.apiKey}`, // 使用 state 中的 apiKey
        'Accept': 'application/json'
      },
      body: JSON.stringify({ 
        model: getModel(ModelType.BASIC),
        messages: [{ role: "user", content: prompt }],
        max_tokens: 1000
      }),
      credentials: 'include'
    })

    const responseData = await response.json()
    return responseData.choices[0].message.content
  },
  updateInteractionStage({ commit }, { stage, info }) {
    commit('SET_INTERACTION_STAGE', { stage, info })
  },
  hideInteractionStage({ commit }) {
    commit('HIDE_INTERACTION_STAGE')
  },
  createPlayerInfo({ state, rootGetters }) {
    const section = rootGetters['sections/getCurrentSectionData']
    if (!section || !section.characters) {
      console.error('Section或characters未定义:', section)
      return ''
    }

    const playerCharacter = section.characters.find(char => !char.isAI)
    if (!playerCharacter) {
      console.warn('未找到玩家角色')
      return ''
    }

    let info = `<b>你的角色：</b>
    <b>${playerCharacter.name}</b>
    ${playerCharacter.description}`
    
    if (playerCharacter.characterTags && state.gameManager) {
      const characterTags = playerCharacter.characterTags.reduce((acc, tagKey) => {
        const tagValue = state.gameManager.getCharacterTag(tagKey)
        if (tagValue) {
          acc += `<br>- ${tagKey}: ${tagValue}`
        }
        return acc
      }, '')
      info += characterTags
    }
    
    return info
  },
  scrollToBottom() {
    // 使用事件总线或其他方式通知 StoryView 组件滚动
    const storyContentEl = document.querySelector('.text-container')
    if (storyContentEl) {
      setTimeout(() => {
        storyContentEl.scrollTop = storyContentEl.scrollHeight
      }, 100)
    }
  }
}

const getters = {
  hasSave: state => state.currentSectionId !== null,
  getLastRound: (state) => {
    const lastFiveMessages = state.conversationHistory.slice(-5)
    return lastFiveMessages.map(m => `${m.role}: ${m.content}`).join('\n')
  },
  isSubmitting: state => state.isSubmitting,
  isCooldown: state => state.isCooldown,
  selectedCharacter: state => state.selectedCharacter,
  currentSection: state => state.currentSection,
  conversationHistory: state => state.conversationHistory,
  optimizedConversationHistory: state => state.optimizedConversationHistory,
  gameManager: state => state.gameManager,
  turnCount: state => state.turnCount,
  plotTriggers: state => state.plotTriggers,
  isGameInitialized: state => state.isGameInitialized,
  interactionStage: state => state.interactionStage,
  storyContent: state => state.storyContent
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}

// 在 actions 外部添加辅助函数
function createInitialContent(section) {
  let content = `
    <h2>${section.title}</h2>
    <p><b>目标：${section.objective}</b></p>
    <p>${section.backgroundInfo}</p>
  `
  return content
}
