<template>
  <div class="auth-container">
    <el-card class="auth-card">
      <template #header>
        <div class="auth-header">
          <h2>个人专属控制台</h2>
          <span>Personal Dashboard</span>
        </div>
      </template>

      <el-menu :default-active="activeMode" mode="horizontal" @select="handleModeSwitch" class="mode-menu">
        <el-menu-item index="login">登录</el-menu-item>
        <el-menu-item index="register">注册</el-menu-item>
        <el-menu-item index="reset">找回密码</el-menu-item>
      </el-menu>

      <el-form :model="authForm" :rules="rules" ref="authFormRef" label-width="0" class="auth-form">
        <el-form-item prop="email">
          <el-input v-model="authForm.email" placeholder="请输入常用邮箱" prefix-icon="Message" size="large" />
        </el-form-item>

        <el-form-item prop="code" v-if="activeMode !== 'login'">
          <div class="code-input-group">
            <el-input v-model="authForm.code" placeholder="验证码" prefix-icon="Key" size="large" style="flex: 1; margin-right: 10px;" />
            <el-button size="large" :disabled="countdown > 0" @click="sendCode" style="width: 120px;">
              {{ countdown > 0 ? `${countdown}s 后重发` : '获取验证码' }}
            </el-button>
          </div>
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input 
            v-model="authForm.password" 
            type="password" 
            :placeholder="activeMode === 'reset' ? '请输入新密码' : '请输入密码'" 
            prefix-icon="Lock"
            show-password
            size="large"
          />
        </el-form-item>

        <el-form-item>
          <el-button type="primary" class="submit-btn" size="large" :loading="loading" @click="handleSubmit">
            {{ activeMode === 'login' ? '登 录' : activeMode === 'register' ? '注 册' : '确 认 修 改' }}
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue'
import { Message, Lock, Key } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
// 1. 引入我们刚刚封装好的请求工具
import request from '../utils/request' 

const activeMode = ref('login')
const authFormRef = ref(null)
const loading = ref(false)
const countdown = ref(0)
let timer = null

const authForm = reactive({
  email: '',
  password: '',
  code: ''
})

const rules = reactive({
  email: [
    { required: true, message: '邮箱不能为空', trigger: 'blur' },
    { type: 'email', message: '请输入正确的邮箱格式', trigger: 'blur' }
  ],
  password: [{ required: true, message: '密码不能为空', trigger: 'blur' }],
  code: [{ required: true, message: '验证码不能为空', trigger: 'blur' }]
})

const handleModeSwitch = (mode) => {
  activeMode.value = mode
  authFormRef.value.resetFields()
}

// 改造后的发送验证码逻辑
const sendCode = async () => {
  if (!authForm.email) {
    ElMessage.warning('请先输入邮箱')
    return
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(authForm.email)) {
    ElMessage.warning('邮箱格式不正确')
    return
  }

  try {
    // 2. 这里只需要写接口路由，不需要写完整的 http://...
    const res = await request.post('/api/auth/sendCode', { email: authForm.email })
    
    // 3. 因为拦截器里已经提取了 response.data，所以这里直接用 res.code 判断
    if (res.code === 200) { 
      ElMessage.success('验证码发送成功，请查收邮件')
      countdown.value = 60
      timer = setInterval(() => {
        countdown.value--
        if (countdown.value <= 0) clearInterval(timer)
      }, 1000)
    } else {
      ElMessage.error(res.message)
    }
  } catch (error) {
    // 错误在拦截器里处理了，这里可以留空或做一些特殊处理
  }
}

// 改造后的统一提交逻辑
const handleSubmit = () => {
  authFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      
      // 4. 同样，只写相对路径
      let url = '/api/auth/login'
      let payload = { email: authForm.email, password: authForm.password }

      if (activeMode.value === 'register') {
        url = '/api/auth/register'
        payload.code = authForm.code
      } else if (activeMode.value === 'reset') {
        url = '/api/auth/resetPwd'
        payload.newPassword = authForm.password
        payload.code = authForm.code
      }

      try {
        const res = await request.post(url, payload)
        if (res.code === 200) {
          ElMessage.success(res.message)
          if (activeMode.value === 'login') {
            localStorage.setItem('token', res.data)
            // router.push('/dashboard') 
          } else {
            handleModeSwitch('login')
          }
        } else {
          ElMessage.error(res.message)
        }
      } catch (error) {
         // 错误拦截器已处理
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped>
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.auth-card {
  width: 420px;
  border-radius: 10px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
}
.auth-header {
  text-align: center;
}
.auth-header h2 {
  margin: 0 0 5px 0;
  color: #303133;
}
.auth-header span {
  color: #909399;
  font-size: 14px;
}
.mode-menu {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
  border-bottom: none;
}
.auth-form {
  padding: 0 10px;
}
.code-input-group {
  display: flex;
  width: 100%;
}
.submit-btn {
  width: 100%;
  border-radius: 5px;
  font-weight: bold;
}
</style>