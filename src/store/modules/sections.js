import { loadSectionData, loadSectionsIndex } from '@/utils/sectionLoader'
import { imageLoader } from '@/utils/imageLoader'
import { getBasePath } from '@/utils/pathManager'

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
      
      const saveData = rootGetters['save/saveData']
      if (!saveData || !saveData.unlockedSections || (saveData.unlockedSections && saveData.unlockedSections.length === 0)) {
        dispatch('unlockSection', 1)
      }
    } catch (error) {
      console.error('加载章节索引失败:', error)
      throw error
    }
  },
  async loadSection({ commit, dispatch }, fileName) {
    try {
      const sectionData = await loadSectionData(fileName)
      
      if (!sectionData) {
        throw new Error(`章节数据加载失败: ${fileName} 返回空数据`)
      }

      if (!sectionData.startEvent) {
        throw new Error(`章节数据格式错误: ${fileName} 缺少 startEvent 属性`)
      }
      
      // 更新图片路径
      if (sectionData.image) {
        console.log('加载图片:', sectionData.image)
        sectionData.image = `${getBasePath()}${sectionData.image}`
        await imageLoader.preloadImage(sectionData.image)
      }
      
      commit('SET_CURRENT_SECTION', sectionData)
      
      // 初始化游戏状态
      await dispatch('game/initializeGame', sectionData, { root: true })
      
      return sectionData
    } catch (error) {
      console.error('加载章节失败:', error)
      throw error
    }
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
    dispatch('completeSection', sectionData.id)
    dispatch('unlockSection', sectionData.id + 1)
  },
  async preloadSectionImages({ state }) {
    const imageUrls = []
    
    state.chapters.forEach(chapter => {
      chapter.sections.forEach(section => {
        if (section.image) {
          imageUrls.push(`${getBasePath()}${section.image}`)
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
