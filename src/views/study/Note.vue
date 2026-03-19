<template>
  <div class="note-container cyberpunk-theme">
    
    <el-row :gutter="20" class="full-height">
      
      <el-col :xs="24" :md="5" class="sidebar-col" v-show="!isMobile || (isMobile && mobileView === 'list')">
        <el-card class="cyber-card sidebar-card" shadow="never">
          <div class="sidebar-header">
            <h2 class="glow-title">📚 学习笔记</h2>
            <el-button type="primary" icon="Plus" circle class="neon-btn-circle" @click="createNewNote"></el-button>
          </div>
          
          <div class="search-box">
            <el-input 
              v-model="searchKey" 
              placeholder="检索标题或标签..." 
              prefix-icon="Search" 
              clearable 
              @input="handleSearch"
              class="cyber-input"
            />
          </div>

          <el-scrollbar class="note-list-scroll">
            <div v-loading="loading">
              <el-empty v-if="noteList.length === 0" description="档案库空载" :image-size="60" />
              
              <div 
                v-for="item in noteList" 
                :key="item.id" 
                :class="['note-item', { 'is-active': currentNote.id === item.id }]"
                @click="selectNote(item)"
              >
                <div class="note-title">{{ item.title || '无标题文档' }}</div>
                <div class="note-meta">
                  <span class="note-time">{{ formatTime(item.updateTime) }}</span>
                  <div class="note-tags" v-if="item.tags">
                    <el-tag size="small" type="info" effect="dark" v-for="tag in item.tags.split(',')" :key="tag" class="cyber-tag">
                      {{ tag }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </div>
          </el-scrollbar>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="19" class="editor-col" v-show="!isMobile || (isMobile && mobileView === 'editor')">
        <el-card class="cyber-card editor-card" :class="{ 'view-mode-style': isPreviewMode }" shadow="never">
          
          <div v-if="!currentNote.id && !isEditingNew" class="empty-editor">
            <el-icon class="huge-icon"><Document /></el-icon>
            <p>请从左侧选择一条档案，或建立新节点</p>
          </div>

          <div v-else class="editor-content">
            <div class="editor-header">
              <el-button v-if="isMobile" icon="ArrowLeft" link class="back-btn" @click="goBackToList">返回库</el-button>
              
              <el-input v-model="currentNote.title" placeholder="键入档案主标题..." class="title-input cyber-input-transparent" :style="{ fontSize: (editorFontSize + 4) + 'px' }" :readonly="isPreviewMode" />

              <div class="action-group">
                <div class="word-count-display" v-if="!isMobile">
                  <span class="text-gray" style="font-size: 12px">{{ wordCount }} 字 · {{ readingTime }} 分钟阅读</span>
                  <span v-if="autoSaving" class="text-gray" style="font-size: 11px;margin-left:8px;color:#00f3ff">● 自动保存中...</span>
                </div>
                <div class="font-size-ctrl hidden-xs-only" v-if="!isMobile">
                  <span class="text-gray" style="font-size: 12px">A</span>
                  <el-slider v-model="editorFontSize" :min="12" :max="28" :step="1" :show-tooltip="false" style="width: 60px" />
                  <span class="text-gray" style="font-size: 18px">A</span>
                </div>

                <el-button type="info" link @click="toggleMode" class="mode-toggle-btn">
                  <el-icon class="mr-1"><component :is="isPreviewMode ? 'Edit' : 'View'" /></el-icon>
                  {{ isPreviewMode ? '进入编辑' : '锁定阅览' }}
                </el-button>

                <el-button type="success" link @click="copyContent" v-if="currentNote.content" icon="DocumentCopy">复制纯文本</el-button>
                <el-button type="danger" icon="Delete" link @click="deleteNote" v-if="currentNote.id && !isPreviewMode">销毁</el-button>
                <el-button type="primary" icon="Upload" @click="saveNote" :loading="saving" class="neon-btn" v-if="!isPreviewMode">
                  {{ isMobile ? '保存' : '同步云端' }}
                </el-button>
              </div>
            </div>

            <div class="tags-input-area" v-if="!isPreviewMode || (isPreviewMode && currentNote.tags)">
              <el-icon class="tag-icon"><CollectionTag /></el-icon>
              <el-input v-model="currentNote.tags" placeholder="键入标签碎片 (用英文逗号分隔)" class="cyber-input-transparent" :readonly="isPreviewMode" />
            </div>

            <div class="textarea-wrapper" data-we-theme="dark">

              <Toolbar
                v-show="!isPreviewMode"
                style="border-bottom: 1px solid rgba(0, 243, 255, 0.15);"
                :editor="editorRef"
                :defaultConfig="toolbarConfig"
                :mode="'default'"
                class="cyber-wangeditor-toolbar"
              />
              
              <Editor
                style="flex: 1; overflow-y: hidden;"
                v-model="currentNote.content"
                :defaultConfig="editorConfig"
                :mode="'default'"
                @onCreated="handleCreated"
                class="cyber-wangeditor-content"
                :style="{ fontSize: editorFontSize + 'px' }"
              />
            </div>
            
          </div>
        </el-card>
      </el-col>
    </el-row>

  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, shallowRef } from 'vue'
import { Plus, Search, Document, CollectionTag, Upload, Delete, ArrowLeft, Edit, View, DocumentCopy } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

import '@wangeditor/editor/dist/css/style.css'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'

const loading = ref(false)
const saving = ref(false)
const noteList = ref([])
const searchKey = ref('')

const isMobile = ref(false)
const mobileView = ref('list') 

const defaultFontSize = Number(localStorage.getItem('LifeOS_FontSize')) || 16
const editorFontSize = ref(defaultFontSize)

watch(editorFontSize, (newVal) => {
  localStorage.setItem('LifeOS_FontSize', newVal)
})

const currentNote = ref({ id: null, title: '', content: '', tags: '', folderId: 0 })
const isEditingNew = ref(false)
const isPreviewMode = ref(true)
const autoSaving = ref(false)

// 字数统计
const wordCount = computed(() => {
  if (!currentNote.value.content) return 0
  const text = currentNote.value.content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()
  return text.length
})

// 阅读时间（按每分钟300字计算）
const readingTime = computed(() => {
  return Math.ceil(wordCount.value / 300) || 1
}) 

// WangEditor 配置
const editorRef = shallowRef()
const toolbarConfig = { excludeKeys: ['fullScreen'] } 
const editorConfig = ref({ 
  placeholder: '从这里开始沉浸式记录...', 
  autoFocus: false,
})

const handleCreated = (editor) => {
  editorRef.value = editor
  if (currentNote.value.id && isPreviewMode.value) {
     editor.disable()
  }
}
// ======= 沉浸式阅读 / 编辑 模式切换 =======
const toggleMode = () => {
  if (!editorRef.value) return
  if (!isPreviewMode.value) {
    editorRef.value.disable() // 彻底锁定不可打字
    isPreviewMode.value = true
    ElMessage.success('已进入沉浸式阅览模式')
  } else {
    editorRef.value.enable() // 恢复编辑
    isPreviewMode.value = false
    ElMessage.success('编辑系统已激活')
  }
}

// ======= 复制纯文本 =======
const copyContent = () => {
  const text = currentNote.value.content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()
  navigator.clipboard.writeText(text).then(() => ElMessage.success('纯文本已复制'))
}

// ======= 基础业务系统 =======
const checkMobile = () => { isMobile.value = window.innerWidth <= 768 }
const formatTime = (timeStr) => { if (!timeStr) return ''; return timeStr.substring(0, 16) }

let searchTimer = null
const handleSearch = () => { if (searchTimer) clearTimeout(searchTimer); searchTimer = setTimeout(() => { fetchNotes() }, 500) }
const fetchNotes = async () => { loading.value = true; try { const res = await request.get('/note/list', { params: { keyword: searchKey.value } }); if (res.code === 200) noteList.value = res.data } finally { loading.value = false } }

const createNewNote = () => {
  currentNote.value = { id: null, title: '', content: '', tags: '', folderId: 0 }
  isEditingNew.value = true
  isPreviewMode.value = false 
  if (editorRef.value) editorRef.value.enable() 
  if (isMobile.value) mobileView.value = 'editor'
}

const selectNote = (item) => {
  currentNote.value = { ...item } 
  isEditingNew.value = false
  isPreviewMode.value = true // 强制进入阅览态
  if (editorRef.value) editorRef.value.disable() 
  if (isMobile.value) mobileView.value = 'editor'
}

const saveNote = async () => {
  if (!currentNote.value.title?.trim()) return ElMessage.warning('必须为档案命名')
  saving.value = true
  try {
    const res = await request.post('/note/save', currentNote.value)
    if (res.code === 200) {
      ElMessage.success('已同步至云端')
      currentNote.value.id = res.data.id; 
      isPreviewMode.value = true; 
      if (editorRef.value) editorRef.value.disable() 
      fetchNotes()
    }
  } finally { saving.value = false }
}

const deleteNote = () => {
  if (!currentNote.value.id) return
  ElMessageBox.confirm('确定要彻底销毁该档案吗？该操作不可逆。', '警告', { type: 'warning' }).then(async () => {
    const res = await request.delete(`/note/delete/${currentNote.value.id}`)
    if (res.code === 200) { ElMessage.success('档案已销毁'); currentNote.value = { id: null, title: '', content: '', tags: '', folderId: 0 }; fetchNotes(); if (isMobile.value) mobileView.value = 'list' }
  }).catch(() => {})
}

const goBackToList = () => { mobileView.value = 'list' }

// ======= 自动保存（编辑模式下内容变化 3 秒后触发）=======
let autoSaveTimer = null
watch(() => currentNote.value.content, () => {
  if (isPreviewMode.value || !currentNote.value.title?.trim()) return
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  autoSaveTimer = setTimeout(async () => {
    autoSaving.value = true
    try {
      const res = await request.post('/note/save', currentNote.value)
      if (res.code === 200) { currentNote.value.id = res.data.id; fetchNotes() }
    } finally { autoSaving.value = false }
  }, 3000)
})

// ======= Ctrl+S 快捷保存 =======
const handleKeydown = (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    if (!isPreviewMode.value) saveNote()
  }
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  window.addEventListener('keydown', handleKeydown)
  fetchNotes()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkMobile)
  window.removeEventListener('keydown', handleKeydown)
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  if (editorRef.value) editorRef.value.destroy()
})
</script>

<style scoped>
/* ================= 全局赛博深海蓝主题 ================= */
.cyberpunk-theme {
  --cyber-bg: #0a1023;
  --cyber-border: rgba(0, 243, 255, 0.2);
  --cyber-glow: 0 0 10px rgba(0, 243, 255, 0.3);
  --neon-cyan: #00f3ff;
  --text-primary: #e2e8f0;
  --text-secondary: #94a3b8;
}

.note-container { height: calc(100vh - 100px); padding: 10px; background-color: var(--cyber-bg); color: var(--text-primary); font-family: 'Helvetica Neue', Helvetica, sans-serif;}
.full-height { height: 100%; }
.sidebar-col, .editor-col { height: 100%; }

.cyber-card { 
  height: 100%; background: rgba(13, 20, 36, 0.8) !important; 
  backdrop-filter: blur(20px) !important; 
  border: 1px solid var(--cyber-border) !important; 
  box-shadow: var(--cyber-glow) !important;
  display: flex; flex-direction: column; overflow: hidden;
  transition: all 0.3s;
}
:deep(.el-card__body) { flex: 1; display: flex; flex-direction: column; padding: 0; overflow: hidden; }

.sidebar-header { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; border-bottom: 1px solid rgba(0, 243, 255, 0.1); }
.glow-title { margin: 0; font-size: 18px; color: #fff; text-shadow: 0 0 10px var(--neon-cyan); }
.neon-btn-circle { background: rgba(0, 243, 255, 0.1) !important; border: 1px solid rgba(0, 243, 255, 0.4) !important; color: var(--neon-cyan) !important; }
.search-box { padding: 15px 20px 5px 20px; }

.note-list-scroll { flex: 1; padding: 10px 15px; }
.note-item { padding: 12px 15px; border-radius: 8px; margin-bottom: 10px; cursor: pointer; border: 1px solid transparent; transition: all 0.2s; background: rgba(255, 255, 255, 0.03); }
.note-item:hover { background: rgba(0, 243, 255, 0.05); border-color: rgba(0, 243, 255, 0.2); }
.note-item.is-active { background: rgba(0, 243, 255, 0.1); border-color: var(--neon-cyan); box-shadow: inset 0 0 10px rgba(0, 243, 255, 0.1); }
.note-title { font-weight: bold; font-size: 15px; color: var(--text-primary); margin-bottom: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.note-meta { display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: var(--text-secondary); }
.cyber-tag { background: rgba(0, 243, 255, 0.05) !important; border: 1px solid rgba(0, 243, 255, 0.2) !important; color: var(--neon-cyan) !important; }

/* ================= 编辑器主屏样式 ================= */
.empty-editor { display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%; color: var(--text-secondary); }
.huge-icon { font-size: 60px; margin-bottom: 20px; opacity: 0.5; color: var(--neon-cyan); }
.editor-content { display: flex; flex-direction: column; height: 100%; }
.editor-header { display: flex; justify-content: space-between; align-items: center; padding: 10px 20px; border-bottom: 1px solid rgba(0, 243, 255, 0.1); gap: 15px; }
.action-group { display: flex; gap: 10px; align-items: center; flex-shrink: 0; flex-wrap: nowrap; }

:deep(.title-input .el-input__inner) { font-weight: bold; color: var(--neon-cyan) !important; cursor: text !important; transition: color 0.3s;}
:deep(.editor-card.view-mode-style .title-input .el-input__inner) { color: #fff !important; cursor: default !important; font-size: 24px !important; text-shadow: 0 0 10px rgba(255,255,255,0.2); }

.font-size-ctrl { display: flex; align-items: center; gap: 10px; background: rgba(0,0,0,0.3); padding: 0 15px; border-radius: 20px; border: 1px solid rgba(0, 243, 255, 0.1); }
.font-size-ctrl .text-gray { color: var(--text-secondary); font-weight: bold; }
.mode-toggle-btn { color: var(--text-secondary) !important; font-weight: bold; letter-spacing: 1px; }
.mode-toggle-btn:hover { color: var(--neon-cyan) !important; text-shadow: 0 0 5px var(--neon-cyan); }
.mr-1 { margin-right: 4px; }

.tags-input-area { display: flex; align-items: center; padding: 5px 20px; background: rgba(0, 0, 0, 0.15); }
.tag-icon { font-size: 18px; color: var(--neon-cyan); margin-right: 10px; }
:deep(.editor-card.view-mode-style .tags-input-area) { opacity: 0.6; }

.textarea-wrapper { flex: 1; padding: 0; display: flex; flex-direction: column; position: relative; overflow-y: hidden;}
.custom-generator-toolbar { padding: 8px 20px; display: flex; gap: 10px; background: rgba(0,0,0,0.3); border-bottom: 1px dashed rgba(0,243,255,0.1); }

:deep(.cyber-input .el-input__wrapper), :deep(.cyber-input-transparent .el-input__wrapper) { background-color: rgba(0, 0, 0, 0.4) !important; border: 1px solid rgba(0, 243, 255, 0.2) !important; box-shadow: none !important; }
:deep(.cyber-input-transparent .el-input__wrapper) { background-color: transparent !important; border: none !important; }
:deep(.cyber-input .el-input__wrapper.is-focus) { border-color: var(--neon-cyan) !important; }

/* ================= 真正解决白底工具栏的 王炸 CSS ================= */
/* 在注入 data-we-theme="dark" 后，微调背景使其透明融入我们的背景中 */
:deep(.w-e-text-container) { background-color: transparent !important; }
:deep(.cyber-wangeditor-toolbar) { background-color: rgba(0, 0, 0, 0.4) !important; border: none !important; }
:deep(.cyber-wangeditor-toolbar .w-e-bar-item button) { color: var(--text-secondary) !important; }
:deep(.cyber-wangeditor-toolbar .w-e-bar-item button:hover) { color: var(--neon-cyan) !important; background-color: rgba(0, 243, 255, 0.08) !important; }
:deep(.cyber-wangeditor-toolbar .w-e-bar-item.w-e-active button) { color: var(--neon-cyan) !important; }

/* 🌟 沉浸式阅读样式排版 */
:deep(.w-e-text-container [contenteditable]) { padding: 15px 20px !important; color: #e2e8f0; line-height: 1.6; }
:deep(.editor-card.view-mode-style .w-e-text-container [contenteditable]) { padding: 30px 50px !important; line-height: 1.8; color: #f8fafc; }
:deep(.w-e-text-container [contenteditable]::-webkit-scrollbar) { width: 5px; background: rgba(0,0,0,0.1); }
:deep(.w-e-text-container [contenteditable]::-webkit-scrollbar-thumb) { background: rgba(0, 243, 255, 0.2); border-radius: 3px; }

/* 🌟 彻底激活图片的缩放拖拽框 */
:deep(.w-e-text-container img) { cursor: pointer; transition: filter 0.2s; border-radius: 8px; display: inline-block; vertical-align: top; margin: 5px;}
:deep(.w-e-text-container img:hover) { filter: drop-shadow(0 0 8px rgba(0,243,255,0.4)); }

/* ================= 其他 ================= */
.word-count-display { display: flex; align-items: center; white-space: nowrap; flex-shrink: 0; }
.w-100 { width: 100%; }
.mt-2 { margin-top: 10px; }
.mt-3 { margin-top: 15px; }
.mb-1 { margin-bottom: 5px; }
.mb-3 { margin-bottom: 15px; }
.text-gray { color: #94a3b8; font-size: 13px; }

@media screen and (max-width: 768px) {
  .note-container { padding: 5px; height: calc(100vh - 70px); }
  .editor-header { flex-wrap: wrap; }
  .action-group { width: 100%; justify-content: flex-end; }
  :deep(.editor-card.view-mode-style .w-e-text-container [contenteditable]) { padding: 15px 15px !important; }
}

/* 公式图片行内对齐 */
:deep(.w-e-text-container img[alt^="[CYBER_FORMULA]"]) { vertical-align: middle; padding: 2px 6px; background: rgba(0, 0, 0, 0.25); border-radius: 4px; }
</style>

<style>
/* ===== 全局：WangEditor 工具栏 & 浮层 ===== */
.w-e-bar.w-e-toolbar {
  background-color: rgba(10, 16, 35, 0.95) !important;
  border-bottom: 1px solid rgba(0, 243, 255, 0.15) !important;
}
.w-e-bar.w-e-toolbar .w-e-bar-item button { color: #94a3b8 !important; }
.w-e-bar.w-e-toolbar .w-e-bar-item button:hover { color: #00f3ff !important; background: rgba(0, 243, 255, 0.08) !important; }
.w-e-bar.w-e-toolbar .w-e-bar-item.w-e-active button { color: #00f3ff !important; }
.w-e-bar.w-e-toolbar .w-e-bar-divider { background-color: rgba(0, 243, 255, 0.15) !important; }

.w-e-text-container [contenteditable]::selection,
.w-e-text-container [contenteditable] *::selection {
  background: rgba(0, 243, 255, 0.28);
  color: #fff;
}

.w-e-drop-panel {
  background: rgba(10, 16, 35, 0.98) !important;
  border: 1px solid rgba(0, 243, 255, 0.25) !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6) !important;
}
.w-e-drop-panel .w-e-panel-tab-title { color: #94a3b8 !important; border-bottom-color: rgba(0, 243, 255, 0.1) !important; }
.w-e-drop-panel .w-e-panel-tab-title.active { color: #00f3ff !important; border-bottom-color: #00f3ff !important; }
.w-e-drop-panel .w-e-panel-tab-content { color: #e2e8f0 !important; }
.w-e-drop-panel input { background: rgba(0, 0, 0, 0.5) !important; border: 1px solid rgba(0, 243, 255, 0.2) !important; color: #e2e8f0 !important; border-radius: 4px; }
.w-e-drop-panel input:focus { border-color: #00f3ff !important; outline: none !important; }
.w-e-drop-panel button { background: rgba(0, 243, 255, 0.1) !important; border: 1px solid rgba(0, 243, 255, 0.3) !important; color: #00f3ff !important; border-radius: 4px; }
.w-e-drop-panel button:hover { background: rgba(0, 243, 255, 0.2) !important; }

.w-e-bar-item-menus-container {
  background: rgba(10, 16, 35, 0.98) !important;
  border: 1px solid rgba(0, 243, 255, 0.2) !important;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5) !important;
}
.w-e-bar-item-menus-container .w-e-bar-item button { color: #94a3b8 !important; }
.w-e-bar-item-menus-container .w-e-bar-item button:hover { background: rgba(0, 243, 255, 0.1) !important; color: #00f3ff !important; }
</style>