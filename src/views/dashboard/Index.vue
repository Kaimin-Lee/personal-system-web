<template>
  <div class="dashboard-container">
    <h2 class="welcome-text">欢迎回来，今天想专注点什么？</h2>
    
    <el-row :gutter="20">
      <el-col :span="12">
        <el-card shadow="hover" class="box-card">
          <template #header>
            <div class="card-header">
              <span class="title"><el-icon><Monitor /></el-icon> 核心任务 (Top 5)</span>
              
              <div class="sort-controls">
                <el-select v-model="sortBy" size="small" style="width: 100px" @change="fetchDashboardData">
                  <el-option label="按优先级" value="priority" />
                  <el-option label="按截止日" value="deadline" />
                </el-select>
                
                <el-select v-model="sortOrder" size="small" style="width: 70px" @change="fetchDashboardData">
                  <el-option label="降序" value="desc" />
                  <el-option label="升序" value="asc" />
                </el-select>
              </div>
            </div>
          </template>
          
          <div class="card-content" v-loading="loading">
            <el-empty v-if="tasks.length === 0" description="暂无核心任务" :image-size="60" />
            
            <div 
              v-for="task in tasks" 
              :key="task.id" 
              class="project-item"
              :class="'priority-' + task.priority"
            >
              <div class="task-main">
                <span class="project-name">{{ task.title }}</span>
                <span class="task-status">
                  {{ task.status === 1 ? '🚀 进行中' : '📌 待办' }}
                  <span v-if="task.deadline" class="dashboard-deadline" :class="getDeadlineClass(task.deadline)">
                    | <el-icon><Calendar /></el-icon> {{ formatDeadline(task.deadline) }}
                  </span>
                </span>
              </div>
              <el-tag size="small" :type="getPriorityType(task.priority)" effect="dark">
                {{ getPriorityText(task.priority) }}
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
import { Monitor, Timer, Calendar } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import request from '@/utils/request'

const loading = ref(true)
const tasks = ref([])
const countdowns = ref([])

// 【新增】：排序状态响应式变量
const sortBy = ref('priority') // 默认按优先级
const sortOrder = ref('desc')  // 默认降序

const getPriorityText = (val) => val === 2 ? '高优' : val === 1 ? '中优' : '低优'
const getPriorityType = (val) => val === 2 ? 'danger' : val === 1 ? 'warning' : 'info'

const formatDeadline = (dateStr) => {
  if (!dateStr) return ''
  return dateStr.replace('T', ' ').substring(5, 16) 
}

const getDeadlineClass = (dateStr) => {
  if (!dateStr) return ''
  const now = new Date().getTime()
  const due = new Date(dateStr.replace('T', ' ')).getTime()
  if (due < now) return 'text-danger fw-bold' 
  if (due - now < 1000 * 60 * 60 * 24) return 'text-warning fw-bold' 
  return 'text-secondary' 
}

const calculateDaysLeft = (targetDateStr) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const targetDate = new Date(targetDateStr)
  const diffTime = targetDate - today
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  return diffDays > 0 ? diffDays : 0
}

const fetchDashboardData = async () => {
  loading.value = true
  try {
    // 【核心变化】：将排序参数通过 params 拼接到 URL 后面发出请求
    const res = await request.get('/dashboard/data', {
      params: {
        sortBy: sortBy.value,
        sortOrder: sortOrder.value
      }
    })
    
    if (res.code === 200) {
      tasks.value = res.data.tasks || []
      countdowns.value = res.data.countdowns || []
    } else {
      ElMessage.error(res.message)
    }
  } catch (error) {
    console.error('获取看板数据失败', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchDashboardData()
})
</script>

<style scoped>
.dashboard-container { padding: 10px; }
.welcome-text { color: #303133; margin-bottom: 24px; font-weight: 500; }

/* 头部左右布局：左边标题，右边排序控件 */
.card-header { display: flex; justify-content: space-between; align-items: center; width: 100%;}
.card-header .title { display: flex; align-items: center; gap: 8px; font-weight: bold; font-size: 16px; }
.sort-controls { display: flex; gap: 8px; align-items: center;}

.card-content { min-height: 120px; }

.project-item { 
  display: flex; justify-content: space-between; align-items: center; 
  margin-bottom: 12px; padding: 12px 15px; 
  background-color: #f8f9fa; border-radius: 6px;
  border-left: 4px solid transparent; transition: all 0.3s ease;
}
.project-item:hover {
  background-color: #ffffff; box-shadow: 0 4px 12px rgba(0,0,0,0.08); transform: translateY(-2px);
}
.task-main { display: flex; flex-direction: column; gap: 4px; }
.project-name { font-weight: bold; color: #303133; font-size: 14px;}
.task-status { font-size: 12px; color: #909399; }

/* Dashboard 卡片内的微缩时间样式 */
.dashboard-deadline { margin-left: 5px; }
.fw-bold { font-weight: bold; }
.text-danger { color: #F56C6C !important; }
.text-warning { color: #E6A23C !important; }
.text-secondary { color: #909399; }

.priority-2 { border-left-color: #F56C6C; background-color: #fef0f0; } 
.priority-1 { border-left-color: #E6A23C; background-color: #fdf6ec; } 
.priority-0 { border-left-color: #909399; } 

.countdown-content { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px;}
.countdown-item { text-align: center; }
.event-name { font-size: 16px; color: #909399; display: block; margin-bottom: 10px; }
.days-left { font-size: 18px; color: #303133; }
.highlight { font-size: 32px; color: #f56c6c; font-weight: bold; margin: 0 5px; }
</style>