<template>
  <div class="countdown-container">
    <div class="header-section">
      <h2 class="page-title">重要日子 · 倒数</h2>
      <el-button type="primary" icon="Plus" @click="handleAdd">记录新日子</el-button>
    </div>

    <el-row :gutter="20" class="countdown-grid">
      <el-col :xs="24" :sm="12" :md="8" :lg="6" v-for="item in list" :key="item.id">
        <el-card :class="['countdown-card', { 'is-pinned': item.isPinned }]" shadow="hover">
          <div class="card-top">
            <el-tag v-if="item.isPinned" size="small" type="warning" effect="dark">置顶</el-tag>
            <div class="actions">
              <el-icon @click="handleEdit(item)"><Edit /></el-icon>
              <el-icon class="del-btn" @click="handleDelete(item.id)"><Delete /></el-icon>
            </div>
          </div>
          
          <div class="event-info">
            <div class="event-name">{{ item.eventName }}</div>
            <div class="days-count">
              <span class="number">{{ calculateDays(item.targetDate) }}</span>
              <span class="unit">天</span>
            </div>
            <div class="target-date">目标日：{{ item.targetDate }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="dialogVisible" :title="form.id ? '修改日子' : '新增日子'" width="400px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="事件名称">
          <el-input v-model="form.eventName" placeholder="例如：考公、女朋友生日" />
        </el-form-item>
        <el-form-item label="目标日期">
          <el-date-picker v-model="form.targetDate" type="date" value-format="YYYY-MM-DD" style="width: 100%" />
        </el-form-item>
        <el-form-item label="是否置顶">
          <el-switch v-model="form.isPinned" :active-value="1" :inactive-value="0" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { Edit, Delete, Plus } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'

const list = ref([])
const dialogVisible = ref(false)
const form = ref({ eventName: '', targetDate: '', isPinned: 0 })

const calculateDays = (date) => {
  const diff = new Date(date) - new Date().setHours(0,0,0,0)
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

const fetchData = async () => {
  const res = await request.get('/countdown/list')
  if (res.code === 200) list.value = res.data
}

const handleAdd = () => {
  form.value = { eventName: '', targetDate: '', isPinned: 0 }
  dialogVisible.value = true
}

const handleEdit = (row) => {
  form.value = { ...row }
  dialogVisible.value = true
}

const submit = async () => {
  const method = form.value.id ? 'put' : 'post'
  const url = form.value.id ? '/countdown/update' : '/countdown/add'
  const res = await request[method](url, form.value)
  if (res.code === 200) {
    ElMessage.success('操作成功')
    dialogVisible.value = false
    fetchData()
  }
}

const handleDelete = (id) => {
  ElMessageBox.confirm('确定删除吗？').then(async () => {
    const res = await request.delete(`/countdown/delete/${id}`)
    if (res.code === 200) { fetchData(); ElMessage.success('已删除') }
  })
}

onMounted(fetchData)
</script>

<style scoped>
.countdown-container { padding: 20px; }
.header-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
.countdown-card { 
  border-radius: 12px; margin-bottom: 20px; border: none;
  background: linear-gradient(135deg, #ffffff 0%, #f9fafb 100%);
  transition: transform 0.3s;
}
.countdown-card:hover { transform: translateY(-5px); }
.is-pinned { border-top: 4px solid #E6A23C; }

.card-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; }
.actions { display: flex; gap: 10px; color: #909399; cursor: pointer; }
.actions .el-icon:hover { color: #409EFF; }
.actions .del-btn:hover { color: #f56c6c; }

.event-info { text-align: center; }
.event-name { font-size: 16px; color: #606266; margin-bottom: 10px; }
.days-count { margin-bottom: 10px; }
.days-count .number { font-size: 48px; font-weight: bold; color: #303133; }
.days-count .unit { margin-left: 5px; color: #909399; }
.target-date { font-size: 12px; color: #C0C4CC; }
</style>