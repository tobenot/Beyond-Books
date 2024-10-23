// 重构时需要参考的文件:
// - scripts/ui.js (用于路由逻辑)

import Vue from 'vue'
import VueRouter from 'vue-router'
import Home from '../views/Home.vue'
import Sections from '../views/Sections.vue'
import Story from '../views/Story.vue'
import Settings from '../views/Settings.vue'
import Review from '../views/Review.vue'

Vue.use(VueRouter)

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/sections', name: 'Sections', component: Sections },
  { path: '/story', name: 'Story', component: Story },
  { path: '/settings', name: 'Settings', component: Settings },
  { path: '/review', name: 'Review', component: Review }
]

const router = new VueRouter({
  routes
})

export default router
