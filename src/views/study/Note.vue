<template>
  <div class="note-container cyberpunk-theme">
    
    <el-row :gutter="20" class="full-height">
      
      <el-col :xs="24" :md="6" class="sidebar-col" v-show="!isMobile || (isMobile && mobileView === 'list')">
        <el-card class="cyber-card sidebar-card" shadow="never">
          <div class="sidebar-header">
            <h2 class="glow-title">
              {{ isTrashMode ? '🗑️ 回收站' : '📚 学习笔记' }} 
              <span class="count-badge">({{ noteList.length }})</span>
            </h2>
            <div class="header-actions">
              <el-tooltip :content="isTrashMode ? '返回档案库' : '查看回收站'" placement="top">
                <el-button type="info" :icon="isTrashMode ? 'Back' : 'Delete'" circle plain @click="toggleTrashMode"></el-button>
              </el-tooltip>
              <el-tooltip content="新建档案" placement="top" v-if="!isTrashMode">
                <el-button type="primary" icon="Plus" circle class="neon-btn-circle" @click="createNewNote"></el-button>
              </el-tooltip>
            </div>
          </div>
          
          <div class="search-box">
            <el-input 
              v-model="searchKey" 
              placeholder="检索全文内容或标签..." 
              prefix-icon="Search" 
              clearable 
              @input="handleSearch"
              class="cyber-input"
            />
          </div>

          <el-scrollbar class="note-list-scroll">
            <div v-loading="loading">
              <el-empty v-if="noteList.length === 0" :description="isTrashMode ? '回收站为空' : '档案库空载'" :image-size="60" />
              
              <div 
                v-for="item in noteList" 
                :key="item.id" 
                :class="['note-item', { 'is-active': currentNote.id === item.id, 'is-pinned': item.isPinned }]"
                @click="selectNote(item)"
              >
                <div class="note-title">
                  <el-icon v-if="item.isPinned" class="pin-icon"><Location /></el-icon>
                  {{ item.title || '无标题文档' }}
                </div>
                <div class="note-meta">
                  <span class="note-time">{{ formatTime(item.updateTime) }}</span>
                  <div class="note-tags" v-if="item.tags">
                    <el-tag size="small" type="info" effect="dark" v-for="tag in item.tags.split(',')" :key="tag" class="cyber-tag" @click.stop="quickSearchTag(tag)">
                      {{ tag }}
                    </el-tag>
                  </div>
                </div>
              </div>
            </div>
          </el-scrollbar>
        </el-card>
      </el-col>

      <el-col :xs="24" :md="18" class="editor-col" v-show="!isMobile || (isMobile && mobileView === 'editor')">
        <el-card class="cyber-card editor-card" :class="{ 'view-mode-style': isPreviewMode }" shadow="never">
          
          <div v-if="!currentNote.id && !isEditingNew" class="empty-editor">
            <el-icon class="huge-icon" v-if="!isTrashMode"><Document /></el-icon>
            <el-icon class="huge-icon" v-else><DeleteFilled /></el-icon>
            <p>{{ isTrashMode ? '请在左侧选择要恢复的文档' : '请从左侧选择一条档案，或建立新节点' }}</p>
          </div>

          <div v-else class="editor-content">
            <div class="editor-header">
              <el-button v-if="isMobile" icon="ArrowLeft" link class="back-btn" @click="goBackToList">返回库</el-button>
              
              <el-input v-model="currentNote.title" placeholder="键入档案主标题..." class="title-input cyber-input-transparent" :style="{ fontSize: (editorFontSize + 4) + 'px' }" :readonly="isPreviewMode" />

              <div class="action-group">
                <div class="word-count-display" v-if="!isMobile">
                  <span class="text-gray" style="font-size: 12px">{{ wordCount }} 字 · {{ readingTime }} 分钟阅读</span>
                  <span v-if="isLocalDraft" class="text-warning" style="font-size: 11px;margin-left:8px;">⚠️ 离线草稿(未同步)</span>
                  <span v-else-if="autoSaving" class="text-gray" style="font-size: 11px;margin-left:8px;color:#00f3ff">● 自动保存中...</span>
                </div>
                
                <div class="font-size-ctrl hidden-xs-only" v-if="!isMobile">
                  <span class="text-gray" style="font-size: 12px">A</span>
                  <el-slider v-model="editorFontSize" :min="12" :max="28" :step="1" :show-tooltip="false" style="width: 60px" />
                  <span class="text-gray" style="font-size: 18px">A</span>
                </div>

                <el-dropdown trigger="click" @command="handleMoreCommand" v-if="!isTrashMode && currentNote.id">
                  <el-button type="info" link icon="MoreFilled" class="more-btn" />
                  <template #dropdown>
                    <el-dropdown-menu class="cyber-dropdown">
                      <el-dropdown-item command="togglePin"><el-icon><Location /></el-icon>{{ currentNote.isPinned ? '取消置顶' : '设为置顶' }}</el-dropdown-item>
                      <el-dropdown-item command="exportTxt"><el-icon><Download /></el-icon>导出为 TXT</el-dropdown-item>
                      <el-dropdown-item command="exportHtml"><el-icon><DataBoard /></el-icon>导出富文本 HTML</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>

                <template v-if="!isTrashMode">
                  <el-button type="info" link @click="toggleMode" class="mode-toggle-btn">
                    <el-icon class="mr-1"><component :is="isPreviewMode ? 'Edit' : 'View'" /></el-icon>
                    {{ isPreviewMode ? '进入编辑' : '锁定阅览' }}
                  </el-button>
                  <el-button type="success" link @click="copyContent" v-if="currentNote.content" icon="DocumentCopy" class="hidden-xs-only">复制纯文本</el-button>
                  <el-button type="danger" icon="Delete" link @click="softDeleteNote" v-if="currentNote.id && !isPreviewMode">丢入回收站</el-button>
                  <el-button type="primary" icon="Upload" @click="saveNote" :loading="saving" class="neon-btn" v-if="!isPreviewMode">
                    {{ isMobile ? '保存' : '同步云端' }}
                  </el-button>
                </template>
                
                <template v-else>
                  <el-button type="success" icon="RefreshLeft" link @click="recoverNote">恢复文档</el-button>
                  <el-button type="danger" icon="DeleteFilled" link @click="hardDeleteNote">彻底销毁</el-button>
                </template>

              </div>
            </div>

            <div class="tags-input-area" v-if="!isPreviewMode || (isPreviewMode && currentNote.tags)">
              <el-icon class="tag-icon"><CollectionTag /></el-icon>
              <el-input v-model="currentNote.tags" placeholder="键入标签碎片 (用英文逗号分隔)" class="cyber-input-transparent" :readonly="isPreviewMode" />
            </div>

            <div class="textarea-wrapper" data-we-theme="dark">
              <Toolbar v-show="!isPreviewMode" style="border-bottom: 1px solid rgba(0, 243, 255, 0.15);" :editor="editorRef" :defaultConfig="toolbarConfig" :mode="'default'" class="cyber-wangeditor-toolbar" />
              <Editor style="flex: 1; overflow-y: hidden;" v-model="currentNote.content" :defaultConfig="editorConfig" :mode="'default'" @onCreated="handleCreated" class="cyber-wangeditor-content" :style="{ fontSize: editorFontSize + 'px' }" />
            </div>
            
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onBeforeUnmount, shallowRef } from 'vue'
import { Plus, Search, Document, CollectionTag, Upload, Delete, ArrowLeft, Edit, View, DocumentCopy, DeleteFilled, Location, Download, DataBoard, Back, RefreshLeft, MoreFilled } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

import '@wangeditor/editor/dist/css/style.css'
import { Editor, Toolbar } from '@wangeditor/editor-for-vue'

// 🌟 补回丢失的核心基础方法
const checkMobile = () => { isMobile.value = window.innerWidth <= 768 }
const formatTime = (timeStr) => { if (!timeStr) return ''; return timeStr.substring(0, 16) }

const loading = ref(false)
const saving = ref(false)
const noteList = ref([])
const searchKey = ref('')

const isMobile = ref(false)
const mobileView = ref('list') 

// 模式控制
const isTrashMode = ref(false)
const isPreviewMode = ref(true)

// 字号控制
const defaultFontSize = Number(localStorage.getItem('LifeOS_FontSize')) || 16
const editorFontSize = ref(defaultFontSize)
watch(editorFontSize, (newVal) => localStorage.setItem('LifeOS_FontSize', newVal))

const currentNote = ref({ id: null, title: '', content: '', tags: '', folderId: 0, isPinned: 0 })
const isEditingNew = ref(false)

// 脏检查与防丢机制状态
const autoSaving = ref(false)
const originalNoteStr = ref('') 
const isLocalDraft = ref(false) 

const DRAFT_KEY = 'LifeOS_Note_Draft_V2'

// 字数统计与时间预估
const wordCount = computed(() => {
  if (!currentNote.value.content) return 0
  return currentNote.value.content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim().length
})
const readingTime = computed(() => Math.ceil(wordCount.value / 300) || 1) 

// WangEditor 配置
const editorRef = shallowRef()
const toolbarConfig = { excludeKeys: ['fullScreen'] } 
const editorConfig = ref({ placeholder: '从这里开始沉浸式记录...', autoFocus: false })

const handleCreated = (editor) => {
  editorRef.value = editor
  if ((currentNote.value.id && isPreviewMode.value) || isTrashMode.value) {
     editor.disable()
  }
}

// 脏检查：判断是否有未保存的修改
const isDirty = computed(() => {
  if (isPreviewMode.value || isTrashMode.value) return false
  return JSON.stringify({ title: currentNote.value.title, content: currentNote.value.content, tags: currentNote.value.tags }) !== originalNoteStr.value
})

// 拦截切换逻辑
const checkDirtyAndConfirm = async () => {
  if (isDirty.value) {
    try {
      await ElMessageBox.confirm('当前有未保存的修改，强制切换将丢失这些内容。是否继续？', '未保存警告', {
        confirmButtonText: '放弃修改并切换', cancelButtonText: '取消', type: 'warning'
      })
      localStorage.removeItem(DRAFT_KEY) 
      return true
    } catch {
      return false 
    }
  }
  return true
}

const toggleMode = async () => {
  if (!editorRef.value) return
  if (!isPreviewMode.value) {
    if (isDirty.value) {
      await saveNote()
    }
    editorRef.value.disable()
    isPreviewMode.value = true
    ElMessage.success('已锁定沉浸式阅览模式')
  } else {
    editorRef.value.enable()
    isPreviewMode.value = false
    originalNoteStr.value = JSON.stringify({ title: currentNote.value.title, content: currentNote.value.content, tags: currentNote.value.tags })
    ElMessage.success('编辑系统已激活')
  }
}

const copyContent = () => {
  const text = currentNote.value.content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()
  navigator.clipboard.writeText(text).then(() => ElMessage.success('纯文本已复制'))
}

// 后端通信与数据获取
let searchTimer = null
const handleSearch = () => { if (searchTimer) clearTimeout(searchTimer); searchTimer = setTimeout(() => { fetchNotes() }, 500) }

const quickSearchTag = (tag) => {
  searchKey.value = tag
  handleSearch()
}

const fetchNotes = async () => {
  loading.value = true
  try {
    const res = await request.get('/note/list', { 
      params: { 
        keyword: searchKey.value,
        isDeleted: isTrashMode.value ? 1 : 0 
      } 
    })
    if (res.code === 200) noteList.value = res.data
  } finally { loading.value = false }
}

const toggleTrashMode = async () => {
  if (!(await checkDirtyAndConfirm())) return
  isTrashMode.value = !isTrashMode.value
  currentNote.value = { id: null, title: '', content: '', tags: '' } 
  searchKey.value = ''
  fetchNotes()
}

const createNewNote = async () => {
  if (!(await checkDirtyAndConfirm())) return
  currentNote.value = { id: null, title: '', content: '', tags: '', folderId: 0, isPinned: 0 }
  originalNoteStr.value = JSON.stringify({ title: '', content: '', tags: '' })
  isEditingNew.value = true
  isPreviewMode.value = false 
  isLocalDraft.value = false
  if (editorRef.value) editorRef.value.enable() 
  if (isMobile.value) mobileView.value = 'editor'
}

const selectNote = async (item) => {
  if (currentNote.value.id === item.id) return
  if (!(await checkDirtyAndConfirm())) return
  
  currentNote.value = { ...item } 
  originalNoteStr.value = JSON.stringify({ title: item.title, content: item.content, tags: item.tags })
  
  isEditingNew.value = false
  isPreviewMode.value = true 
  isLocalDraft.value = false
  if (editorRef.value) editorRef.value.disable() 
  if (isMobile.value) mobileView.value = 'editor'
}

const saveNote = async (isSilent = false) => {
  if (!currentNote.value.title?.trim()) {
    if (!isSilent) ElMessage.warning('必须为档案命名')
    return false
  }
  if (!isSilent) saving.value = true
  try {
    const res = await request.post('/note/save', currentNote.value)
    if (res.code === 200) {
      if (!isSilent) ElMessage.success('已同步至云端')
      currentNote.value.id = res.data.id; 
      originalNoteStr.value = JSON.stringify({ title: currentNote.value.title, content: currentNote.value.content, tags: currentNote.value.tags })
      localStorage.removeItem(DRAFT_KEY)
      isLocalDraft.value = false
      fetchNotes()
      return true
    }
  } catch (e) {
    if (isSilent) saveToLocalDraft() 
  } finally { if (!isSilent) saving.value = false }
  return false
}

const softDeleteNote = () => {
  ElMessageBox.confirm('档案将被移入回收站，确认丢弃？', '提示', { type: 'warning' }).then(async () => {
    const res = await request.post(`/note/delete/${currentNote.value.id}`)
    if (res.code === 200) { 
      ElMessage.success('已移入回收站'); 
      
      currentNote.value = { id: null, title: '', content: '', tags: '' };
      originalNoteStr.value = JSON.stringify({ title: '', content: '', tags: '' });
      isPreviewMode.value = true;
      
      fetchNotes(); 
      if (isMobile.value) mobileView.value = 'list';
    }
  }).catch(() => {})
}

const hardDeleteNote = () => {
  ElMessageBox.confirm('档案将被彻底销毁，不可找回！确认执行？', '高危操作警告', { type: 'error', confirmButtonText: '彻底销毁', confirmButtonClass: 'el-button--danger' }).then(async () => {
    const res = await request.post(`/note/hardDelete/${currentNote.value.id}`)
    if (res.code === 200) { 
      ElMessage.success('档案已彻底消失于虚空'); 
      
      currentNote.value = { id: null, title: '', content: '', tags: '' }; 
      originalNoteStr.value = JSON.stringify({ title: '', content: '', tags: '' });
      isPreviewMode.value = true;
      
      fetchNotes(); 
      if (isMobile.value) mobileView.value = 'list';
    }
  }).catch(() => {})
}

const recoverNote = async () => {
  const res = await request.post(`/note/recover/${currentNote.value.id}`)
  if (res.code === 200) { 
    ElMessage.success('档案已恢复'); 
    currentNote.value = { id: null, title: '', content: '', tags: '' }; 
    originalNoteStr.value = JSON.stringify({ title: '', content: '', tags: '' });
    isPreviewMode.value = true;
      
    fetchNotes(); 
    if (isMobile.value) mobileView.value = 'list';
  }
}

const handleMoreCommand = async (command) => {
  if (command === 'togglePin') {
    const res = await request.post(`/note/pin/${currentNote.value.id}`)
    if (res.code === 200) {
      currentNote.value.isPinned = currentNote.value.isPinned ? 0 : 1
      ElMessage.success(currentNote.value.isPinned ? '已置顶' : '已取消置顶')
      fetchNotes()
    }
  } else if (command === 'exportTxt') {
    const text = currentNote.value.content.replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').trim()
    downloadFile(`${currentNote.value.title}.txt`, text)
  } else if (command === 'exportHtml') {
    const html = `<html><head><meta charset="utf-8"><title>${currentNote.value.title}</title></head><body><h1>${currentNote.value.title}</h1>${currentNote.value.content}</body></html>`
    downloadFile(`${currentNote.value.title}.html`, html)
  }
}

const downloadFile = (filename, content) => {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

const goBackToList = async () => { 
  if (!(await checkDirtyAndConfirm())) return
  mobileView.value = 'list' 
}

let autoSaveTimer = null
const triggerAutoSave = () => {
  if (isPreviewMode.value || isTrashMode.value || !isDirty.value || !currentNote.value.title?.trim()) return
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  autoSaveTimer = setTimeout(async () => {
    autoSaving.value = true
    const success = await saveNote(true) 
    autoSaving.value = false
  }, 2000)
}

watch(() => currentNote.value.content, triggerAutoSave)
watch(() => currentNote.value.title, triggerAutoSave)

const saveToLocalDraft = () => {
  if (isDirty.value) {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(currentNote.value))
    isLocalDraft.value = true
  }
}

window.addEventListener('beforeunload', () => saveToLocalDraft())

const handleKeydown = (e) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    if (!isPreviewMode.value && !isTrashMode.value) saveNote()
  }
}

const checkLocalDraftOnLoad = () => {
  const draftStr = localStorage.getItem(DRAFT_KEY)
  if (draftStr) {
    try {
      const draft = JSON.parse(draftStr)
      if (draft.title || draft.content) {
        ElMessageBox.confirm('检测到上次意外退出或断网时留下的未同步草稿，是否立即载入？（取消将清空草稿）', '离线草稿恢复', {
          confirmButtonText: '载入草稿', cancelButtonText: '放弃并清空', type: 'warning'
        }).then(() => {
          currentNote.value = draft
          originalNoteStr.value = '' 
          isPreviewMode.value = false
          isEditingNew.value = !draft.id
          isLocalDraft.value = true
          if (editorRef.value) editorRef.value.enable()
          ElMessage.success('已载入离线草稿，请尽快【同步云端】')
        }).catch(() => {
          localStorage.removeItem(DRAFT_KEY)
        })
      }
    } catch { localStorage.removeItem(DRAFT_KEY) }
  }
}

onMounted(() => {
  checkMobile()
  window.addEventListener('resize', checkMobile)
  window.addEventListener('keydown', handleKeydown)
  fetchNotes()
  checkLocalDraftOnLoad()
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkMobile)
  window.removeEventListener('keydown', handleKeydown)
  if (autoSaveTimer) clearTimeout(autoSaveTimer)
  saveToLocalDraft()
})
</script>

<style scoped>
.cyberpunk-theme {
  --cyber-bg: #0a1023;
  --cyber-border: rgba(0, 243, 255, 0.2);
  --cyber-glow: 0 0 10px rgba(0, 243, 255, 0.3);
  --neon-cyan: #00f3ff;
  --text-primary: #e2e8f0;
  --text-secondary: #94a3b8;
  --warning-color: #e6a23c;
}

.note-container { height: calc(100vh - 100px); padding: 10px; background-color: var(--cyber-bg); color: var(--text-primary); font-family: 'Helvetica Neue', Helvetica, sans-serif;}
.full-height { height: 100%; }
.sidebar-col, .editor-col { height: 100%; }

.cyber-card { 
  height: 100%; background: rgba(13, 20, 36, 0.8) !important; 
  backdrop-filter: blur(20px) !important; border: 1px solid var(--cyber-border) !important; box-shadow: var(--cyber-glow) !important;
  display: flex; flex-direction: column; overflow: hidden; transition: all 0.3s;
}
:deep(.el-card__body) { flex: 1; display: flex; flex-direction: column; padding: 0; overflow: hidden; }

.sidebar-header { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; border-bottom: 1px solid rgba(0, 243, 255, 0.1); }
.glow-title { margin: 0; font-size: 18px; color: #fff; text-shadow: 0 0 10px var(--neon-cyan); display: flex; align-items: center; gap: 8px;}
.count-badge { font-size: 14px; color: var(--text-secondary); font-weight: normal; text-shadow: none; }
.header-actions { display: flex; gap: 10px; }
.neon-btn-circle { background: rgba(0, 243, 255, 0.1) !important; border: 1px solid rgba(0, 243, 255, 0.4) !important; color: var(--neon-cyan) !important; }

.search-box { padding: 15px 20px 5px 20px; }
.note-list-scroll { flex: 1; padding: 10px 15px; }
.note-item { padding: 12px 15px; border-radius: 8px; margin-bottom: 10px; cursor: pointer; border: 1px solid transparent; transition: all 0.2s; background: rgba(255, 255, 255, 0.03); }
.note-item:hover { background: rgba(0, 243, 255, 0.05); border-color: rgba(0, 243, 255, 0.2); }
.note-item.is-active { background: rgba(0, 243, 255, 0.1); border-color: var(--neon-cyan); box-shadow: inset 0 0 10px rgba(0, 243, 255, 0.1); }
.note-item.is-pinned { border-left: 3px solid var(--warning-color); }
.note-title { font-weight: bold; font-size: 15px; color: var(--text-primary); margin-bottom: 8px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: flex; align-items: center; gap: 6px;}
.pin-icon { color: var(--warning-color); font-size: 14px; }
.note-meta { display: flex; justify-content: space-between; align-items: center; font-size: 12px; color: var(--text-secondary); }
.cyber-tag { background: rgba(0, 243, 255, 0.05) !important; border: 1px solid rgba(0, 243, 255, 0.2) !important; color: var(--neon-cyan) !important; cursor: crosshair; }
.cyber-tag:hover { background: var(--neon-cyan) !important; color: #000 !important; }

.empty-editor { display: flex; flex-direction: column; justify-content: center; align-items: center; height: 100%; color: var(--text-secondary); }
.huge-icon { font-size: 60px; margin-bottom: 20px; opacity: 0.5; color: var(--neon-cyan); }
.editor-content { display: flex; flex-direction: column; height: 100%; }
.editor-header { display: flex; justify-content: space-between; align-items: center; padding: 10px 20px; border-bottom: 1px solid rgba(0, 243, 255, 0.1); gap: 15px; }
.action-group { display: flex; gap: 10px; align-items: center; flex-shrink: 0; flex-wrap: nowrap; }

:deep(.title-input .el-input__inner) { font-weight: bold; color: var(--neon-cyan) !important; cursor: text !important; transition: color 0.3s;}
:deep(.editor-card.view-mode-style .title-input .el-input__inner) { color: #fff !important; cursor: default !important; font-size: 24px !important; text-shadow: 0 0 10px rgba(255,255,255,0.2); }

.word-count-display { display: flex; align-items: center; white-space: nowrap; flex-shrink: 0; }
.text-warning { color: var(--warning-color); font-weight: bold; }
.font-size-ctrl { display: flex; align-items: center; gap: 10px; background: rgba(0,0,0,0.3); padding: 0 15px; border-radius: 20px; border: 1px solid rgba(0, 243, 255, 0.1); }
.font-size-ctrl .text-gray { color: var(--text-secondary); font-weight: bold; }
.mode-toggle-btn { color: var(--text-secondary) !important; font-weight: bold; letter-spacing: 1px; }
.mode-toggle-btn:hover { color: var(--neon-cyan) !important; text-shadow: 0 0 5px var(--neon-cyan); }
.more-btn { font-size: 18px; color: var(--text-secondary); }
.more-btn:hover { color: var(--neon-cyan); }

.tags-input-area { display: flex; align-items: center; padding: 5px 20px; background: rgba(0, 0, 0, 0.15); }
.tag-icon { font-size: 18px; color: var(--neon-cyan); margin-right: 10px; }
:deep(.editor-card.view-mode-style .tags-input-area) { opacity: 0.6; }

.textarea-wrapper { flex: 1; padding: 0; display: flex; flex-direction: column; position: relative; overflow-y: hidden;}

:deep(.cyber-input .el-input__wrapper), :deep(.cyber-input-transparent .el-input__wrapper) { background-color: rgba(0, 0, 0, 0.4) !important; border: 1px solid rgba(0, 243, 255, 0.2) !important; box-shadow: none !important; }
:deep(.cyber-input-transparent .el-input__wrapper) { background-color: transparent !important; border: none !important; }
:deep(.cyber-input .el-input__wrapper.is-focus) { border-color: var(--neon-cyan) !important; }

:deep(.w-e-text-container) { background-color: transparent !important; }
:deep(.cyber-wangeditor-toolbar) { background-color: rgba(0, 0, 0, 0.4) !important; border: none !important; }
:deep(.cyber-wangeditor-toolbar .w-e-bar-item button) { color: var(--text-secondary) !important; }
:deep(.cyber-wangeditor-toolbar .w-e-bar-item button:hover) { color: var(--neon-cyan) !important; background-color: rgba(0, 243, 255, 0.08) !important; }
:deep(.cyber-wangeditor-toolbar .w-e-bar-item.w-e-active button) { color: var(--neon-cyan) !important; }

:deep(.w-e-text-container [contenteditable]) { padding: 15px 20px !important; color: #e2e8f0; line-height: 1.6; }
:deep(.editor-card.view-mode-style .w-e-text-container [contenteditable]) { padding: 30px 50px !important; line-height: 1.8; color: #f8fafc; }
:deep(.w-e-text-container [contenteditable]::-webkit-scrollbar) { width: 5px; background: rgba(0,0,0,0.1); }
:deep(.w-e-text-container [contenteditable]::-webkit-scrollbar-thumb) { background: rgba(0, 243, 255, 0.2); border-radius: 3px; }

:deep(.w-e-text-container img) { max-width: 100%; border-radius: 8px; }

.cyber-dropdown { background: rgba(13, 20, 36, 0.95) !important; border: 1px solid var(--cyber-border) !important; backdrop-filter: blur(10px); }
:deep(.el-dropdown-menu__item) { color: var(--text-primary) !important; }
:deep(.el-dropdown-menu__item:hover) { background: rgba(0, 243, 255, 0.1) !important; color: var(--neon-cyan) !important; }

@media screen and (max-width: 768px) {
  .note-container { padding: 5px; height: calc(100vh - 70px); }
  .editor-header { flex-wrap: wrap; }
  .action-group { width: 100%; justify-content: flex-end; }
  :deep(.editor-card.view-mode-style .w-e-text-container [contenteditable]) { padding: 15px 15px !important; }
}
</style>

<style>
.w-e-bar.w-e-toolbar { background-color: rgba(10, 16, 35, 0.95) !important; border-bottom: 1px solid rgba(0, 243, 255, 0.15) !important; }
.w-e-bar.w-e-toolbar .w-e-bar-item button { color: #94a3b8 !important; }
.w-e-bar.w-e-toolbar .w-e-bar-item button:hover { color: #00f3ff !important; background: rgba(0, 243, 255, 0.08) !important; }
.w-e-drop-panel { background: rgba(10, 16, 35, 0.98) !important; border: 1px solid rgba(0, 243, 255, 0.25) !important; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6) !important; }
.w-e-drop-panel .w-e-panel-tab-title { color: #94a3b8 !important; border-bottom-color: rgba(0, 243, 255, 0.1) !important; }
.w-e-drop-panel .w-e-panel-tab-title.active { color: #00f3ff !important; border-bottom-color: #00f3ff !important; }
.w-e-drop-panel .w-e-panel-tab-content { color: #e2e8f0 !important; }
.w-e-drop-panel input { background: rgba(0, 0, 0, 0.5) !important; border: 1px solid rgba(0, 243, 255, 0.2) !important; color: #e2e8f0 !important; border-radius: 4px; }
.w-e-drop-panel button { background: rgba(0, 243, 255, 0.1) !important; border: 1px solid rgba(0, 243, 255, 0.3) !important; color: #00f3ff !important; border-radius: 4px; }
.w-e-bar-item-menus-container { background: rgba(10, 16, 35, 0.98) !important; border: 1px solid rgba(0, 243, 255, 0.2) !important; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5) !important; }
.w-e-bar-item-menus-container .w-e-bar-item button { color: #94a3b8 !important; }
.w-e-bar-item-menus-container .w-e-bar-item button:hover { background: rgba(0, 243, 255, 0.1) !important; color: #00f3ff !important; }
</style>