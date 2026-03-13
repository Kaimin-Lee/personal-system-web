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
      },
      {
        path: 'work/todo',
        name: 'Todo',
        component: () => import('../views/work/Todo.vue'),
        meta: { title: '项目进度看板' }
      },
	  {
	          path: 'life/countdown',
	          name: 'Countdown',
	          component: () => import('../views/life/Countdown.vue'),
	          meta: { title: '倒数日管理' }
	        }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// 路由守卫：核心免登逻辑与动态标题
router.beforeEach((to, from, next) => {
  // 动态修改浏览器标签页标题
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