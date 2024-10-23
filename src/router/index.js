// 重构时需要参考的文件:
// - scripts/ui.js (用于路由逻辑)

import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import SectionsView from '../views/SectionsView.vue'
import StoryView from '../views/StoryView.vue'
import SettingsView from '../views/SettingsView.vue'

const routes = [
  { path: '/', name: 'Home', component: HomeView },
  { path: '/sections', name: 'Sections', component: SectionsView },
  { path: '/story', name: 'Story', component: StoryView },
  { path: '/settings', name: 'Settings', component: SettingsView },
  { 
    path: '/review', 
    name: 'Review', 
    component: () => import('../views/ReviewView.vue'),
    meta: { title: 'reviewTitle' } 
  }
]

const router = createRouter({
  history: createWebHistory('/'),
  routes
})

// 添加导航守卫来调试
router.beforeEach((to, from, next) => {
  console.log('路由跳转:', { to, from })
  next()
})

export default router
