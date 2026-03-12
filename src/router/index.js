import { createRouter, createWebHistory } from 'vue-router'
import { ElMessage } from 'element-plus'

const routes = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('../components/Login.vue')
  },
  {
    path: '/',
    name: 'Layout',
    component: () => import('../layout/Index.vue'), 
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/dashboard/Index.vue'),
        meta: { title: '我的主页' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  
  if (to.path === '/login' && token) {
    next('/dashboard')
  } else if (to.path !== '/login' && !token) {
    // 【核心修复】：如果是用户第一次打开网页或强制刷新网页（from.name 不存在），不弹警告，直接静默过去
    if (from.name) {
      ElMessage.warning('请先登录系统')
    }
    next('/login')
  } else {
    next()
  }
})

export default router