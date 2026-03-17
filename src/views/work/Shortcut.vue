<template>
  <div class="shortcut-container">
    <div class="header-action">
      <div class="title-area">
        <h2>🧭 快捷导航</h2>
        <span class="subtitle">属于你的云端效率书签</span>
      </div>
      <el-button type="primary" icon="Plus" @click="openAddDialog" round>添加网址</el-button>
    </div>

    <div v-loading="loading" class="grid-wrapper">
      <el-empty v-if="!loading && list.length === 0" description="暂无快捷导航，快去添加一个吧！" />
      
      <div v-for="(items, categoryName) in groupedList" :key="categoryName" class="category-section">
        
        <h3 class="category-title">
          <el-icon class="mr-2"><FolderOpened /></el-icon> 
          {{ categoryName }}
        </h3>
        
        <el-row :gutter="20">
          <el-col :xs="12" :sm="8" :md="6" :lg="4" v-for="item in items" :key="item.id" class="mb-20">
            <div class="shortcut-card" @click="openUrl(item.siteUrl)">
              
              <div class="card-actions" @click.stop>
                <div class="action-btn edit-btn" @click.stop="openEditDialog(item)">
                  <el-icon><Edit /></el-icon>
                </div>
                <div class="action-btn del-btn" @click.stop="handleDelete(item.id)">
                  <el-icon><Delete /></el-icon>
                </div>
              </div>

              <div class="icon-wrapper">
                <el-avatar 
                  :size="54" 
                  :src="getIcon(item)" 
                  shape="square" 
                  class="site-icon"
                  @error="() => true"
                >
                  <span class="fallback-text">{{ item.siteName ? item.siteName.charAt(0).toUpperCase() : '🌐' }}</span>
                </el-avatar>
              </div>
              <div class="site-title">{{ item.siteName }}</div>
            </div>
          </el-col>
        </el-row>
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑网址' : '添加网址'" class="responsive-dialog" destroy-on-close>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="90px">
        <el-form-item label="网站名称" prop="siteName">
          <el-input v-model="form.siteName" placeholder="例如：绝区零Wiki / GitHub" />
        </el-form-item>
        <el-form-item label="网站链接" prop="siteUrl">
          <el-input v-model="form.siteUrl" placeholder="必须以 http:// 或 https:// 开头" />
        </el-form-item>
        <el-form-item label="分类分组" prop="category">
          <el-select v-model="form.category" filterable allow-create default-first-option placeholder="例如：常用工具、摸鱼、资讯" style="width: 100%;">
            <el-option v-for="item in existingCategories" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="网站图标">
          <el-input v-model="form.iconUrl" placeholder="留空则系统自动抓取该网站图标">
            <template #append>
              <el-tooltip content="输入图片URL地址，或留空智能抓取" placement="top">
                <el-icon><QuestionFilled /></el-icon>
              </el-tooltip>
            </template>
          </el-input>
        </el-form-item>
        <el-form-item label="显示排序">
          <el-input-number v-model="form.sortOrder" :min="0" :step="1" placeholder="越大越靠前" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submit" :loading="submitLoading">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Edit, Delete, Plus, QuestionFilled, FolderOpened } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const formRef = ref(null)
const list = ref([])

const form = ref({ siteName: '', siteUrl: '', iconUrl: '', category: '', sortOrder: 0 })

const rules = {
  siteName: [{ required: true, message: '请输入网站名称', trigger: 'blur' }],
  siteUrl: [
    { required: true, message: '请输入网站链接', trigger: 'blur' },
    { pattern: /^https?:\/\/.+/, message: '链接必须以 http:// 或 https:// 开头', trigger: 'blur' }
  ]
}

const groupedList = computed(() => {
  const groups = {}
  list.value.forEach(item => {
    const cat = item.category || '未分类'
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(item)
  })
  return groups
})

const existingCategories = computed(() => {
  const cats = new Set()
  list.value.forEach(item => {
    if (item.category) cats.add(item.category)
  })
  return Array.from(cats)
})

const getIcon = (item) => {
  if (item.iconUrl) return item.iconUrl
  
  try {
    const urlObj = new URL(item.siteUrl)
    const host = urlObj.hostname
    
    if (host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.') || host.startsWith('10.')) {
      return '' // 返回空字符串，强制触发 el-avatar 的 @error，显示首字
    }

    return `https://api.vvhan.com/api/ico?url=${host}`
  } catch (e) {
    return ''
  }
}

const openUrl = (url) => {
  window.open(url, '_blank')
}

const fetchList = async () => {
  loading.value = true
  try {
    const res = await request.get('/shortcut/list')
    if (res.code === 200) list.value = res.data
  } finally {
    loading.value = false
  }
}

const openAddDialog = () => {
  form.value = { siteName: '', siteUrl: '', iconUrl: '', category: '常用工具', sortOrder: 0 }
  dialogVisible.value = true
}

const openEditDialog = (item) => {
  form.value = { ...item }
  dialogVisible.value = true
}

const submit = () => {
  formRef.value.validate(async (valid) => {
    if (valid) {
      submitLoading.value = true
      try {
        const isEdit = !!form.value.id
        const res = await request[isEdit ? 'put' : 'post'](isEdit ? '/shortcut/update' : '/shortcut/add', form.value)
        if (res.code === 200) {
          ElMessage.success(isEdit ? '修改成功' : '添加成功')
          dialogVisible.value = false
          fetchList()
        }
      } finally {
        submitLoading.value = false
      }
    }
  })
}

const handleDelete = (id) => {
  ElMessageBox.confirm('确定要删除这个网址吗?', '提示', { type: 'warning' }).then(async () => {
    const res = await request.delete(`/shortcut/delete/${id}`)
    if (res.code === 200) {
      ElMessage.success('已删除')
      fetchList()
    }
  }).catch(() => {})
}

onMounted(() => {
  fetchList()
})
</script>

<style scoped>
.shortcut-container { padding: 10px 20px; }

.header-action { 
  display: flex; justify-content: space-between; align-items: center; 
  margin-bottom: 30px; 
}
.title-area h2 { margin: 0 0 5px 0; color: #303133; font-size: 22px; }
.subtitle { font-size: 13px; color: #909399; }

.category-section {
  margin-bottom: 40px;
}
.category-title {
  display: flex;
  align-items: center;
  font-size: 18px;
  color: #303133;
  margin-bottom: 20px;
  padding-bottom: 8px;
  border-bottom: 2px solid #ebeef5;
}
.mr-2 { margin-right: 8px; }
.mb-20 { margin-bottom: 20px; }

.shortcut-card {
  position: relative;
  background: #ffffff;
  border-radius: 12px;
  padding: 20px 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  cursor: pointer;
  border: 1px solid #ebeef5;
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  overflow: hidden;
}

.shortcut-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.08);
  border-color: #c6e2ff;
}

.icon-wrapper {
  margin-bottom: 12px;
  padding: 10px;
  background: #f5f7fa;
  border-radius: 16px;
  transition: background 0.3s;
}
.shortcut-card:hover .icon-wrapper {
  background: #ecf5ff;
}

.site-icon {
  background-color: transparent !important;
}
.fallback-text {
  font-size: 26px;
  font-weight: bold;
  color: #409EFF;
  background: #ecf5ff;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
}

.site-title {
  font-size: 14px;
  font-weight: bold;
  color: #303133;
  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.card-actions {
  position: absolute;
  top: 10px;
  right: 10px;
  display: flex;
  gap: 5px;
  opacity: 0;
  transform: translateY(-10px);
  transition: all 0.3s ease;
}
.shortcut-card:hover .card-actions {
  opacity: 1;
  transform: translateY(0);
}

.action-btn {
  width: 26px;
  height: 26px;
  border-radius: 50%;
  display: flex;
  justify-content: center;
  align-items: center;
  background: rgba(255, 255, 255, 0.9);
  color: #606266;
  box-shadow: 0 2px 6px rgba(0,0,0,0.1);
  transition: all 0.2s;
}
.edit-btn:hover { color: #409EFF; background: #ecf5ff; }
.del-btn:hover { color: #F56C6C; background: #fef0f0; }

@media (hover: none) {
  .card-actions {
    opacity: 1;
    transform: translateY(0);
  }
}

:deep(.responsive-dialog) { width: 500px; border-radius: 12px; }
@media screen and (max-width: 768px) {
  .shortcut-container { padding: 10px; }
  .category-title { font-size: 16px; }
  :deep(.responsive-dialog) { width: 90% !important; }
}
</style>