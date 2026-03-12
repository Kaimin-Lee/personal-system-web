<template>
  <div class="kanban-container">
    <div class="header-action">
      <h2>项目进度看板</h2>
      <el-button type="primary" icon="Plus" @click="openAddDialog">新建任务</el-button>
    </div>

    <el-row :gutter="20" class="board-row">
      <el-col :span="8">
        <el-card class="board-column todo-col">
          <template #header><div class="col-title">📌 待办 (To Do) - {{ todoList.length }}</div></template>
          <draggable v-model="todoList" group="tasks" item-key="id" class="drag-area" @change="handleDragChange($event, 0)">
            <template #item="{ element }">
              <div class="task-card">
                <div class="card-actions">
                  <el-icon @click.stop="openEditDialog(element)" class="action-icon"><Edit /></el-icon>
                  <el-icon @click.stop="handleDelete(element.id)" class="action-icon text-danger"><Delete /></el-icon>
                </div>
                <div class="task-title">{{ element.title }}</div>
                <div class="task-desc" v-if="element.description">{{ element.description }}</div>
                
                <div class="task-meta">
                  <el-tag size="small" :type="getPriorityType(element.priority)">{{ getPriorityText(element.priority) }}</el-tag>
                  <span v-if="element.deadline" class="due-date" :class="getDeadlineClass(element.deadline)">
                    <el-icon><Calendar /></el-icon> {{ formatDeadline(element.deadline) }}
                  </span>
                </div>
              </div>
            </template>
          </draggable>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="board-column doing-col">
          <template #header><div class="col-title">🚀 进行中 (Doing) - {{ doingList.length }}</div></template>
          <draggable v-model="doingList" group="tasks" item-key="id" class="drag-area" @change="handleDragChange($event, 1)">
            <template #item="{ element }">
              <div class="task-card">
                <div class="card-actions">
                  <el-icon @click.stop="openEditDialog(element)" class="action-icon"><Edit /></el-icon>
                  <el-icon @click.stop="handleDelete(element.id)" class="action-icon text-danger"><Delete /></el-icon>
                </div>
                <div class="task-title">{{ element.title }}</div>
                <div class="task-desc" v-if="element.description">{{ element.description }}</div>
                <div class="task-meta">
                  <el-tag size="small" :type="getPriorityType(element.priority)">{{ getPriorityText(element.priority) }}</el-tag>
                  <span v-if="element.deadline" class="due-date" :class="getDeadlineClass(element.deadline)">
                    <el-icon><Calendar /></el-icon> {{ formatDeadline(element.deadline) }}
                  </span>
                </div>
              </div>
            </template>
          </draggable>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="board-column done-col">
          <template #header><div class="col-title">✅ 已完成 (Done) - {{ doneList.length }}</div></template>
          <draggable v-model="doneList" group="tasks" item-key="id" class="drag-area" @change="handleDragChange($event, 2)">
            <template #item="{ element }">
              <div class="task-card done-card">
                <div class="card-actions">
                  <el-icon @click.stop="handleDelete(element.id)" class="action-icon text-danger"><Delete /></el-icon>
                </div>
                <div class="task-title">{{ element.title }}</div>
                <div class="task-meta">
                   <span v-if="element.deadline" class="due-date text-secondary">
                    <el-icon><Calendar /></el-icon> {{ formatDeadline(element.deadline) }}
                  </span>
                </div>
              </div>
            </template>
          </draggable>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="dialogVisible" :title="taskForm.id ? '编辑任务' : '新建任务'" width="30%">
      <el-form :model="taskForm" label-width="80px">
        <el-form-item label="任务名称">
          <el-input v-model="taskForm.title" placeholder="一句话描述任务" />
        </el-form-item>
        <el-form-item label="任务详情">
          <el-input v-model="taskForm.description" type="textarea" placeholder="补充更多细节..." />
        </el-form-item>
        
        <el-form-item label="截止日期">
          <el-date-picker
            v-model="taskForm.deadline"
            type="datetime"
            placeholder="选填：设置截止时间"
            value-format="YYYY-MM-DD HH:mm:ss"
            style="width: 100%"
            clearable
          />
        </el-form-item>

        <el-form-item label="优先级">
          <el-radio-group v-model="taskForm.priority">
            <el-radio :label="0">低</el-radio>
            <el-radio :label="1">中</el-radio>
            <el-radio :label="2">高</el-radio>
          </el-radio-group>
        </el-form-item>
      </el-form>
      <template #footer>
        <span class="dialog-footer">
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitTask">确定</el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import draggable from 'vuedraggable'
import request from '@/utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Edit, Delete, Plus, Calendar } from '@element-plus/icons-vue'

const todoList = ref([])
const doingList = ref([])
const doneList = ref([])

const dialogVisible = ref(false)
// 【精准对接】：初始化表单时带上 deadline
const taskForm = ref({ title: '', description: '', priority: 1, deadline: null })

const getPriorityText = (val) => val === 2 ? '高优' : val === 1 ? '中优' : '低优'
const getPriorityType = (val) => val === 2 ? 'danger' : val === 1 ? 'warning' : 'info'

// 【优化】：处理 LocalDateTime 可能传过来的 'T' (如 2026-03-12T14:00:00)
const formatDeadline = (dateStr) => {
  if (!dateStr) return ''
  // 将 T 替换为空格，然后截取月日和时分 (03-12 14:00)
  return dateStr.replace('T', ' ').substring(5, 16) 
}

// 【优化】：智能判断截止日期状态
const getDeadlineClass = (dateStr) => {
  if (!dateStr) return ''
  const now = new Date().getTime()
  // 同样兼容带 T 的格式
  const due = new Date(dateStr.replace('T', ' ')).getTime()
  
  if (due < now) return 'text-danger fw-bold' // 已延期：红色加粗
  if (due - now < 1000 * 60 * 60 * 24) return 'text-warning fw-bold' // 24小时内：橙色预警
  return 'text-secondary' // 安全期：常规灰色
}

const fetchTasks = async () => {
  const res = await request.get('/task/list')
  if (res.code === 200) {
    todoList.value = []
    doingList.value = []
    doneList.value = []
    res.data.forEach(task => {
      if (task.status === 0) todoList.value.push(task)
      else if (task.status === 1) doingList.value.push(task)
      else if (task.status === 2) doneList.value.push(task)
    })
  }
}

const openAddDialog = () => {
  taskForm.value = { title: '', description: '', priority: 1, deadline: null } 
  dialogVisible.value = true
}

const openEditDialog = (task) => {
  taskForm.value = { ...task } 
  dialogVisible.value = true
}

const submitTask = async () => {
  if (!taskForm.value.title) {
    ElMessage.warning('任务名称不能为空')
    return
  }
  
  const isEdit = !!taskForm.value.id
  const url = isEdit ? '/task/update' : '/task/add'
  const method = isEdit ? 'put' : 'post'

  const res = await request[method](url, taskForm.value)
  
  if (res.code === 200) {
    ElMessage.success(isEdit ? '修改成功' : '添加成功')
    dialogVisible.value = false
    fetchTasks()
  } else {
    ElMessage.error(res.message)
  }
}

const handleDelete = (id) => {
  ElMessageBox.confirm('确定要永久删除这个任务吗?', '警告', {
    confirmButtonText: '确定删除',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(async () => {
    const res = await request.delete(`/task/delete/${id}`)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      fetchTasks()
    } else {
      ElMessage.error(res.message)
    }
  }).catch(() => {})
}

const handleDragChange = async (event, newStatus) => {
  if (event.added) {
    const task = event.added.element
    const res = await request.put('/task/updateStatus', { id: task.id, status: newStatus })
    if (res.code !== 200) {
      ElMessage.error('更新失败，请刷新重试')
      fetchTasks() 
    }
  }
}

onMounted(() => fetchTasks())
</script>

<style scoped>
.kanban-container { height: calc(100vh - 100px); display: flex; flex-direction: column; }
.header-action { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
.board-row { flex: 1; overflow: hidden; }
.board-column { height: 100%; background-color: #f4f5f7; border: none; display: flex; flex-direction: column; }
:deep(.el-card__body) { flex: 1; padding: 10px; overflow-y: auto; }
.col-title { font-weight: bold; color: #172b4d; }
.drag-area { min-height: 400px; height: 100%; }

.task-card { 
  background: white; padding: 15px; margin-bottom: 10px; 
  border-radius: 6px; box-shadow: 0 1px 3px rgba(0,0,0,0.12); 
  cursor: grab; transition: box-shadow 0.2s; position: relative; 
}
.task-card:active { cursor: grabbing; }
.task-card:hover { box-shadow: 0 4px 8px rgba(0,0,0,0.1); }
.task-title { font-weight: bold; color: #333; margin-bottom: 8px; padding-right: 40px;}
.task-desc { font-size: 13px; color: #666; margin-bottom: 0px; }

/* 卡片底部元数据区 */
.task-meta { display: flex; align-items: center; gap: 12px; margin-top: 12px; }
.due-date { font-size: 12px; display: flex; align-items: center; gap: 4px; }
.fw-bold { font-weight: bold; }
.text-danger { color: #F56C6C !important; }
.text-warning { color: #E6A23C !important; }
.text-secondary { color: #909399; }

.card-actions { position: absolute; right: 10px; top: 15px; display: none; gap: 8px; }
.task-card:hover .card-actions { display: flex; }
.action-icon { cursor: pointer; color: #909399; transition: color 0.2s; font-size: 16px;}
.action-icon:hover { color: #409EFF; }
.text-danger:hover { color: #F56C6C; }

.done-card { opacity: 0.6; }
.done-card .task-title { text-decoration: line-through; }
</style>