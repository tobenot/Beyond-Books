import { loadSectionData, loadSectionsIndex } from '@/utils/sectionLoader'
import { imageLoader } from '@/utils/imageLoader'

const state = () => ({
  chapters: [],
  unlockedSections: [],
  completedSections: [],
  currentSection: null
})

const mutations = {
  SET_CHAPTERS(state, chapters) {
    state.chapters = chapters
  },
  SET_UNLOCKED_SECTIONS(state, sections) {
    state.unlockedSections = sections
  },
  SET_COMPLETED_SECTIONS(state, sections) {
    state.completedSections = sections
  },
  SET_CURRENT_SECTION(state, section) {
    state.currentSection = section
  }
}

const actions = {
  async loadSectionsIndex({ commit, dispatch, rootGetters }) {
    try {
      console.log('开始加载章节索引...')
      const sectionsIndex = await loadSectionsIndex()
      console.log('章节索引加载成功:', sectionsIndex)
      commit('SET_CHAPTERS', sectionsIndex.chapters)
      
      // 检查是否有存档，如果没有则解锁第一个章节
      const saveData = rootGetters['save/saveData']
      if (!saveData.unlockedSections || saveData.unlockedSections.length === 0) {
        dispatch('unlockSection', 1)
      }
    } catch (error) {
      console.error('加载章节索引失败:', error)
      throw error
    }
  },
  async loadSection({ commit }, fileName) {  // 移除 dispatch
    const sectionData = await loadSectionData(fileName)
    
    // 预加载当前章节的图片
    if (sectionData.image) {
      await imageLoader.preloadImage(sectionData.image)
    }
    
    commit('SET_CURRENT_SECTION', sectionData)
  },
  unlockSection({ commit, state }, sectionId) {
    const newUnlockedSections = [...state.unlockedSections, sectionId]
    commit('SET_UNLOCKED_SECTIONS', newUnlockedSections)
  },
  completeSection({ commit, state }, sectionId) {
    const newCompletedSections = [...state.completedSections, sectionId]
    commit('SET_COMPLETED_SECTIONS', newCompletedSections)
  },
  async skipSection({ dispatch }, fileName) {
    const sectionData = await loadSectionData(fileName)
    // 这里可能需要一些逻辑来处理跳过章节的影响
    // 例如,更新游戏状态,解锁下一个章节等
    dispatch('completeSection', sectionData.id)
    dispatch('unlockSection', sectionData.id + 1) // 假设下一个章节的id是当前id+1
  },
  async preloadSectionImages({ state }) {
    const imageUrls = []
    
    state.chapters.forEach(chapter => {
      chapter.sections.forEach(section => {
        if (section.image) {
          imageUrls.push(section.image)
        }
      })
    })

    await imageLoader.preloadBatch(imageUrls)
  }
}

const getters = {
  isSectionUnlocked: (state) => (sectionId) => {
    return state.unlockedSections.includes(sectionId)
  },
  isSectionCompleted: (state) => (sectionId) => {
    return state.completedSections.includes(sectionId)
  },
  getCurrentSection: (state) => state.currentSection
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
