<template>
  <el-drawer
    v-model="visible"
    :title="isAdmin ? '后台消息中枢' : '通讯直连节点'"
    :size="isAdmin ? (isMobile ? '100%' : '650px') : (isMobile ? '100%' : '400px')"
    class="cyber-chat-drawer"
    @close="handleClose"
  >
    <div class="chat-container" v-loading="loading">
      
      <div v-if="isAdmin" class="session-sidebar">
        <div class="session-header">连接列表</div>
        <el-scrollbar>
          <div 
            v-for="uid in sessionList" 
            :key="uid" 
            :class="['session-item', { active: targetUserId === uid }]"
            @click="selectSession(uid)"
          >
            <el-avatar size="small" class="cyber-avatar">{{ uid }}</el-avatar>
            <span class="uid-text">节点 ID: {{ uid }}</span>
          </div>
          <el-empty v-if="sessionList.length === 0" description="暂无通讯接入" :image-size="60" />
        </el-scrollbar>
      </div>

      <div class="chat-main" v-if="targetUserId">
        <el-scrollbar ref="scrollbarRef" class="msg-list">
          <div class="msg-inner">
            <div 
              v-for="msg in messageList" 
              :key="msg.id" 
              :class="['msg-bubble-wrapper', msg.senderId === myUserId ? 'is-me' : 'is-other']"
            >
              <div class="msg-time">{{ msg.createTime }}</div>
              <div class="msg-bubble">{{ msg.content }}</div>
            </div>
            <el-empty v-if="messageList.length === 0" description="建立通讯协议中..." :image-size="60" />
          </div>
        </el-scrollbar>
        
        <div class="chat-input-area">
          <el-input 
            v-model="inputText" 
            type="textarea" 
            :rows="3" 
            placeholder="[ Ctrl+Enter ] 或点击发送指令..." 
            resize="none"
            class="cyber-textarea"
            @keydown.ctrl.enter="sendMessage"
          />
          <div class="send-action">
            <el-button type="primary" size="small" @click="sendMessage">发 送</el-button>
          </div>
        </div>
      </div>
      
      <div class="chat-main empty-main" v-else>
        <el-empty description="等待选择通讯节点" />
      </div>

    </div>
  </el-drawer>
</template>

<script setup>
import { ref, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const visible = ref(false)
const loading = ref(false)
const isMobile = ref(window.innerWidth <= 768)

const isAdmin = ref(false)
const myUserId = ref(null)
const targetUserId = ref(null)

const sessionList = ref([])
const messageList = ref([])
const inputText = ref('')
const scrollbarRef = ref(null)
let pollTimer = null

const parseTokenUserId = () => {
  const token = localStorage.getItem('token')
  if (!token) return null
  try {
    const payload = JSON.parse(decodeURIComponent(escape(atob(token.split('.')[1]))))
    return payload.userId || payload.id || parseInt(payload.sub) || null
  } catch (e) {
    return null
  }
}

const open = () => {
  myUserId.value = parseTokenUserId()
  if (!myUserId.value) return ElMessage.warning('系统未认证，拒绝连接')
  
  isAdmin.value = (myUserId.value === 1)
  visible.value = true
  
  if (isAdmin.value) {
    fetchSessions()
  } else {
    targetUserId.value = 1 
    fetchHistory()
  }

  pollTimer = setInterval(() => {
    if (targetUserId.value) fetchHistory(true)
    if (isAdmin.value) fetchSessions(true)
  }, 3000)
}

const handleClose = () => {
  if (pollTimer) clearInterval(pollTimer)
  messageList.value = []
  targetUserId.value = null
}

const fetchSessions = async (isSilent = false) => {
  if (!isSilent) loading.value = true
  try {
    const res = await request.get('/message/sessions')
    if (res.code === 200) sessionList.value = res.data
  } finally {
    if (!isSilent) loading.value = false
  }
}

const selectSession = (uid) => {
  targetUserId.value = uid
  fetchHistory()
}

const fetchHistory = async (isSilent = false) => {
  if (!targetUserId.value) return
  try {
    const res = await request.get(`/message/history?targetId=${targetUserId.value}`)
    if (res.code === 200) {
      const isNewMessage = res.data.length > messageList.value.length
      messageList.value = res.data
      if (isNewMessage) scrollToBottom() 
      request.post(`/message/read?targetId=${targetUserId.value}`).catch(()=>{})
    }
  } catch (e) {}
}

const sendMessage = async () => {
  if (!inputText.value.trim()) return
  try {
    const res = await request.post('/message/send', {
      receiverId: targetUserId.value,
      content: inputText.value.trim()
    })
    if (res.code === 200) {
      inputText.value = ''
      fetchHistory()
    }
  } catch (e) {}
}

const scrollToBottom = () => {
  nextTick(() => {
    if (scrollbarRef.value) {
      const wrap = scrollbarRef.value.wrapRef
      if (wrap) wrap.scrollTop = wrap.scrollHeight
    }
  })
}

defineExpose({ open })
</script>

<style>
/* 针对整个 Drawer 的深色毛玻璃重写（必须写在全局或者使用 :global） */
.dark .cyber-chat-drawer {
  background: rgba(10, 15, 25, 0.85) !important;
  backdrop-filter: blur(25px) !important;
  border-left: 1px solid rgba(0, 243, 255, 0.3) !important;
  box-shadow: -10px 0 40px rgba(0, 243, 255, 0.1) !important;
}
.dark .cyber-chat-drawer .el-drawer__header {
  margin-bottom: 0;
  padding: 20px;
  color: #00f3ff !important;
  border-bottom: 1px solid rgba(0, 243, 255, 0.15);
  font-weight: bold;
  letter-spacing: 2px;
  text-shadow: 0 0 8px rgba(0, 243, 255, 0.5);
}
/* 去除默认原生内边距，让布局顶边 */
.cyber-chat-drawer .el-drawer__body {
  padding: 0 !important;
  overflow: hidden;
}
</style>

<style scoped>
.chat-container {
  display: flex;
  height: 100%;
}

/* ============ 左侧列表 ============ */
.session-sidebar {
  width: 200px;
  background: rgba(0, 0, 0, 0.2);
  border-right: 1px solid rgba(0, 243, 255, 0.15);
  display: flex;
  flex-direction: column;
}
.session-header {
  padding: 15px;
  font-weight: bold;
  border-bottom: 1px solid rgba(0, 243, 255, 0.1);
  color: #00f3ff;
  font-size: 14px;
}
.session-item {
  padding: 12px 15px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  transition: all 0.3s;
}
.session-item:hover {
  background: rgba(0, 243, 255, 0.05);
}
.session-item.active {
  background: rgba(0, 243, 255, 0.15);
  border-right: 3px solid #00f3ff;
  box-shadow: inset 0 0 15px rgba(0, 243, 255, 0.1);
}
.uid-text {
  font-size: 14px;
  color: #e2e8f0;
}
.cyber-avatar {
  background: rgba(0, 243, 255, 0.1);
  color: #00f3ff;
  border: 1px solid rgba(0, 243, 255, 0.3);
}

/* ============ 右侧主屏 ============ */
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: transparent;
  height: 100%;
}
.empty-main {
  justify-content: center;
  align-items: center;
}
.msg-list {
  flex: 1;
  padding: 20px;
  background: rgba(0, 0, 0, 0.15);
}
.msg-inner {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.msg-bubble-wrapper {
  display: flex;
  flex-direction: column;
  max-width: 85%;
}
.msg-bubble-wrapper.is-me {
  align-self: flex-end;
  align-items: flex-end;
}
.msg-bubble-wrapper.is-other {
  align-self: flex-start;
  align-items: flex-start;
}
.msg-time {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 6px;
}
.msg-bubble {
  padding: 10px 15px;
  border-radius: 12px;
  font-size: 14px;
  line-height: 1.6;
  word-break: break-all;
  backdrop-filter: blur(5px);
}

/* 别人发的消息：极客暗灰 */
.is-other .msg-bubble {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.15);
  color: #e2e8f0;
  border-top-left-radius: 2px;
}

/* 你发的消息：霓虹全息青 */
.is-me .msg-bubble {
  background: rgba(0, 243, 255, 0.1);
  border: 1px solid rgba(0, 243, 255, 0.4);
  color: #00f3ff;
  border-top-right-radius: 2px;
  box-shadow: 0 4px 15px rgba(0, 243, 255, 0.1);
}

/* ============ 输入区 ============ */
.chat-input-area {
  padding: 15px;
  border-top: 1px solid rgba(0, 243, 255, 0.15);
  background: rgba(0, 0, 0, 0.3);
}

/* 深度定制输入框 */
:deep(.cyber-textarea .el-textarea__inner) {
  background-color: rgba(0, 0, 0, 0.5) !important;
  border: 1px solid rgba(0, 243, 255, 0.2) !important;
  color: #e2e8f0 !important;
  box-shadow: none !important;
  border-radius: 8px;
  transition: all 0.3s ease;
}
:deep(.cyber-textarea .el-textarea__inner:focus) {
  border-color: #00f3ff !important;
  box-shadow: 0 0 15px rgba(0, 243, 255, 0.2) !important;
}

.send-action {
  text-align: right;
  margin-top: 12px;
}
</style>