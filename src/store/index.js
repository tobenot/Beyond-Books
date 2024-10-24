// 重构时需要参考的文件:
// - scripts/interaction/GlobalState.js (用于全局状态管理)
// - scripts/settings.js (用于设置状态)
// - scripts/sections.js (用于章节状态)

import { createStore } from 'vuex'
import game from './modules/game'
import sections from './modules/sections'
import story from './modules/story'
import interaction from './modules/interaction'
import save from './modules/save'
import review from './modules/review'
import settings from '../utils/settings'

export default createStore({
  modules: {
    game,
    sections,
    story,
    interaction,
    save,
    review,
    settings
  }
})
