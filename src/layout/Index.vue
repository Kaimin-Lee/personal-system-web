<template>
  <el-container class="layout-container">
    <div v-if="isMobile && !isCollapse" class="mobile-mask" @click="toggleSidebar"></div>

    <el-aside 
      :width="isMobile ? '220px' : (isCollapse ? '64px' : '220px')" 
      :class="['aside-menu', { 'is-mobile': isMobile, 'is-hidden': isMobile && isCollapse }]"
    >
      <div class="logo">
        <h2 v-show="isMobile || !isCollapse">专属控制台</h2>
        <h2 v-show="!isMobile && isCollapse">OS</h2>
      </div>
      <el-menu
        :default-active="route.path"
        class="el-menu-vertical"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        router
        :collapse="!isMobile && isCollapse"
        :collapse-transition="false"
        @select="handleMenuSelect"
      >
        <el-menu-item index="/dashboard">
          <el-icon><Odometer /></el-icon>
          <template #title><span>首页看板</span></template>
        </el-menu-item>
        
        <el-sub-menu index="/work">
          <template #title>
            <el-icon><Monitor /></el-icon>
            <span>工作 (Work)</span>
          </template>
          <el-menu-item index="/work/todo">项目进度看板</el-menu-item>
          <el-menu-item index="/work/shortcut">快捷导航</el-menu-item>
          <el-menu-item index="/work/geometry">几何计算器</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="/study">
          <template #title>
            <el-icon><Reading /></el-icon>
            <span>学习 (Study)</span>
          </template>
          <el-menu-item index="/study/note">学习笔记</el-menu-item>
        </el-sub-menu>

        <el-sub-menu index="/life">
          <template #title>
            <el-icon><Coffee /></el-icon>
            <span>生活 (Life)</span>
          </template>
          <el-menu-item index="/life/memo">备忘录</el-menu-item>
          <el-menu-item index="/life/ledger">记账本</el-menu-item>
          <el-menu-item index="/life/countdown">📅 倒数日</el-menu-item>
        </el-sub-menu>
      </el-menu>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-left">
          <el-icon class="hamburger" @click="toggleSidebar">
            <component :is="isCollapse ? 'Expand' : 'Fold'" />
          </el-icon>
        </div>
        
        <div class="header-right">
          <el-tooltip content="联系作者" placement="bottom">
            <el-badge :is-dot="hasUnread" class="contact-badge">
              <el-icon class="contact-icon" @click="openContactDrawer">
                <ChatLineRound />
              </el-icon>
            </el-badge>
          </el-tooltip>

          <el-dropdown @command="handleCommand">
            <span class="el-dropdown-link user-info">
              <el-avatar size="small" src="https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png" />
              <span class="username">指挥官</span>
              <el-icon class="el-icon--right"><arrow-down /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人中心</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>

      <el-main class="main-content">
        <router-view></router-view>
      </el-main>
    </el-container>
    
    <ContactAuthor ref="contactRef" />
  </el-container>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { Odometer, Monitor, Reading, Coffee, ArrowDown, Expand, Fold, ChatLineRound } from '@element-plus/icons-vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'
import ContactAuthor from '@/components/ContactAuthor.vue' 

const router = useRouter()
const route = useRoute()
const isCollapse = ref(false)
const isMobile = ref(false)
const hasUnread = ref(false)
let unreadTimer = null

const checkUnread = async () => {
  try {
    const res = await request.get('/message/unread')
    if (res.code === 200) hasUnread.value = res.data
  } catch (error) {}
}

const checkMobile = () => {
  isMobile.value = window.innerWidth <= 768
  isCollapse.value = isMobile.value
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  checkUnread()
  unreadTimer = setInterval(checkUnread, 3000)
})

onUnmounted(() => {
  window.removeEventListener('resize', checkMobile)
  if (unreadTimer) clearInterval(unreadTimer)
})

const toggleSidebar = () => isCollapse.value = !isCollapse.value
const handleMenuSelect = () => { if (isMobile.value) isCollapse.value = true }

const contactRef = ref(null)
const openContactDrawer = () => {
  if (contactRef.value) {
    contactRef.value.open()
    hasUnread.value = false 
  }
}

const handleCommand = (command) => {
  if (command === 'logout') {
    localStorage.removeItem('token')
    ElMessage.success('已安全退出')
    router.push('/login')
  }
}
</script>

<style scoped>
.layout-container { height: 100vh; overflow: hidden; }
.aside-menu {
  background-color: #304156; color: white;
  transition: width 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), transform 0.3s ease;
  overflow-x: hidden; display: flex; flex-direction: column;
}
.aside-menu.is-mobile {
  position: fixed; top: 0; left: 0; height: 100vh; z-index: 1000;
  box-shadow: 2px 0 8px rgba(0,0,0,0.15);
}
.aside-menu.is-mobile.is-hidden { transform: translateX(-100%); }
.mobile-mask {
  position: fixed; top: 0; left: 0; width: 100vw; height: 100vh;
  background: rgba(0, 0, 0, 0.5); z-index: 999; backdrop-filter: blur(2px);
}
.logo { height: 60px; line-height: 60px; text-align: center; border-bottom: 1px solid #1f2d3d; overflow: hidden; white-space: nowrap; }
.logo h2 { margin: 0; color: #fff; font-size: 18px; }
.el-menu-vertical { border-right: none; flex: 1; }
.header { background-color: #fff; border-bottom: 1px solid #e6e6e6; display: flex; justify-content: space-between; align-items: center; padding: 0 20px; }
.header-left { display: flex; align-items: center; }
.hamburger { font-size: 22px; cursor: pointer; color: #606266; transition: color 0.3s; }
.hamburger:hover { color: #409EFF; }
.header-right { display: flex; align-items: center; }
.contact-badge { margin-right: 28px; display: flex; align-items: center; }
.contact-icon { font-size: 22px; color: #606266; cursor: pointer; transition: color 0.3s, transform 0.2s; }
.contact-icon:hover { color: #409EFF; transform: scale(1.1); }
.user-info { display: flex; align-items: center; cursor: pointer; color: #606266; outline: none; }
.username { margin-left: 8px; margin-right: 4px; }
.main-content { background-color: #f0f2f5; padding: 20px; overflow-y: auto; -webkit-overflow-scrolling: touch; }

/* 移动端深度适配 */
@media screen and (max-width: 768px) {
  .main-content { padding: 10px; }
  .header { padding: 0 15px; }
  .contact-badge { margin-right: 15px; }
}
@media screen and (max-width: 480px) {
  .username { display: none; } /* 屏幕过小时隐藏名字，防止挤压 */
}
</style>