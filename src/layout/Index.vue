<template>
  <el-container class="layout-container">
    <div v-if="isMobile && !isCollapse" class="mobile-mask" @click="toggleSidebar"></div>

    <el-aside 
      :width="isMobile ? '220px' : (isCollapse ? '64px' : '220px')" 
      :class="['aside-menu', { 'is-mobile': isMobile, 'is-hidden': isMobile && isCollapse }]"
    >
      <div class="logo">
        <h2 v-show="isMobile || !isCollapse" class="glow-text">专属控制台</h2>
        <h2 v-show="!isMobile && isCollapse" class="glow-text">OS</h2>
      </div>
      
      <div class="menu-wrapper">
        <el-menu
          :default-active="route.path"
          class="el-menu-vertical"
          background-color="transparent"
          text-color="#bfcbd9"
          active-text-color="#00f3ff"
          router
          :collapse="!isMobile && isCollapse"
          :collapse-transition="false"
          @select="handleMenuSelect"
        >
          <el-menu-item index="/dashboard"><el-icon><Odometer /></el-icon><template #title><span>首页看板</span></template></el-menu-item>
          <el-sub-menu index="/work"><template #title><el-icon><Monitor /></el-icon><span>工作 (Work)</span></template><el-menu-item index="/work/todo">项目进度看板</el-menu-item><el-menu-item index="/work/shortcut">快捷导航</el-menu-item><el-menu-item index="/work/geometry">几何计算器</el-menu-item></el-sub-menu>
          <el-sub-menu index="/study"><template #title><el-icon><Reading /></el-icon><span>学习 (Study)</span></template><el-menu-item index="/study/note">学习笔记</el-menu-item></el-sub-menu>
          <el-sub-menu index="/life"><template #title><el-icon><Coffee /></el-icon><span>生活 (Life)</span></template><el-menu-item index="/life/memo">备忘录</el-menu-item><el-menu-item index="/life/ledger">记账本</el-menu-item><el-menu-item index="/life/countdown">📅 倒数日</el-menu-item></el-sub-menu>
        </el-menu>
      </div>
    </el-aside>

    <el-container>
      <el-header class="header">
        <div class="header-left"><el-icon class="hamburger" @click="toggleSidebar"><component :is="isCollapse ? Expand : Fold" /></el-icon></div>
        <div class="header-right">
          <el-tooltip content="联系作者" placement="bottom">
            <el-badge :is-dot="hasUnread" class="contact-badge"><el-icon class="contact-icon" @click="openContactDrawer"><ChatLineRound /></el-icon></el-badge>
          </el-tooltip>
          <el-dropdown @command="handleCommand">
            <span class="el-dropdown-link user-info"><el-avatar size="small" src="https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png" /><span class="username">指挥官</span><el-icon class="el-icon--right"><ArrowDown /></el-icon></span>
            <template #dropdown><el-dropdown-menu><el-dropdown-item command="profile">个人中心</el-dropdown-item><el-dropdown-item command="logout" divided>退出登录</el-dropdown-item></el-dropdown-menu></template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main class="main-content"><router-view></router-view></el-main>
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

const router = useRouter(); const route = useRoute()
const isCollapse = ref(false); const isMobile = ref(false); const hasUnread = ref(false); let unreadTimer = null
const checkUnread = async () => { try { const res = await request.get('/message/unread'); if (res.code === 200) hasUnread.value = res.data } catch (error) {} }
const checkMobile = () => { isMobile.value = window.innerWidth <= 768; if (isMobile.value) isCollapse.value = true; else isCollapse.value = false }
onMounted(() => { checkMobile(); window.addEventListener('resize', checkMobile); checkUnread(); unreadTimer = setInterval(checkUnread, 3000) })
onUnmounted(() => { window.removeEventListener('resize', checkMobile); if (unreadTimer) clearInterval(unreadTimer) })
const toggleSidebar = () => { isCollapse.value = !isCollapse.value }
const handleMenuSelect = () => { if (isMobile.value) isCollapse.value = true }
const contactRef = ref(null)
const openContactDrawer = () => { if (contactRef.value) { contactRef.value.open(); hasUnread.value = false } }
const handleCommand = (command) => { if (command === 'logout') { localStorage.removeItem('token'); ElMessage.success('已安全退出'); router.push('/login') } }
</script>

<style scoped>
.layout-container { height: 100vh; overflow: hidden; background-color: transparent; }

/* 极致毛玻璃侧边栏 */
.aside-menu {
  background: rgba(5, 10, 20, 0.7); 
  backdrop-filter: blur(15px);
  border-right: 1px solid rgba(0, 243, 255, 0.15);
  color: white;
  transition: width 0.3s cubic-bezier(0.25, 0.8, 0.25, 1), transform 0.3s ease;
  overflow-x: hidden; display: flex; flex-direction: column;
}

.menu-wrapper { flex: 1; overflow-y: auto; overflow-x: hidden; }
.menu-wrapper::-webkit-scrollbar { width: 4px; }
.menu-wrapper::-webkit-scrollbar-thumb { background: rgba(0, 243, 255, 0.2); border-radius: 2px; }

:deep(.el-menu) { border-right: none; }
:deep(.el-sub-menu__title:hover), :deep(.el-menu-item:hover) { background-color: rgba(0, 243, 255, 0.1) !important; }
/* 激活态霓虹特效 */
:deep(.el-menu-item.is-active) { 
  background: linear-gradient(90deg, rgba(0, 243, 255, 0.15) 0%, transparent 100%) !important;
  border-left: 3px solid #00f3ff;
  text-shadow: 0 0 10px rgba(0, 243, 255, 0.8);
}

.aside-menu.is-mobile { position: fixed; top: 0; left: 0; height: 100vh; z-index: 1000; box-shadow: 2px 0 15px rgba(0,243,255,0.2); }
.aside-menu.is-mobile.is-hidden { transform: translateX(-100%); }
.mobile-mask { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(0, 0, 0, 0.7); z-index: 999; backdrop-filter: blur(3px); }

.logo { height: 60px; line-height: 60px; text-align: center; border-bottom: 1px solid rgba(0, 243, 255, 0.15); overflow: hidden; white-space: nowrap; }
.glow-text { margin: 0; color: #fff; font-size: 18px; text-shadow: 0 0 8px #00f3ff; }

/* 顶栏毛玻璃 */
.header {
  background: rgba(5, 10, 20, 0.5);
  backdrop-filter: blur(15px);
  border-bottom: 1px solid rgba(0, 243, 255, 0.15);
  display: flex; justify-content: space-between; align-items: center; padding: 0 20px;
}
.header-left { display: flex; align-items: center; }
.hamburger { font-size: 22px; cursor: pointer; color: #e2e8f0; transition: color 0.3s; text-shadow: 0 0 5px rgba(0, 243, 255, 0); }
.hamburger:hover { color: #00f3ff; text-shadow: 0 0 8px #00f3ff; }

.header-right { display: flex; align-items: center; }
.contact-badge { margin-right: 28px; display: flex; align-items: center; }
.contact-icon { font-size: 22px; color: #e2e8f0; cursor: pointer; transition: all 0.3s; }
.contact-icon:hover { color: #00f3ff; transform: scale(1.1); filter: drop-shadow(0 0 5px #00f3ff); }
.user-info { display: flex; align-items: center; cursor: pointer; color: #e2e8f0; outline: none; }
.username { margin-left: 8px; margin-right: 4px; }
.main-content { padding: 20px; overflow-y: auto; -webkit-overflow-scrolling: touch; }

@media screen and (max-width: 768px) {
  .main-content { padding: 10px; }
  .header { padding: 0 15px; }
  .contact-badge { margin-right: 15px; }
}
@media screen and (max-width: 480px) { .username { display: none; } }
</style>