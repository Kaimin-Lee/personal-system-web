<template>
  <div class="profile-container">
    <!-- 顶部用户卡 -->
    <div class="user-banner">
      <div class="avatar-wrap" @dragover.prevent @drop.prevent="handleAvatarDrop" @click="showAvatarPicker = true">
        <el-avatar :size="88" :src="currentAvatar" class="avatar">{{ avatarText }}</el-avatar>
        <div class="avatar-ring"></div>
        <div class="avatar-edit-mask"><el-icon><Upload /></el-icon></div>
      </div>
      <div class="user-meta">
        <div class="user-name">{{ profileForm.nickname || profileForm.username || '未设置昵称' }}</div>
        <div class="user-email">{{ profileForm.email }}</div>
        <div class="user-since">注册于 {{ formatDate(profileForm.createTime) }}</div>
      </div>
    </div>

    <!-- 裁剪头像 -->
    <el-dialog v-model="showCropper" title="裁剪头像" width="520px" :close-on-click-modal="false">
      <div style="height:420px">
        <VueCropper
          ref="cropperRef"
          :img="cropSrc"
          :autoCrop="true"
          :centerBox="true"
          :fixed="true"
          :fixedNumber="[1, 1]"
          :autoCropWidth="280"
          :autoCropHeight="280"
          :round="true"
          :full="false"
          :canScale="true"
          :info="false"
          canvasColor="transparent"
          outputType="jpeg"
          style="width:100%;height:100%;background:#1e293b"
          @imgLoad="onImgLoad"
        />
      </div>
      <template #footer>
        <el-button @click="showCropper = false">取消</el-button>
        <el-button type="primary" @click="confirmCrop">裁剪并使用</el-button>
      </template>
    </el-dialog>

    <!-- 头像选择弹窗 -->
    <el-dialog v-model="showAvatarPicker" title="更换头像" width="520px" class="avatar-dialog">
      <!-- 上传区 -->
      <label class="upload-area" @dragover.prevent @drop.prevent="handleDrop">
        <input ref="pickerFileInput" type="file" accept="image/jpeg,image/png,image/gif,image/webp" style="display:none" @change="handlePickerFileChange" />
        <el-icon class="upload-icon"><Upload /></el-icon>
        <div class="upload-text">点击上传自定义头像</div>
        <div class="upload-hint">支持 JPG / PNG / GIF / WebP，不超过 2MB</div>
      </label>

      <el-divider>或选择预设头像</el-divider>

      <div class="avatar-grid">
        <div
          v-for="(url, i) in defaultAvatars" :key="i"
          :class="['avatar-option', { selected: selectedAvatar === url }]"
          @click="selectPresetAvatar(url)"
        >
          <el-avatar :size="60" :src="url" />
        </div>
      </div>
      <template #footer>
        <el-button @click="showAvatarPicker = false">取消</el-button>
        <el-button type="primary" @click="saveAvatar" :disabled="!selectedAvatar">确认使用</el-button>
      </template>
    </el-dialog>

    <el-row :gutter="24">
      <!-- 基本信息 -->
      <el-col :xs="24" :md="12">
        <el-card class="profile-card" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon class="header-icon"><User /></el-icon>
              <span class="card-title">基本信息</span>
            </div>
          </template>
          <el-form :model="profileForm" label-width="80px" class="profile-form">
            <el-form-item label="邮箱">
              <el-input :value="profileForm.email" disabled>
                <template #prefix><el-icon><Message /></el-icon></template>
              </el-input>
            </el-form-item>
            <el-form-item label="昵称">
              <el-input v-model="profileForm.nickname" placeholder="设置你的昵称" maxlength="20" show-word-limit>
                <template #prefix><el-icon><EditPen /></el-icon></template>
              </el-input>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveProfile" :loading="saving" style="width:100%">
                保存信息
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <!-- 修改密码 -->
      <el-col :xs="24" :md="12">
        <el-card class="profile-card" shadow="never">
          <template #header>
            <div class="card-header">
              <el-icon class="header-icon"><Lock /></el-icon>
              <span class="card-title">修改密码</span>
            </div>
          </template>
          <el-form :model="pwdForm" label-width="80px" class="profile-form">
            <el-form-item label="原密码">
              <el-input v-model="pwdForm.oldPassword" type="password" show-password placeholder="输入当前密码">
                <template #prefix><el-icon><Key /></el-icon></template>
              </el-input>
            </el-form-item>
            <el-form-item label="新密码">
              <el-input v-model="pwdForm.newPassword" type="password" show-password placeholder="至少6位">
                <template #prefix><el-icon><Key /></el-icon></template>
              </el-input>
              <div class="pwd-strength" v-if="pwdForm.newPassword">
                <div class="strength-bar">
                  <div class="strength-fill" :style="{ width: pwdStrength.pct + '%', background: pwdStrength.color }"></div>
                </div>
                <span :style="{ color: pwdStrength.color }">{{ pwdStrength.label }}</span>
              </div>
            </el-form-item>
            <el-form-item label="确认密码">
              <el-input v-model="pwdForm.confirmPassword" type="password" show-password placeholder="再次输入新密码"
                :class="{ 'mismatch': pwdForm.confirmPassword && pwdForm.newPassword !== pwdForm.confirmPassword }">
                <template #prefix><el-icon><Key /></el-icon></template>
              </el-input>
              <div class="mismatch-tip" v-if="pwdForm.confirmPassword && pwdForm.newPassword !== pwdForm.confirmPassword">
                两次密码不一致
              </div>
            </el-form-item>
            <el-form-item>
              <el-button type="warning" @click="changePassword" :loading="changingPwd" style="width:100%">
                修改密码
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, nextTick } from 'vue'
import { User, Message, EditPen, Lock, Key, Upload } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { ElMessage } from 'element-plus'
import CryptoJS from 'crypto-js'
import { VueCropper } from 'vue-cropper'
import 'vue-cropper/dist/index.css'

const profileForm = ref({ email: '', nickname: '', username: '', createTime: '' })
const pwdForm = ref({ oldPassword: '', newPassword: '', confirmPassword: '' })
const saving = ref(false)
const changingPwd = ref(false)
const showAvatarPicker = ref(false)
const selectedAvatar = ref('')

const defaultAvatars = [
  'https://api.dicebear.com/7.x/bottts/svg?seed=1',
  'https://api.dicebear.com/7.x/bottts/svg?seed=2',
  'https://api.dicebear.com/7.x/bottts/svg?seed=3',
  'https://api.dicebear.com/7.x/bottts/svg?seed=4',
  'https://api.dicebear.com/7.x/bottts/svg?seed=5',
  'https://api.dicebear.com/7.x/bottts/svg?seed=6',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=1',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=2',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=3',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=4',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=5',
  'https://api.dicebear.com/7.x/adventurer/svg?seed=6',
]

const storedAvatar = ref(localStorage.getItem('userAvatar') || '')

const currentAvatar = computed(() => {
  if (storedAvatar.value) return storedAvatar.value
  const id = profileForm.value.id || 1
  return defaultAvatars[(id - 1) % defaultAvatars.length]
})
const isUploaded = ref(false)

// 裁剪弹窗
const showCropper = ref(false)
const cropperRef = ref(null)
const cropSrc = ref('')
const pickerFileInput = ref(null)

const openCropDialog = (file) => {
  const reader = new FileReader()
  reader.onload = (e) => {
    cropSrc.value = e.target.result
    showCropper.value = true
  }
  reader.readAsDataURL(file)
}

const onImgLoad = () => {
  // 图片加载后放大到填满容器
  nextTick(() => {
    cropperRef.value?.changeScale(3)
  })
}

// canvas 压缩：最大边 800px，quality 0.85
const compressCanvas = (dataUrl) => new Promise((resolve) => {
  const img = new Image()
  img.onload = () => {
    const MAX = 800
    let { width, height } = img
    if (width > MAX || height > MAX) {
      if (width > height) { height = Math.round(height * MAX / width); width = MAX }
      else { width = Math.round(width * MAX / height); height = MAX }
    }
    const canvas = document.createElement('canvas')
    canvas.width = width; canvas.height = height
    canvas.getContext('2d').drawImage(img, 0, 0, width, height)
    canvas.toBlob((blob) => resolve(blob), 'image/jpeg', 0.85)
  }
  img.src = dataUrl
})

const confirmCrop = async () => {
  cropperRef.value.getCropData(async (dataUrl) => {
    showCropper.value = false
    const blob = await compressCanvas(dataUrl)
    const file = new File([blob], 'avatar.jpg', { type: 'image/jpeg' })
    await uploadAndApply(file)
  })
}

const handleAvatarFileChange = (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  openCropDialog(file)
  e.target.value = ''
}

const handlePickerFileChange = (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  showAvatarPicker.value = false
  openCropDialog(file)
  e.target.value = ''
}

const handleAvatarDrop = (e) => {
  const file = e.dataTransfer.files?.[0]
  if (file && file.type.startsWith('image/')) openCropDialog(file)
}

const uploadAndApply = async (file) => {
  if (file.size > 2 * 1024 * 1024) return ElMessage.warning('图片不能超过 2MB')
  const formData = new FormData()
  formData.append('file', file)
  const res = await request.post('/user/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  if (res.code === 200) {
    storedAvatar.value = res.data
    localStorage.setItem('userAvatar', res.data)
    window.dispatchEvent(new CustomEvent('avatar-updated', { detail: res.data }))
    ElMessage.success('头像已更新')
  } else {
    ElMessage.error(res.message || '上传失败')
  }
}

const handleFileChange = async (e) => {
  const file = e.target.files?.[0]
  if (!file) return
  await uploadToServer(file)
  e.target.value = ''
}

const handleDrop = (e) => {
  const file = e.dataTransfer.files?.[0]
  if (file && file.type.startsWith('image/')) {
    showAvatarPicker.value = false
    openCropDialog(file)
  }
}

const uploadToServer = async (file) => {
  if (file.size > 2 * 1024 * 1024) return ElMessage.warning('图片不能超过 2MB')
  const formData = new FormData()
  formData.append('file', file)
  const res = await request.post('/api/user/avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  if (res.code === 200) {
    selectedAvatar.value = res.data
    isUploaded.value = true
  } else {
    ElMessage.error(res.message || '上传失败')
  }
}

const selectPresetAvatar = async (url) => {
  selectedAvatar.value = url
  isUploaded.value = false
  await saveAvatar()
}

const saveAvatar = async () => {
  if (!selectedAvatar.value) return
  const res = await request.post('/user/profile', { avatar: selectedAvatar.value })
  if (res.code !== 200) return ElMessage.error(res.message || '保存失败')
  localStorage.setItem('userAvatar', selectedAvatar.value)
  storedAvatar.value = selectedAvatar.value
  window.dispatchEvent(new CustomEvent('avatar-updated', { detail: selectedAvatar.value }))
  showAvatarPicker.value = false
  isUploaded.value = false
  ElMessage.success('头像已更新')
}

const avatarText = computed(() => {
  const name = profileForm.value.nickname || profileForm.value.username || '?'
  return name.slice(-2)
})

const pwdStrength = computed(() => {
  const p = pwdForm.value.newPassword
  if (!p) return { pct: 0, color: '#e5e7eb', label: '' }
  let score = 0
  if (p.length >= 6) score++
  if (p.length >= 10) score++
  if (/[A-Z]/.test(p)) score++
  if (/[0-9]/.test(p)) score++
  if (/[^A-Za-z0-9]/.test(p)) score++
  const map = [
    { pct: 20, color: '#ef4444', label: '太弱' },
    { pct: 40, color: '#f97316', label: '弱' },
    { pct: 60, color: '#eab308', label: '一般' },
    { pct: 80, color: '#22c55e', label: '强' },
    { pct: 100, color: '#10b981', label: '很强' },
  ]
  return map[Math.min(score - 1, 4)] || map[0]
})

const fetchProfile = async () => {
  const res = await request.get('/user/profile')
  if (res.code === 200) {
    profileForm.value = res.data
    if (res.data.avatar) {
      storedAvatar.value = res.data.avatar
      localStorage.setItem('userAvatar', res.data.avatar)
    }
  }
}

const saveProfile = async () => {
  saving.value = true
  const res = await request.post('/user/profile', { nickname: profileForm.value.nickname })
  saving.value = false
  if (res.code === 200) ElMessage.success('信息已更新')
  else ElMessage.error(res.message)
}

const changePassword = async () => {
  const { oldPassword, newPassword, confirmPassword } = pwdForm.value
  if (!oldPassword || !newPassword) return ElMessage.warning('请填写完整')
  if (newPassword !== confirmPassword) return ElMessage.error('两次密码不一致')
  if (newPassword.length < 6) return ElMessage.warning('新密码至少6位')
  changingPwd.value = true
  const res = await request.post('/user/password', {
    oldPassword: CryptoJS.SHA256(oldPassword).toString(),
    newPassword: CryptoJS.SHA256(newPassword).toString()
  })
  changingPwd.value = false
  if (res.code === 200) {
    ElMessage.success('密码修改成功，请重新登录')
    pwdForm.value = { oldPassword: '', newPassword: '', confirmPassword: '' }
  } else {
    ElMessage.error(res.message)
  }
}

const formatDate = (t) => {
  if (!t) return '-'
  return new Date(t).toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' })
}

onMounted(fetchProfile)
</script>

<style scoped>
.profile-container { padding: 20px; max-width: 900px; }

/* 用户信息栏 */
.user-banner {
  display: flex; align-items: center; gap: 20px;
  padding: 24px 28px; margin-bottom: 24px;
  background: linear-gradient(135deg, rgba(0,243,255,0.06), rgba(99,102,241,0.06));
  border: 1px solid rgba(0,243,255,0.15);
  border-radius: 16px;
  backdrop-filter: blur(10px);
}
.avatar-wrap { position: relative; flex-shrink: 0; cursor: pointer; display: inline-block; }
.avatar {
  background: linear-gradient(135deg, #00f3ff, #6366f1);
  font-size: 22px; font-weight: 700; color: #fff;
  letter-spacing: 1px;
}
.avatar-ring {
  position: absolute; inset: -4px; border-radius: 50%;
  border: 2px solid rgba(0,243,255,0.4);
  animation: ring-pulse 2.5s ease-in-out infinite;
  pointer-events: none;
}
.avatar-edit-mask {
  position: absolute; inset: 0; border-radius: 50%;
  background: rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center;
  opacity: 0; transition: opacity 0.2s; color: #fff; font-size: 20px;
}
.avatar-wrap:hover .avatar-edit-mask { opacity: 1; }

.avatar-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 14px; padding: 8px 0; }
.avatar-option {
  border-radius: 50%; cursor: pointer; padding: 4px;
  border: 2px solid transparent; transition: border-color 0.2s, transform 0.2s;
  display: flex; align-items: center; justify-content: center;
}
.avatar-option:hover { transform: scale(1.1); border-color: rgba(0,243,255,0.4); }
.avatar-option.selected { border-color: #00f3ff; box-shadow: 0 0 10px rgba(0,243,255,0.5); }

/* 上传区 */
.upload-area {
  display: block; border: 2px dashed rgba(0,243,255,0.25); border-radius: 10px;
  padding: 20px; text-align: center; cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  margin-bottom: 4px;
}
.upload-area:hover { border-color: rgba(0,243,255,0.6); background: rgba(0,243,255,0.04); }
.upload-icon { font-size: 28px; color: #00f3ff; margin-bottom: 8px; display: block; margin-left: auto; margin-right: auto; }
.upload-text { font-size: 14px; color: #94a3b8; margin-bottom: 4px; }
.upload-hint { font-size: 12px; color: #475569; }
.upload-preview { display: flex; align-items: center; justify-content: center; gap: 10px; margin-top: 12px; }
.preview-tip { font-size: 12px; color: #34d399; }
@keyframes ring-pulse {
  0%, 100% { opacity: 0.4; transform: scale(1); }
  50% { opacity: 1; transform: scale(1.05); }
}
.user-name { font-size: 20px; font-weight: 700; color: #e2e8f0; margin-bottom: 4px; }
.user-email { font-size: 13px; color: #94a3b8; margin-bottom: 4px; }
.user-since { font-size: 12px; color: #64748b; }

/* 卡片 */
.profile-card {
  border-radius: 14px;
  border: 1px solid rgba(0,243,255,0.1);
  background: rgba(255,255,255,0.03);
  margin-bottom: 20px;
}
.card-header { display: flex; align-items: center; gap: 8px; }
.header-icon { color: #00f3ff; font-size: 16px; }
.card-title { font-size: 15px; font-weight: 600; color: #e2e8f0; }

.profile-form :deep(.el-form-item) { margin-bottom: 18px; }
.profile-form :deep(.el-input__wrapper) {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(255,255,255,0.1);
  box-shadow: none;
}
.profile-form :deep(.el-input__wrapper:hover) { border-color: rgba(0,243,255,0.3); }
.profile-form :deep(.el-input__wrapper.is-focus) { border-color: rgba(0,243,255,0.6); box-shadow: 0 0 0 2px rgba(0,243,255,0.1); }
.profile-form :deep(.el-input__inner) { color: #e2e8f0; }
.profile-form :deep(.el-input.is-disabled .el-input__wrapper) { background: rgba(255,255,255,0.02); }

/* 密码强度 */
.pwd-strength { margin-top: 8px; display: flex; align-items: center; gap: 10px; }
.strength-bar { flex: 1; height: 4px; background: rgba(255,255,255,0.1); border-radius: 2px; overflow: hidden; }
.strength-fill { height: 100%; border-radius: 2px; transition: width 0.4s, background 0.4s; }
.pwd-strength span { font-size: 12px; min-width: 28px; }

.mismatch-tip { font-size: 12px; color: #ef4444; margin-top: 4px; }
:deep(.mismatch .el-input__wrapper) { border-color: #ef4444 !important; }
</style>
