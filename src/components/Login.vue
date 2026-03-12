<template>
  <div class="auth-container">
    <el-card class="auth-card">
      
      <template #header>
        <div class="auth-header">
          <h2>LifeOS 个人数字中枢</h2>
          <span>Digital Workspace & Life Management</span>
        </div>
      </template>

      <el-menu :default-active="activeMode" mode="horizontal" @select="handleModeSwitch" class="mode-menu">
        <el-menu-item index="login">登录</el-menu-item>
        <el-menu-item index="register">注册</el-menu-item>
        <el-menu-item index="reset">找回密码</el-menu-item>
      </el-menu>

      <el-form :model="authForm" :rules="rules" ref="authFormRef" label-width="0" class="auth-form">
        <el-form-item prop="email">
          <el-input v-model="authForm.email" placeholder="请输入常用邮箱" :prefix-icon="Message" size="large" />
        </el-form-item>

        <el-form-item prop="code" v-if="activeMode !== 'login'">
          <div class="code-input-group">
            <el-input v-model="authForm.code" placeholder="验证码" :prefix-icon="Key" size="large" style="flex: 1; margin-right: 10px;" />
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
            :prefix-icon="Lock"
            show-password
            size="large"
            @keyup.enter="handleSubmit"
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
import request from '@/utils/request'
import { useRouter } from 'vue-router'
import CryptoJS from 'crypto-js' // 引入前端加密库

const router = useRouter()
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
    const res = await request.post('/auth/sendCode', { email: authForm.email })
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
    // 错误在拦截器处理
  }
}

const handleSubmit = () => {
  authFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      
      // 【核心安全改造】：提交前将密码进行 SHA-256 单向加密，绝不传输明文
      const encryptedPassword = CryptoJS.SHA256(authForm.password).toString()

      let url = '/auth/login'
      let payload = { email: authForm.email, password: encryptedPassword }

      if (activeMode.value === 'register') {
        url = '/auth/register'
        payload.code = authForm.code
      } else if (activeMode.value === 'reset') {
        url = '/auth/resetPwd'
        payload.newPassword = encryptedPassword // 重置密码同样传输密文
        payload.code = authForm.code
      }

      try {
        const res = await request.post(url, payload)
        if (res.code === 200) {
          ElMessage.success(res.message)
          if (activeMode.value === 'login') {
            // 登录成功，存储后端返回的 7天免登 Token
            console.log('登录响应数据:', res)
            const token = res.data?.token || res.data
            console.log('提取的 token:', token)
            if (token) {
              localStorage.setItem('token', token)
              console.log('token 已存储到 localStorage')
            } else {
              console.error('未能从响应中提取 token')
            }
            router.push('/dashboard')
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