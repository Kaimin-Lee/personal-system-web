<template>
  <div class="memo-container">
    <!-- 顶部输入区 -->
    <div class="input-area">
      <div class="input-header">
        <span class="input-title">✍️ 快速记录</span>
        <span class="char-count" :class="{ warn: newContent.length > 400 }">{{ newContent.length }} / 500</span>
      </div>
      <el-input
        v-model="newContent"
        type="textarea"
        :rows="3"
        :maxlength="500"
        placeholder="记录此刻的想法、灵感、踩坑记录..."
        resize="none"
        @keydown.ctrl.enter="submitNew"
      />
      <div class="input-footer">
        <div class="color-picker">
          <span class="color-label">边框颜色：</span>
          <span
            v-for="c in colors"
            :key="c.value"
            :style="{ background: c.value, boxShadow: newColor === c.value ? `0 0 0 3px ${c.value}` : 'none' }"
            :class="['color-dot', { active: newColor === c.value }]"
            :title="c.name"
            @click="newColor = c.value"
          >
            <el-icon v-if="newColor === c.value" class="check-icon"><Check /></el-icon>
          </span>
        </div>
        <el-button type="primary" size="small" :disabled="!newContent.trim()" @click="submitNew">
          记下来 <kbd>Ctrl+↵</kbd>
        </el-button>
      </div>
    </div>

    <!-- 搜索 + 统计 -->
    <div class="list-header">
      <el-input v-model="keyword" placeholder="搜索备忘录内容..." clearable @input="fetchList" style="max-width:280px">
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <span class="count-badge">共 {{ list.length }} 条 · 置顶 {{ list.filter(i=>i.isPinned).length }} 条</span>
    </div>

    <!-- 瀑布流卡片 -->
    <div class="memo-grid" v-if="list.length > 0">
      <div
        v-for="item in list"
        :key="item.id"
        :style="{ borderColor: (editingId === item.id ? editColor : item.bgColor) || '#334155', borderLeftWidth: '4px' }"
        class="memo-card"
        :class="{ pinned: item.isPinned }"
      >
        <div class="card-actions">
          <el-tooltip :content="item.isPinned ? '取消置顶' : '置顶'" placement="top">
            <el-icon :class="['pin-icon', { active: item.isPinned }]" @click="togglePin(item)"><Top /></el-icon>
          </el-tooltip>
          <el-tooltip content="编辑" placement="top">
            <el-icon class="edit-icon" @click="startEdit(item)"><Edit /></el-icon>
          </el-tooltip>
          <el-tooltip content="删除" placement="top">
            <el-icon class="del-icon" @click="deleteMemo(item.id)"><Delete /></el-icon>
          </el-tooltip>
        </div>

        <el-tag v-if="item.isPinned" size="small" class="pin-tag">📌 置顶</el-tag>

        <div v-if="editingId !== item.id" class="card-content" @dblclick="startEdit(item)">
          <span v-if="!expanded[item.id] && item.content.length > 120">
            {{ item.content.slice(0, 120) }}<span class="expand-btn" @click.stop="expanded[item.id] = true">...展开</span>
          </span>
          <span v-else>
            {{ item.content }}
            <span v-if="item.content.length > 120" class="expand-btn" @click.stop="expanded[item.id] = false"> 收起</span>
          </span>
        </div>
        <el-input
          v-else
          v-model="editContent"
          type="textarea"
          :rows="4"
          :maxlength="500"
          resize="none"
          @keydown.ctrl.enter="saveEdit(item)"
          ref="editInputRef"
        />
        <div v-if="editingId === item.id" class="edit-color-bar">
          <span class="color-label">边框色：</span>
          <span
            v-for="c in colors" :key="c.value"
            :style="{ background: c.value }"
            :class="['color-dot-sm', { active: editColor === c.value }]"
            @click="editColor = c.value"
          />
          <div class="edit-actions">
            <el-button size="small" @click="cancelEdit">取消</el-button>
            <el-button size="small" type="primary" @click="saveEdit(item)">保存 Ctrl+↵</el-button>
          </div>
        </div>
        <div class="card-footer">
          <span class="time">{{ formatTime(item.createTime) }}</span>
          <span class="hint" v-if="editingId !== item.id">双击编辑</span>
        </div>
      </div>
    </div>

    <el-empty v-else description="还没有备忘录，快记录第一条吧" :image-size="120">
      <el-button type="primary" @click="focusInput">立即记录</el-button>
    </el-empty>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, nextTick } from 'vue'
import { Top, Edit, Delete, Search, Check } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'

const list = ref([])
const newContent = ref('')
const newColor = ref('#475569')
const keyword = ref('')
const editingId = ref(null)
const editContent = ref('')
const editColor = ref('#475569')
const editInputRef = ref(null)
const expanded = reactive({})
const inputAreaRef = ref(null)

const colors = [
  { name: '默认', value: '#475569' },
  { name: '天蓝', value: '#38bdf8' },
  { name: '翠绿', value: '#34d399' },
  { name: '玫红', value: '#f472b6' },
  { name: '橙黄', value: '#fb923c' },
  { name: '紫罗兰', value: '#a78bfa' },
  { name: '金黄', value: '#fbbf24' },
  { name: '珊瑚红', value: '#f87171' },
  { name: '青色', value: '#2dd4bf' },
]

const fetchList = async () => {
  const res = await request.get('/memo/list', { params: { keyword: keyword.value } })
  if (res.code === 200) list.value = res.data
}

const submitNew = async () => {
  if (!newContent.value.trim()) return
  const res = await request.post('/memo/save', { content: newContent.value, bgColor: newColor.value })
  if (res.code === 200) { newContent.value = ''; ElMessage.success('已记录'); fetchList() }
}

const togglePin = async (item) => {
  await request.post(`/memo/pin/${item.id}`)
  fetchList()
}

const startEdit = (item) => {
  editingId.value = item.id
  editContent.value = item.content
  editColor.value = item.bgColor || '#475569'
  nextTick(() => editInputRef.value?.[0]?.focus())
}

const cancelEdit = () => { editingId.value = null }

const saveEdit = async (item) => {
  const contentChanged = editContent.value.trim() !== item.content
  const colorChanged = editColor.value !== (item.bgColor || '#475569')
  if (!editContent.value.trim()) { editingId.value = null; return }
  if (contentChanged || colorChanged) {
    await request.post('/memo/save', { ...item, content: editContent.value, bgColor: editColor.value })
    fetchList()
  }
  editingId.value = null
}

const deleteMemo = (id) => {
  ElMessageBox.confirm('确定删除这条备忘录？', '提示', { type: 'warning' }).then(async () => {
    const res = await request.delete(`/memo/delete/${id}`)
    if (res.code === 200) { ElMessage.success('已删除'); fetchList() }
  }).catch(() => {})
}

const focusInput = () => {
  document.querySelector('.memo-container .el-textarea__inner')?.focus()
}

const formatTime = (t) => {
  if (!t) return ''
  const d = new Date(t)
  return `${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

onMounted(fetchList)
</script>

<style scoped>
.memo-container { padding: 20px; }

/* 输入区 */
.input-area {
  background: rgba(255,255,255,0.04);
  border: 1px solid rgba(0,243,255,0.2);
  border-radius: 14px;
  padding: 16px 18px;
  margin-bottom: 20px;
  backdrop-filter: blur(8px);
  transition: border-color 0.3s;
}
.input-area:focus-within { border-color: rgba(0,243,255,0.5); box-shadow: 0 0 12px rgba(0,243,255,0.08); }
.input-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px; }
.input-title { font-size: 14px; color: #94a3b8; font-weight: 500; }
.char-count { font-size: 12px; color: #64748b; transition: color 0.2s; }
.char-count.warn { color: #f59e0b; }

.input-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 12px; flex-wrap: wrap; gap: 8px; }
.color-picker { display: flex; align-items: center; gap: 8px; }
.color-label { font-size: 12px; color: #64748b; }
.color-dot {
  width: 22px; height: 22px; border-radius: 50%; cursor: pointer;
  border: 2px solid rgba(0,0,0,0.1); transition: transform 0.2s, box-shadow 0.2s;
  display: flex; align-items: center; justify-content: center; position: relative;
}
.color-dot:hover { transform: scale(1.25); }
.color-dot.active { border-color: #00f3ff; box-shadow: 0 0 6px rgba(0,243,255,0.5); transform: scale(1.2); }
.check-icon { font-size: 12px; color: #374151; }

kbd { background: rgba(255,255,255,0.15); border-radius: 3px; padding: 1px 4px; font-size: 11px; margin-left: 4px; }

/* 列表头 */
.list-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 18px; flex-wrap: wrap; gap: 10px; }
.count-badge { font-size: 13px; color: #64748b; background: rgba(255,255,255,0.05); padding: 4px 12px; border-radius: 20px; border: 1px solid rgba(255,255,255,0.08); }

/* 瀑布流 */
.memo-grid { columns: 4 220px; column-gap: 16px; }

.memo-card {
  break-inside: avoid;
  border-radius: 12px;
  border: 1px solid #334155;
  border-left-width: 4px;
  padding: 14px;
  margin-bottom: 16px;
  background: rgba(15, 23, 42, 0.6);
  backdrop-filter: blur(8px);
  box-shadow: 0 2px 10px rgba(0,0,0,0.2);
  transition: transform 0.25s, box-shadow 0.25s;
  position: relative;
  cursor: default;
}
.memo-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.35); }
.memo-card.pinned { box-shadow: 0 0 0 1px #f59e0b, 0 4px 16px rgba(245,158,11,0.15); }

.card-actions {
  display: flex; gap: 6px; justify-content: flex-end; margin-bottom: 6px;
  opacity: 0; transition: opacity 0.2s;
}
.memo-card:hover .card-actions { opacity: 1; }
.card-actions .el-icon { cursor: pointer; color: #6b7280; font-size: 15px; padding: 3px; border-radius: 4px; transition: all 0.15s; }
.pin-icon:hover, .pin-icon.active { color: #f59e0b; background: rgba(245,158,11,0.1); }
.edit-icon:hover { color: #3b82f6; background: rgba(59,130,246,0.1); }
.del-icon:hover { color: #ef4444; background: rgba(239,68,68,0.1); }

.pin-tag { margin-bottom: 8px; background: rgba(245,158,11,0.1); border-color: rgba(245,158,11,0.3); color: #d97706; }

.card-content { font-size: 14px; color: #cbd5e1; line-height: 1.65; white-space: pre-wrap; word-break: break-word; }
.expand-btn { color: #64748b; font-size: 12px; cursor: pointer; margin-left: 2px; }
.expand-btn:hover { color: #38bdf8; }

.card-footer { display: flex; justify-content: space-between; align-items: center; margin-top: 10px; }
.time { font-size: 11px; color: #475569; }
.hint { font-size: 11px; color: #334155; opacity: 0; transition: opacity 0.2s; }
.memo-card:hover .hint { opacity: 1; }

:deep(.el-textarea__inner) { background: transparent; border: none; box-shadow: none; color: #e2e8f0; padding: 0; }
:deep(.el-textarea__inner:focus) { box-shadow: none; }

.edit-color-bar {
  display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
  margin-top: 10px; padding-top: 10px;
  border-top: 1px solid rgba(255,255,255,0.06);
}
.color-dot-sm {
  width: 16px; height: 16px; border-radius: 50%; cursor: pointer;
  border: 2px solid transparent; transition: transform 0.15s, border-color 0.15s;
  flex-shrink: 0;
}
.color-dot-sm:hover { transform: scale(1.3); }
.color-dot-sm.active { border-color: #fff; transform: scale(1.2); }
.edit-actions { margin-left: auto; display: flex; gap: 6px; }
</style>
