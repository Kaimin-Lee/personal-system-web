<template>
  <el-drawer
    v-model="visible"
    :title="isAdmin ? '后台消息中心' : '联系作者'"
    :size="isAdmin ? (isMobile ? '100%' : '650px') : (isMobile ? '100%' : '400px')"
    class="chat-drawer"
    @close="handleClose"
  >
    <div class="chat-container" v-loading="loading">
      
      <div v-if="isAdmin" class="session-sidebar">
        <div class="session-header">消息列表</div>
        <el-scrollbar>
          <div 
            v-for="uid in sessionList" 
            :key="uid" 
            :class="['session-item', { active: targetUserId === uid }]"
            @click="selectSession(uid)"
          >
            <el-avatar size="small">{{ uid }}</el-avatar>
            <span class="uid-text">用户 ID: {{ uid }}</span>
          </div>
          <el-empty v-if="sessionList.length === 0" description="暂无消息" :image-size="60" />
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
            <el-empty v-if="messageList.length === 0" description="说点什么吧..." :image-size="60" />
          </div>
        </el-scrollbar>
        
        <div class="chat-input-area">
          <el-input 
            v-model="inputText" 
            type="textarea" 
            :rows="3" 
            placeholder="按 Ctrl+Enter 或点击按钮发送..." 
            resize="none"
            @keydown.ctrl.enter="sendMessage"
          />
          <div class="send-action">
            <el-button type="primary" size="small" @click="sendMessage">发 送</el-button>
          </div>
        </div>
      </div>
      
      <div class="chat-main empty-main" v-else>
        <el-empty description="请在左侧选择一个用户进行对话" />
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

// 解析 JWT Token 获取当前登录的用户 ID
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

// 暴露给父组件的打开方法
const open = () => {
  myUserId.value = parseTokenUserId()
  if (!myUserId.value) return ElMessage.warning('请先登录系统')
  
  isAdmin.value = (myUserId.value === 1)
  visible.value = true
  
  if (isAdmin.value) {
    fetchSessions()
  } else {
    targetUserId.value = 1 // 普通用户强制跟 1(管理员) 聊天
    fetchHistory()
  }

  // 开启3秒静默轮询，保持聊天实时性
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

// 获取会话列表 (管理员)
const fetchSessions = async (isSilent = false) => {
  if (!isSilent) loading.value = true
  try {
    const res = await request.get('/message/sessions')
    if (res.code === 200) sessionList.value = res.data
  } finally {
    if (!isSilent) loading.value = false
  }
}

// 选择会话
const selectSession = (uid) => {
  targetUserId.value = uid
  fetchHistory()
}

// 获取聊天记录并同时消除红点
const fetchHistory = async (isSilent = false) => {
  if (!targetUserId.value) return
  try {
    const res = await request.get(`/message/history?targetId=${targetUserId.value}`)
    if (res.code === 200) {
      const isNewMessage = res.data.length > messageList.value.length
      messageList.value = res.data
      if (isNewMessage) scrollToBottom() // 只有来新消息才滚动到底部
      
      // 获取历史记录后，静默调用已读接口，消除红点
      request.post(`/message/read?targetId=${targetUserId.value}`).catch(()=>{})
    }
  } catch (e) {}
}

// 发送消息
const sendMessage = async () => {
  if (!inputText.value.trim()) return
  try {
    const res = await request.post('/message/send', {
      receiverId: targetUserId.value,
      content: inputText.value.trim()
    })
    if (res.code === 200) {
      inputText.value = ''
      fetchHistory() // 立刻刷新
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

<style scoped>
.chat-container {
  display: flex;
  height: 100%;
  border-top: 1px solid #ebeef5;
}
.session-sidebar {
  width: 200px;
  border-right: 1px solid #ebeef5;
  background: #fafafa;
  display: flex;
  flex-direction: column;
}
.session-header {
  padding: 15px;
  font-weight: bold;
  border-bottom: 1px solid #ebeef5;
  color: #606266;
}
.session-item {
  padding: 12px 15px;
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  transition: background 0.2s;
}
.session-item:hover {
  background: #f0f2f5;
}
.session-item.active {
  background: #ecf5ff;
  border-right: 3px solid #409EFF;
}
.uid-text {
  font-size: 14px;
  color: #303133;
}
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  background: #fff;
  height: 100%;
}
.empty-main {
  justify-content: center;
  align-items: center;
  background: #fafafa;
}
.msg-list {
  flex: 1;
  padding: 20px;
  background: #f5f7fa;
}
.msg-inner {
  display: flex;
  flex-direction: column;
  gap: 20px;
}
.msg-bubble-wrapper {
  display: flex;
  flex-direction: column;
  max-width: 80%;
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
  color: #909399;
  margin-bottom: 4px;
}
.msg-bubble {
  padding: 10px 15px;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.5;
  word-break: break-all;
}
.is-me .msg-bubble {
  background: #95ec69; /* 微信经典绿 */
  color: #333;
  border-top-right-radius: 2px;
}
.is-other .msg-bubble {
  background: #fff;
  color: #333;
  border: 1px solid #ebeef5;
  border-top-left-radius: 2px;
}
.chat-input-area {
  padding: 15px;
  border-top: 1px solid #ebeef5;
  background: #fff;
}
.send-action {
  text-align: right;
  margin-top: 10px;
}

/* 抽屉原生内边距清除，保证全屏填满 */
:deep(.el-drawer__body) {
  padding: 0;
  overflow: hidden;
}
</style>