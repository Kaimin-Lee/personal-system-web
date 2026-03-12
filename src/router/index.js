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

// 路由守卫：核心免登逻辑
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  
  if (to.path === '/login' && token) {
    // 【免登逻辑】：如果有 Token 且还在有效期内，访问登录页时直接重定向到主页
    next('/dashboard')
  } else if (to.path !== '/login' && !token) {
    // 没有 Token 企图访问系统内部页面，踢回登录页
    ElMessage.warning('请先登录系统')
    next('/login')
  } else {
    // 正常放行
    next()
  }
})

export default router