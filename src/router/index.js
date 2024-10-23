// 重构时需要参考的文件:
// - scripts/ui.js (用于路由逻辑)

import { createRouter, createWebHistory } from 'vue-router'
import Home from '../views/Home.vue'
import Sections from '../views/Sections.vue'
import Story from '../views/Story.vue'
import Settings from '../views/Settings.vue'

const routes = [
  { path: '/', name: 'Home', component: Home },
  { path: '/sections', name: 'Sections', component: Sections },
  { path: '/story', name: 'Story', component: Story },
  { path: '/settings', name: 'Settings', component: Settings },
  { 
    path: '/review', 
    name: 'Review', 
    component: () => import('../views/Review.vue'),
    meta: { title: 'reviewTitle' } 
  }
]

const router = createRouter({
  history: createWebHistory(
    process.env.NODE_ENV === 'production' 
      ? '/' + (process.env.BRANCH_NAME || 'main') + '/'
      : '/'
  ),
  routes
})

export default router
