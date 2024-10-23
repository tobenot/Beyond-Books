// 重构时需要参考的文件:
// - scripts/interaction/GlobalState.js (用于全局状态管理)
// - scripts/settings.js (用于设置状态)
// - scripts/sections.js (用于章节状态)

import Vue from 'vue'
import Vuex from 'vuex'
import game from './modules/game'
import settings from './modules/settings'
import sections from './modules/sections'

Vue.use(Vuex)

export default new Vuex.Store({
  modules: {
    game,
    settings,
    sections
  }
})
