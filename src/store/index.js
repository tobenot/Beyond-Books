// 重构时需要参考的文件:
// - scripts/interaction/GlobalState.js (用于全局状态管理)
// - scripts/settings.js (用于设置状态)
// - scripts/sections.js (用于章节状态)

import { createStore } from 'vuex'
import save from './modules/save'
import sections from './modules/sections'

export default createStore({
  modules: {
    save,
    sections
  }
})
