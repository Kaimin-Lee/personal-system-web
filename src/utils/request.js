import axios from 'axios'
import { ElMessage } from 'element-plus'

// 1. 创建一个 axios 实例
const request = axios.create({
  // 使用 Vite 代理，这里留空或写 '/' 即可
  baseURL: '', 
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
    // 剥离最外层的 axios 包装，直接返回后端的 data 结构
    return response.data
  },
  error => {
    ElMessage.error('网络异常，请检查后端服务是否启动')
    return Promise.reject(error)
  }
)

// 4. 最关键的一行：默认导出这个配置好的实例！(你刚才就是少了这一行)
export default request