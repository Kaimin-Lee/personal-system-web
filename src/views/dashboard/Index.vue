<template>
  <div class="dashboard-container">
    <h2 class="welcome-text">欢迎回来，今天想专注点什么？</h2>
    
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card shadow="hover" class="box-card">
          <template #header>
            <div class="card-header">
              <span class="title"><el-icon><Monitor /></el-icon> 当前核心任务</span>
            </div>
          </template>
          <div class="card-content" v-loading="loading">
            <el-empty v-if="tasks.length === 0" description="暂无进行中的任务" :image-size="60" />
            
            <div class="project-item" v-for="task in tasks" :key="task.id">
              <span class="project-name">{{ task.title }}</span>
              <el-tag size="small" :type="task.priority === 2 ? 'danger' : 'primary'">
                {{ task.priority === 2 ? '高优' : '进行中' }}
              </el-tag>
            </div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="12">
        <el-card shadow="hover" class="box-card">
          <template #header>
            <div class="card-header">
              <span class="title"><el-icon><Timer /></el-icon> 重要倒数日</span>
            </div>
          </template>
          <div class="card-content countdown-content" v-loading="loading">
            <el-empty v-if="countdowns.length === 0" description="暂无倒数日" :image-size="60" />

            <div class="countdown-item" v-for="item in countdowns" :key="item.id">
              <span class="event-name">{{ item.eventName }}</span>
              <div class="days-left">
                还有 <span class="highlight">{{ calculateDaysLeft(item.targetDate) }}</span> 天
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Monitor, Timer } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request' // 确保你的路径正确

const loading = ref(true)
const tasks = ref([])
const countdowns = ref([])

// 计算距离目标日期还剩多少天
const calculateDaysLeft = (targetDateStr) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0) // 把今天的时间归零，只算整天
  const targetDate = new Date(targetDateStr)
  
  const diffTime = targetDate - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays > 0 ? diffDays : 0
}

// 核心：请求后端真实数据
const fetchDashboardData = async () => {
  try {
    const res = await request.get('/api/dashboard/data')
    if (res.code === 200) {
      tasks.value = res.data.tasks
      countdowns.value = res.data.countdowns
    } else {
      ElMessage.error(res.message)
    }
  } catch (error) {
    console.error('获取看板数据失败', error)
  } finally {
    loading.value = false
  }
}

// 组件挂载时自动触发请求
onMounted(() => {
  fetchDashboardData()
})
</script>

<style scoped>
/* 保持你之前的样式不变 */
.dashboard-container { padding: 10px; }
.welcome-text { color: #303133; margin-bottom: 24px; font-weight: 500; }
.card-header { display: flex; align-items: center; }
.card-header .title { display: flex; align-items: center; gap: 8px; font-weight: bold; font-size: 16px; }
.card-content { min-height: 120px; }
.project-item { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding: 10px; background-color: #f8f9fa; border-radius: 4px;}
.project-name { font-weight: bold; color: #606266; }
.countdown-content { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px;}
.countdown-item { text-align: center; }
.event-name { font-size: 16px; color: #909399; display: block; margin-bottom: 10px; }
.days-left { font-size: 18px; color: #303133; }
.highlight { font-size: 32px; color: #f56c6c; font-weight: bold; margin: 0 5px; }
</style>