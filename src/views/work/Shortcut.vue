<template>
  <div class="shortcut-container">
    <div class="header-action">
      <div class="title-area">
        <h2>🧭 快捷导航</h2>
        <span class="subtitle glow-subtitle">Data Interface & Bookmarks</span>
      </div>
      <el-button type="primary" icon="Plus" @click="openAddDialog" round class="neon-btn">接入新节点</el-button>
    </div>

    <div v-loading="loading" class="grid-wrapper">
      <el-empty v-if="!loading && list.length === 0" description="网络节点空载中，请接入..." />
      
      <div v-for="(items, categoryName) in groupedList" :key="categoryName" class="category-section">
        
        <h3 class="category-title">
          <el-icon class="mr-2"><FolderOpened /></el-icon> 
          {{ categoryName }}
        </h3>
        
        <div class="shortcut-grid">
          <div v-for="item in items" :key="item.id" class="shortcut-card cyber-card" @click="openUrl(item.siteUrl)">
            
            <div class="card-actions" @click.stop>
              <div class="action-btn edit-btn" @click.stop="openEditDialog(item)"><el-icon><Edit /></el-icon></div>
              <div class="action-btn del-btn" @click.stop="handleDelete(item.id)"><el-icon><Delete /></el-icon></div>
            </div>

            <div class="icon-wrapper">
              <el-avatar :size="48" :src="getIcon(item)" shape="square" class="site-icon" @error="() => true">
                <span class="fallback-text">{{ item.siteName ? item.siteName.charAt(0).toUpperCase() : '🌐' }}</span>
              </el-avatar>
            </div>
            <div class="site-title">{{ item.siteName }}</div>
          </div>
        </div>

      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="form.id ? '重写节点数据' : '接入新节点'" class="responsive-dialog" destroy-on-close>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="90px">
        <el-form-item label="节点名称" prop="siteName"><el-input v-model="form.siteName" placeholder="例如：绝区零Wiki" /></el-form-item>
        <el-form-item label="节点链路" prop="siteUrl"><el-input v-model="form.siteUrl" placeholder="需包含协议头 http/https" /></el-form-item>
        <el-form-item label="所属区块" prop="category">
          <el-select v-model="form.category" filterable allow-create default-first-option placeholder="例如：摸鱼区、开发工具" style="width: 100%;">
            <el-option v-for="item in existingCategories" :key="item" :label="item" :value="item" />
          </el-select>
        </el-form-item>
        <el-form-item label="视觉图标">
          <el-input v-model="form.iconUrl" placeholder="留空交由系统智能嗅探">
            <template #append><el-icon><QuestionFilled /></el-icon></template>
          </el-input>
        </el-form-item>
        <el-form-item label="展示权重"><el-input-number v-model="form.sortOrder" :min="0" :step="1" placeholder="越高越靠前" /></el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">中断</el-button>
        <el-button type="primary" @click="submit" :loading="submitLoading">执行写入</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Edit, Delete, Plus, QuestionFilled, FolderOpened } from '@element-plus/icons-vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import request from '@/utils/request'

const loading = ref(false); const submitLoading = ref(false); const dialogVisible = ref(false)
const formRef = ref(null); const list = ref([])
const form = ref({ siteName: '', siteUrl: '', iconUrl: '', category: '', sortOrder: 0 })

const rules = {
  siteName: [{ required: true, message: '节点名称不可为空', trigger: 'blur' }],
  siteUrl: [{ required: true, message: '节点链路不可为空', trigger: 'blur' }, { pattern: /^https?:\/\/.+/, message: '必须以 http:// 或 https:// 开头', trigger: 'blur' }]
}

const groupedList = computed(() => {
  const groups = {}; list.value.forEach(item => { const cat = item.category || '未分配区块'; if (!groups[cat]) groups[cat] = []; groups[cat].push(item) }); return groups
})
const existingCategories = computed(() => { const cats = new Set(); list.value.forEach(item => { if (item.category) cats.add(item.category) }); return Array.from(cats) })

const getIcon = (item) => {
  if (item.iconUrl) return item.iconUrl
  try {
    const host = new URL(item.siteUrl).hostname
    if (host === 'localhost' || host === '127.0.0.1' || host.startsWith('192.168.') || host.startsWith('10.')) return '' 
    return `https://api.vvhan.com/api/ico?url=${host}`
  } catch (e) { return '' }
}

const openUrl = (url) => { window.open(url, '_blank') }
const fetchList = async () => { loading.value = true; try { const res = await request.get('/shortcut/list'); if (res.code === 200) list.value = res.data } finally { loading.value = false } }
const openAddDialog = () => { form.value = { siteName: '', siteUrl: '', iconUrl: '', category: '主节点区', sortOrder: 0 }; dialogVisible.value = true }
const openEditDialog = (item) => { form.value = { ...item }; dialogVisible.value = true }
const submit = () => { formRef.value.validate(async (valid) => { if (valid) { submitLoading.value = true; try { const isEdit = !!form.value.id; const res = await request[isEdit ? 'put' : 'post'](isEdit ? '/shortcut/update' : '/shortcut/add', form.value); if (res.code === 200) { ElMessage.success('节点已同步'); dialogVisible.value = false; fetchList() } } finally { submitLoading.value = false } } }) }
const handleDelete = (id) => { ElMessageBox.confirm('即将切断该节点连接，确认？', '警告', { type: 'warning' }).then(async () => { const res = await request.delete(`/shortcut/delete/${id}`); if (res.code === 200) { ElMessage.success('连接已切断'); fetchList() } }).catch(() => {}) }
onMounted(() => { fetchList() })
</script>

<style scoped>
.shortcut-container { padding: 10px 20px; }
.header-action { display: flex; justify-content: space-between; align-items: center; margin-bottom: 30px; }
.title-area h2 { margin: 0 0 5px 0; color: #fff; font-size: 24px; text-shadow: 0 0 10px rgba(0, 243, 255, 0.6); }
.glow-subtitle { color: #00f3ff; text-transform: uppercase; font-size: 12px; letter-spacing: 2px; }

.category-section { margin-bottom: 40px; }
.category-title {
  display: flex; align-items: center; font-size: 18px; color: #e2e8f0;
  margin-bottom: 20px; padding-bottom: 8px; border-bottom: 1px solid rgba(0, 243, 255, 0.2);
}
.mr-2 { margin-right: 8px; color: #00f3ff; }

/* 🌟 核心：流体网格布局（完美适配 PC 到手机所有屏幕） */
.shortcut-grid {
  display: grid;
  /* 最小宽160px，放不下就自动换行 */
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 20px;
}

/* 赛博朋克风卡片 */
.cyber-card {
  position: relative;
  background: rgba(13, 20, 36, 0.4);
  border-radius: 8px;
  padding: 20px 10px;
  display: flex; flex-direction: column; align-items: center; text-align: center;
  cursor: pointer;
  border: 1px solid rgba(0, 243, 255, 0.1);
  box-shadow: inset 0 0 20px rgba(0, 243, 255, 0.02);
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
  overflow: hidden;
}
.cyber-card:hover {
  transform: translateY(-4px);
  background: rgba(13, 20, 36, 0.8);
  box-shadow: 0 8px 24px rgba(0, 243, 255, 0.2), inset 0 0 15px rgba(0, 243, 255, 0.1);
  border-color: #00f3ff;
}

.icon-wrapper { margin-bottom: 12px; padding: 10px; background: rgba(0, 243, 255, 0.05); border-radius: 12px; border: 1px solid rgba(0, 243, 255, 0.1); transition: all 0.3s; }
.cyber-card:hover .icon-wrapper { background: rgba(0, 243, 255, 0.15); box-shadow: 0 0 15px rgba(0, 243, 255, 0.3); }
.site-icon { background-color: transparent !important; }

/* 兜底首字样式 */
.fallback-text {
  font-size: 24px; font-weight: bold; color: #00f3ff;
  background: rgba(0, 243, 255, 0.1);
  width: 100%; height: 100%; display: flex; align-items: center; justify-content: center;
  text-shadow: 0 0 5px rgba(0, 243, 255, 0.5);
}

.site-title { font-size: 14px; font-weight: bold; color: #e2e8f0; width: 100%; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

.card-actions { position: absolute; top: 10px; right: 10px; display: flex; gap: 5px; opacity: 0; transform: translateY(-10px); transition: all 0.3s ease; }
.cyber-card:hover .card-actions { opacity: 1; transform: translateY(0); }
.action-btn { width: 26px; height: 26px; border-radius: 50%; display: flex; justify-content: center; align-items: center; background: rgba(13, 20, 36, 0.9); color: #e2e8f0; border: 1px solid rgba(0, 243, 255, 0.2); transition: all 0.2s; }
.edit-btn:hover { color: #00f3ff; border-color: #00f3ff; box-shadow: 0 0 8px #00f3ff; }
.del-btn:hover { color: #F56C6C; border-color: #F56C6C; box-shadow: 0 0 8px #F56C6C; }
@media (hover: none) { .card-actions { opacity: 1; transform: translateY(0); } }

:deep(.responsive-dialog) { width: 500px; border-radius: 8px; }

/* 极限移动端压缩 */
@media screen and (max-width: 768px) {
  .shortcut-container { padding: 10px; }
  .category-title { font-size: 16px; margin-bottom: 15px; }
  
  /* 手机端改变最小宽度，保证一排 3 个或 2 个舒适显示 */
  .shortcut-grid { grid-template-columns: repeat(auto-fill, minmax(105px, 1fr)); gap: 12px; }
  
  .cyber-card { padding: 12px 8px; border-radius: 6px; }
  .icon-wrapper { margin-bottom: 8px; padding: 6px; }
  :deep(.el-avatar) { width: 40px !important; height: 40px !important; }
  .fallback-text { font-size: 20px; }
  .site-title { font-size: 12px; }
  
  :deep(.responsive-dialog) { width: 90% !important; }
}
</style>