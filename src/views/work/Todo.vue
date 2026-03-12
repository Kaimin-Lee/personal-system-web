<template>
  <div class="kanban-container">
    <div class="header-action">
      <h2>项目进度看板</h2>
      <el-button type="primary" icon="Plus" @click="dialogVisible = true">新建任务</el-button>
    </div>

    <el-row :gutter="20" class="board-row">
      <el-col :span="8">
        <el-card class="board-column todo-col">
          <template #header><div class="col-title">📌 待办 (To Do) - {{ todoList.length }}</div></template>
          <draggable 
            v-model="todoList" 
            group="tasks" 
            item-key="id" 
            class="drag-area"
            @change="handleDragChange($event, 0)"
          >
            <template #item="{ element }">
              <div class="task-card">
                <div class="task-title">{{ element.title }}</div>
                <div class="task-desc" v-if="element.description">{{ element.description }}</div>
                <el-tag size="small" :type="getPriorityType(element.priority)" class="priority-tag">
                  {{ getPriorityText(element.priority) }}
                </el-tag>
              </div>
            </template>
          </draggable>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="board-column doing-col">
          <template #header><div class="col-title">🚀 进行中 (Doing) - {{ doingList.length }}</div></template>
          <draggable 
            v-model="doingList" 
            group="tasks" 
            item-key="id" 
            class="drag-area"
            @change="handleDragChange($event, 1)"
          >
            <template #item="{ element }">
              <div class="task-card">
                <div class="task-title">{{ element.title }}</div>
                <div class="task-desc" v-if="element.description">{{ element.description }}</div>
              </div>
            </template>
          </draggable>
        </el-card>
      </el-col>

      <el-col :span="8">
        <el-card class="board-column done-col">
          <template #header><div class="col-title">✅ 已完成 (Done) - {{ doneList.length }}</div></template>
          <draggable 
            v-model="doneList" 
            group="tasks" 
            item-key="id" 
            class="drag-area"
            @change="handleDragChange($event, 2)"
          >
            <template #item="{ element }">
              <div class="task-card done-card">
                <div class="task-title">{{ element.title }}</div>
              </div>
            </template>
          </draggable>
        </el-card>
      </el-col>
    </el-row>

    <el-dialog v-model="dialogVisible" title="新建任务" width="30%">
      <el-form :model="taskForm" label-width="80px">
        <el-form-item label="任务名称">
          <el-input v-model="taskForm.title" placeholder="一句话描述任务" />
        </el-form-item>
        <el-form-item label="任务详情">
          <el-input v-model="taskForm.description" type="textarea" placeholder="补充更多细节..." />
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
import { ElMessage } from 'element-plus'

const todoList = ref([])
const doingList = ref([])
const doneList = ref([])

const dialogVisible = ref(false)
const taskForm = ref({ title: '', description: '', priority: 1 })

// 辅助函数：优先级渲染
const getPriorityText = (val) => {
  return val === 2 ? '高优先级' : val === 1 ? '中优先级' : '低优先级'
}
const getPriorityType = (val) => {
  return val === 2 ? 'danger' : val === 1 ? 'warning' : 'info'
}

// 1. 获取所有任务并分类
const fetchTasks = async () => {
  const res = await request.get('/api/task/list')
  if (res.code === 200) {
    // 每次获取数据前先清空
    todoList.value = []
    doingList.value = []
    doneList.value = []
    
    // 根据 status 分类分配到三个数组中
    res.data.forEach(task => {
      if (task.status === 0) todoList.value.push(task)
      else if (task.status === 1) doingList.value.push(task)
      else if (task.status === 2) doneList.value.push(task)
    })
  }
}

// 2. 提交新任务
const submitTask = async () => {
  if (!taskForm.value.title) {
    ElMessage.warning('任务名称不能为空')
    return
  }
  const res = await request.post('/api/task/add', taskForm.value)
  if (res.code === 200) {
    ElMessage.success('添加成功')
    dialogVisible.value = false
    taskForm.value = { title: '', description: '', priority: 1 } // 重置表单
    fetchTasks() // 刷新列表
  }
}

// 3. 处理拖拽事件核心逻辑
// added: 元素被拖入该列； removed: 元素被移出该列
const handleDragChange = async (event, newStatus) => {
  if (event.added) {
    const task = event.added.element
    // 向后端发送请求，更新该任务的状态
    const res = await request.put('/api/task/updateStatus', {
      id: task.id,
      status: newStatus
    })
    if (res.code === 200) {
      ElMessage.success('状态已更新')
    } else {
      ElMessage.error('更新失败，请刷新重试')
      fetchTasks() // 失败则回滚 UI
    }
  }
}

onMounted(() => {
  fetchTasks()
})
</script>

<style scoped>
.kanban-container {
  height: calc(100vh - 100px);
  display: flex;
  flex-direction: column;
}
.header-action {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
.board-row {
  flex: 1;
  overflow: hidden;
}
.board-column {
  height: 100%;
  background-color: #f4f5f7;
  border: none;
  display: flex;
  flex-direction: column;
}
:deep(.el-card__body) {
  flex: 1;
  padding: 10px;
  overflow-y: auto;
}
.col-title {
  font-weight: bold;
  color: #172b4d;
}
.drag-area {
  min-height: 400px;
  height: 100%;
}
.task-card {
  background: white;
  padding: 15px;
  margin-bottom: 10px;
  border-radius: 6px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.12);
  cursor: grab;
  transition: box-shadow 0.2s;
}
.task-card:active {
  cursor: grabbing;
}
.task-card:hover {
  box-shadow: 0 4px 8px rgba(0,0,0,0.1);
}
.task-title {
  font-weight: bold;
  color: #333;
  margin-bottom: 8px;
}
.task-desc {
  font-size: 13px;
  color: #666;
  margin-bottom: 10px;
}
.done-card {
  opacity: 0.6;
  text-decoration: line-through;
}
</style>