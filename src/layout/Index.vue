<template>
  <el-container class="layout-container">
    <el-aside width="220px" class="aside-menu">
      <div class="logo">
        <h2>专属控制台</h2>
      </div>
      <el-menu
        default-active="/dashboard"
        class="el-menu-vertical"
        background-color="#304156"
        text-color="#bfcbd9"
        active-text-color="#409EFF"
        router
      >
        <el-menu-item index="/dashboard">
          <el-icon><Odometer /></el-icon>
          <span>首页看板</span>
        </el-menu-item>
        
        <el-sub-menu index="/work">
          <template #title>
            <el-icon><Monitor /></el-icon>
            <span>工作 (Work)</span>
          </template>
          <el-menu-item index="/work/todo">待办与看板</el-menu-item>
          <el-menu-item index="/work/shortcut">快捷导航</el-menu-item>
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
          </div>
        <div class="header-right">
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
  </el-container>
</template>

<script setup>
import { Odometer, Monitor, Reading, Coffee, ArrowDown } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'

const router = useRouter()

const handleCommand = (command) => {
  if (command === 'logout') {
    localStorage.removeItem('token')
    ElMessage.success('已安全退出')
    router.push('/login')
  }
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}
.aside-menu {
  background-color: #304156;
  color: white;
  transition: width 0.3s;
}
.logo {
  height: 60px;
  line-height: 60px;
  text-align: center;
  border-bottom: 1px solid #1f2d3d;
}
.logo h2 {
  margin: 0;
  color: #fff;
  font-size: 18px;
}
.el-menu-vertical {
  border-right: none;
}
.header {
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}
.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
  color: #606266;
}
.username {
  margin-left: 8px;
  margin-right: 4px;
}
.main-content {
  background-color: #f0f2f5;
  padding: 20px;
}
</style>