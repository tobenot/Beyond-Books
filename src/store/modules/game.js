// 重构时需要参考的文件:
// - scripts/interaction/GameManager.js
// - scripts/interaction/GlobalState.js

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
  streamingContent: '',
  showTutorial: false,
  tutorialContent: {
    title: '',
    content: ''
  }
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
  },
  SET_SHOW_TUTORIAL(state, show) {
    state.showTutorial = show
  },
  SET_TUTORIAL_CONTENT(state, content) {
    state.tutorialContent = content
  }
}

const actions = {
  initializeGameState({ commit, dispatch }) {
    // 使用 save 模块替代直接调用 loadSave
    const savedData = dispatch('save/loadSave', null, { root: true })
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
      await dispatch('showGameTutorial')
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
    }

    try {
      await state.streamHandler.fetchStream(
        process.env.VUE_APP_API_URL,
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
    const tutorialContent = {
      title: '游戏教程',
      content: `
        <p>你可以把本游戏理解为<strong>跑团（DND或COC）</strong>、<strong>语C</strong>、<strong>剧本杀</strong>或<strong>过家家</strong>🧑‍🤝‍🧑。本游戏制作时面向的玩家是<strong>喜欢剧情向游戏</strong>，愿意<strong>认真扮演角色</strong>🎭  的语C、跑团玩家👥。</p>
        <ol>
          <li>📝 <strong>目标</strong>：在每一个桥段里，你需要完成<strong>桥段目标</strong>🎯，目标可能是<strong>沟通</strong>💬、<strong>战斗</strong>⚔️、<strong>解密</strong>🧩等。</li>
          <li>🎮 <strong>操作</strong>：根据你的人设和起始事件，在对话框中打字输入以<strong>你的角色的角度</strong>进行的行动、说的话🗣️。比如输入"我挥起武器说，与我何干！"，不需要特别注意格式。</li>
          <li>💡 <strong>技巧</strong>：很多角色有<strong>超能力</strong>🔮，比如银月篇主角罗伯特，可以<strong>减缓时间流速</strong>🕰️，你可以接住敌方扔来的飞刀扔回去🗡️，也能准确地瞄准你要攻击的物件🎯，只要你能想到。</li>
        </ol>

        <ul>
          <li>⚠️ <strong>注意</strong>：如果出现输入之后无回复，可以回<strong>主菜单-设置</strong>⚙️里面点"<strong>恢复默认设置</strong>🔄"。一般是初始化的网络问题🌐。</li>
          <li>🔍 <strong>注意</strong>：高亮有颜色的文字可以点🔗。</li>
          <li>📜 <strong>注意</strong>：在<strong>桥段剧本</strong>之外，主持人给出的信息不完全保真（比如问队友问题，可能会得到不正确的回复🤔），可以完全取信的是非大模型的<strong>桥段剧本</strong>、<strong>初始事件</strong>、<strong>词条解释</strong>。</li>
        </ul>
      `
    }
    commit('SET_TUTORIAL_CONTENT', tutorialContent)
    commit('SET_SHOW_TUTORIAL', true)
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
