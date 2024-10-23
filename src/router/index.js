// 重构时需要参考的文件:
// - scripts/ui.js (用于路由逻辑)

import Vue from 'vue'
import VueRouter from 'vue-router'  // 改用 VueRouter 而不是 createRouter
import Home from '../views/Home.vue'
import Sections from '../views/Sections.vue'
import Story from '../views/Story.vue'
import Settings from '../views/Settings.vue'

Vue.use(VueRouter)

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/sections', name: 'Sections', component: Sections },
  { path: '/story', name: 'Story', component: Story },
  { path: '/settings', name: 'Settings', component: Settings },
  { path: '/review', name: 'Review', component: () => import('../views/Review.vue'), meta: { title: 'reviewTitle' } }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.NODE_ENV === 'production' 
    ? '/' + process.env.BRANCH_NAME + '/'
    : '/',
  routes
})

export default router
