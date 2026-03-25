import axios from 'axios'
import { ElMessage } from 'element-plus'
import router from '@/router'

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL, 
  timeout: 5000 
})

request.interceptors.request.use(
  config => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  error => Promise.reject(error)
)

request.interceptors.response.use(
  response => {
    const res = response.data
    
    // 1. 处理 Token 失效
    if (res.code === 401) {
      ElMessage.warning('登录已过期，请重新登录')
      localStorage.removeItem('token')
      
      // 【优化】：携带当前路由全路径，作为重新登录后的重定向目标
      const currentPath = router.currentRoute.value.fullPath
      router.push({ path: '/login', query: { redirect: currentPath } })
      
      return Promise.reject(new Error(res.message)) 
    }
    
    // 2. 【核心修复】：统一拦截所有的业务级报错
    if (res.code !== 200) {
      ElMessage.error(res.message || '系统繁忙，请稍后再试')
      // 抛出错误，阻断具体组件里的 then 逻辑继续执行
      return Promise.reject(new Error(res.message || '业务接口请求失败')) 
    }
    
    // 3. 正常成功的情况
    return res
  },
  error => {
    ElMessage.error('网络异常，请检查后端服务是否启动')
    return Promise.reject(error)
  }
)

export default request