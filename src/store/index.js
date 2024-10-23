// 重构时需要参考的文件:
// - scripts/interaction/GlobalState.js (用于全局状态管理)
// - scripts/settings.js (用于设置状态)
// - scripts/sections.js (用于章节状态)

import { createStore } from 'vuex'
import sections from './modules/sections'
import game from './modules/game'
import save from './modules/save'

export default createStore({
  modules: {
    sections,
    game,
    save
  }
})
