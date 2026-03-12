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
  // 【新增】：根据路由 meta 动态修改浏览器标签页标题，极其专业！
  if (to.meta.title) {
    document.title = `${to.meta.title} - LifeOS`
  } else {
    document.title = 'LifeOS · 个人数字中枢'
  }

  const token = localStorage.getItem('token')
  
  if (to.path === '/login' && token) {
    next('/dashboard')
  } else if (to.path !== '/login' && !token) {
    if (from.name) {
      ElMessage.warning('请先登录系统')
    }
    next('/login')
  } else {
    next()
  }
})
export default router