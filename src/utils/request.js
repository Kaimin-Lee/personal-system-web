import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

// 1. 创建一个 axios 实例
const request = axios.create({
  // 【核心改造】：动态获取不同环境下的后端地址
  baseURL: import.meta.env.VITE_API_BASE_URL, 
  timeout: 5000 
})

// 2. 请求拦截器：统一携带 Token
request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 3. 响应拦截器：统一处理后端返回结构和报错
request.interceptors.response.use(
  response => {
    const res = response.data
    // 【核心改造】：如果后端返回 401，说明 Token 失效/过期
    if (res.code === 401) {
      ElMessage.warning('登录已过期，请重新登录')
      localStorage.removeItem('token') // 清除失效的 token
      router.push('/login') // 强行跳转到登录页
      return Promise.reject(new Error(res.message)) // 阻断业务请求继续往下走
    }
    return res
  },
  error => {
    ElMessage.error('网络异常，请检查后端服务是否启动')
    return Promise.reject(error)
  }
)

export default request