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
    // 指向我们马上要写的整体布局组件
    component: () => import('../layout/Index.vue'), 
    redirect: '/dashboard', // 默认重定向到首页看板
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('../views/dashboard/Index.vue'),
        meta: { title: '我的主页' }
      }
      // 未来这里会不停地往里加子路由，比如：
      // { path: 'work/todo', component: () => import('../views/work/Todo.vue') }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫：如果没有 Token，直接踢回登录页
router.beforeEach((to, from, next) => {
  const token = localStorage.getItem('token')
  if (to.path !== '/login' && !token) {
    ElMessage.warning('请先登录系统')
    next('/login')
  } else {
    next()
  }
})

export default router