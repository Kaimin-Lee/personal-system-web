<template>
  <div class="auth-container">
    <el-card class="auth-card">
      
      <template #header>
        <div class="auth-header">
          <h2 class="glow-title">LifeOS 个人数字中枢</h2>
          <span>Digital Workspace & Life Management</span>
        </div>
      </template>

      <el-menu :default-active="activeMode" mode="horizontal" @select="handleModeSwitch" class="mode-menu">
        <el-menu-item index="login">系统登入</el-menu-item>
        <el-menu-item index="register">创建账户</el-menu-item>
        <el-menu-item index="reset">密钥重置</el-menu-item>
      </el-menu>

      <el-form :model="authForm" :rules="rules" ref="authFormRef" label-width="0" class="auth-form">
        <el-form-item prop="email">
          <el-input v-model="authForm.email" placeholder="请输入系统邮箱" :prefix-icon="Message" size="large" />
        </el-form-item>

        <el-form-item prop="code" v-if="activeMode !== 'login'">
          <div class="code-input-group">
            <el-input v-model="authForm.code" placeholder="验证码" :prefix-icon="Key" size="large" class="code-input" />
            <el-button size="large" :disabled="countdown > 0" @click="sendCode" class="code-btn">
              {{ countdown > 0 ? `${countdown}s 后重发` : '获取验证码' }}
            </el-button>
          </div>
        </el-form-item>
        
        <el-form-item prop="password">
          <el-input 
            v-model="authForm.password" 
            type="password" 
            :placeholder="activeMode === 'reset' ? '请输入新安全密钥' : '请输入安全密钥'" 
            :prefix-icon="Lock"
            show-password
            size="large"
            @keyup.enter="handleSubmit"
          />
        </el-form-item>

        <el-form-item style="margin-top: 30px;">
          <el-button type="primary" class="submit-btn" size="large" :loading="loading" @click="handleSubmit">
            {{ activeMode === 'login' ? '启 动 连 接' : activeMode === 'register' ? '注 册 节 点' : '重 构 密 钥' }}
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
import CryptoJS from 'crypto-js' 

const router = useRouter()
const activeMode = ref('login') 
const authFormRef = ref(null)
const loading = ref(false)
const countdown = ref(0)
let timer = null

const authForm = reactive({ email: '', password: '', code: '' })

const rules = reactive({
  email: [
    { required: true, message: '系统邮箱不可为空', trigger: 'blur' },
    { type: 'email', message: '非法邮箱格式协议', trigger: 'blur' }
  ],
  password: [{ required: true, message: '安全密钥不可为空', trigger: 'blur' }],
  code: [{ required: true, message: '验证序列不可为空', trigger: 'blur' }]
})

const handleModeSwitch = (mode) => {
  activeMode.value = mode
  authFormRef.value.resetFields()
}

const sendCode = async () => {
  if (!authForm.email) return ElMessage.warning('请先输入系统邮箱')
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(authForm.email)) return ElMessage.warning('非法邮箱格式协议')

  try {
    const res = await request.post('/auth/sendCode', { email: authForm.email })
    if (res.code === 200) {
      ElMessage.success('验证序列已发送，请查收邮件')
      countdown.value = 60
      timer = setInterval(() => {
        countdown.value--
        if (countdown.value <= 0) clearInterval(timer)
      }, 1000)
    } else {
      ElMessage.error(res.message)
    }
  } catch (error) {}
}

const handleSubmit = () => {
  authFormRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      const encryptedPassword = CryptoJS.SHA256(authForm.password).toString()

      let url = '/auth/login'
      let payload = { email: authForm.email, password: encryptedPassword }

      if (activeMode.value === 'register') {
        url = '/auth/register'
        payload.code = authForm.code
      } else if (activeMode.value === 'reset') {
        url = '/auth/resetPwd'
        payload.newPassword = encryptedPassword 
        payload.code = authForm.code
      }

      try {
        const res = await request.post(url, payload)
        if (res.code === 200) {
          ElMessage.success(res.message)
          if (activeMode.value === 'login') {
            const token = res.data?.token || res.data
            if (token) localStorage.setItem('token', token)
            router.push('/dashboard')
          } else {
            handleModeSwitch('login')
          }
        } else {
          ElMessage.error(res.message)
        }
      } catch (error) {
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped>
/* 核心：赛博幻境背景 */
.auth-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background-color: #050a15;
  background-image: 
    radial-gradient(circle at 50% 50%, rgba(0, 243, 255, 0.08) 0%, transparent 60%),
    linear-gradient(rgba(0, 243, 255, 0.03) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 243, 255, 0.03) 1px, transparent 1px);
  background-size: 100% 100%, 40px 40px, 40px 40px;
  padding: 20px;
}

/* 毛玻璃登录面板 */
.auth-card {
  width: 100%; 
  max-width: 420px; 
  border-radius: 16px;
  background: rgba(10, 15, 30, 0.6) !important;
  backdrop-filter: blur(20px) !important;
  -webkit-backdrop-filter: blur(20px) !important;
  border: 1px solid rgba(0, 243, 255, 0.3) !important;
  box-shadow: 0 0 40px rgba(0, 243, 255, 0.15) !important;
}

.auth-header {
  text-align: center;
  padding-top: 10px;
}
.glow-title {
  margin: 0 0 5px 0;
  color: #e2e8f0;
  text-shadow: 0 0 10px rgba(0, 243, 255, 0.8);
  font-size: 24px;
  letter-spacing: 1px;
}
.auth-header span {
  color: #94a3b8;
  font-size: 13px;
  letter-spacing: 2px;
}

/* 顶部模式切换菜单深度美化 */
.mode-menu {
  display: flex;
  justify-content: center;
  margin-bottom: 25px;
  background: transparent !important;
  border-bottom: 1px solid rgba(0, 243, 255, 0.15) !important;
}
:deep(.el-menu-item) {
  color: #94a3b8 !important;
  font-size: 15px;
  transition: all 0.3s;
}
:deep(.el-menu-item.is-active) {
  color: #00f3ff !important;
  border-bottom: 2px solid #00f3ff !important;
  background-color: transparent !important;
  text-shadow: 0 0 8px rgba(0, 243, 255, 0.6);
}
:deep(.el-menu-item:hover) {
  background-color: rgba(0, 243, 255, 0.05) !important;
  color: #e2e8f0 !important;
}

.auth-form {
  padding: 0 10px;
}

/* 输入框定制化 */
:deep(.el-input__wrapper) {
  background-color: rgba(0, 0, 0, 0.4) !important;
  border: 1px solid rgba(0, 243, 255, 0.15) !important;
  box-shadow: none !important;
  transition: all 0.3s ease;
}
:deep(.el-input__wrapper.is-focus) {
  border-color: #00f3ff !important;
  box-shadow: 0 0 10px rgba(0, 243, 255, 0.3) !important;
}
:deep(.el-input__inner) {
  color: #e2e8f0 !important;
}
:deep(.el-input__prefix-inner) {
  color: #00f3ff !important;
}

.code-input-group {
  display: flex;
  width: 100%;
  gap: 12px; 
}
.code-input {
  flex: 1;
}

/* 发送验证码按钮重做 */
.code-btn {
  width: 115px;
  padding: 0;
  background: rgba(0, 243, 255, 0.05) !important;
  border: 1px solid rgba(0, 243, 255, 0.3) !important;
  color: #00f3ff !important;
  transition: all 0.3s;
}
.code-btn:hover:not(:disabled) {
  background: rgba(0, 243, 255, 0.15) !important;
  box-shadow: 0 0 10px rgba(0, 243, 255, 0.3) !important;
}
.code-btn:disabled {
  background: rgba(255, 255, 255, 0.05) !important;
  border-color: rgba(255, 255, 255, 0.1) !important;
  color: #64748b !important;
}

/* 主按钮流光特效 */
.submit-btn {
  width: 100%;
  border-radius: 8px;
  font-weight: bold;
  font-size: 16px;
  letter-spacing: 4px;
}

@media screen and (max-width: 480px) {
  .auth-card {
    border-radius: 20px;
    border: none !important;
    background: rgba(10, 15, 30, 0.8) !important;
  }
  .glow-title {
    font-size: 20px;
  }
  .auth-form {
    padding: 0;
  }
}
</style>