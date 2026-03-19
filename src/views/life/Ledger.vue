<template>
  <div class="ledger-container">
    <!-- 汇总卡片 -->
    <div class="summary-bar">
      <div class="summary-card income">
        <div class="card-icon">💰</div>
        <div class="card-body">
          <div class="label">本月收入</div>
          <div class="amount">+{{ fmt(summary.income) }}</div>
        </div>
      </div>
      <div class="summary-card expense">
        <div class="card-icon">🛒</div>
        <div class="card-body">
          <div class="label">本月支出</div>
          <div class="amount">-{{ fmt(summary.expense) }}</div>
        </div>
      </div>
      <div class="summary-card balance" :class="{ negative: (summary.balance ?? 0) < 0 }">
        <div class="card-icon">{{ (summary.balance ?? 0) >= 0 ? '📈' : '📉' }}</div>
        <div class="card-body">
          <div class="label">本月结余</div>
          <div class="amount">{{ (summary.balance ?? 0) >= 0 ? '+' : '' }}{{ fmt(summary.balance) }}</div>
        </div>
      </div>
      <div class="summary-card rate">
        <div class="card-icon">📊</div>
        <div class="card-body">
          <div class="label">储蓄率</div>
          <div class="amount">{{ savingRate }}%</div>
        </div>
      </div>
      </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <div class="toolbar-filters">
        <el-date-picker v-model="filterMonth" type="month" value-format="YYYY-MM"
          placeholder="选择月份" clearable @change="fetchAll" style="width:150px" />
        <el-select v-model="filterType" placeholder="全部类型" clearable @change="fetchList" style="width:120px">
          <el-option label="支出" :value="1" />
          <el-option label="收入" :value="2" />
          <el-option label="投资/理财" :value="3" />
          <el-option label="转账" :value="4" />
        </el-select>
        <el-select v-model="filterCategory" placeholder="全部分类" clearable @change="fetchList" style="width:130px">
          <el-option v-for="c in categoryOptions" :key="c" :label="c" :value="c" />
        </el-select>
        <span class="record-count">共 {{ list.length }} 条</span>
      </div>
      <el-button type="primary" @click="handleAdd" class="add-btn">
        <el-icon><Plus /></el-icon> 记一笔
      </el-button>
    </div>

    <!-- 表格（PC） -->
    <el-table :data="list" stripe class="ledger-table pc-only" :row-class-name="rowClass" align="center">
      <el-table-column prop="recordDate" label="日期" width="110" align="center" />
      <el-table-column label="类型" width="95" align="center">
        <template #default="{ row }">
          <el-tag :type="typeTagMap[row.transactionType]?.type" size="small" effect="light">
            {{ typeTagMap[row.transactionType]?.label }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="category" label="分类" width="100" align="center">
        <template #default="{ row }">
          <span class="category-chip">{{ row.category || '-' }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="accountType" label="账户" width="100" align="center" />
      <el-table-column label="金额" width="130" align="center">
        <template #default="{ row }">
          <span :class="amountClass(row.transactionType)">
            {{ row.transactionType === 2 ? '+' : row.transactionType === 4 ? '' : '-' }}{{ row.amount }}
          </span>
        </template>
      </el-table-column>
      <el-table-column prop="remark" label="备注" show-overflow-tooltip min-width="100" align="center" />
      <el-table-column label="操作" width="100" fixed="right" align="center">
        <template #default="{ row }">
          <el-tooltip content="编辑" placement="top">
            <el-icon class="action-icon" @click="handleEdit(row)"><Edit /></el-icon>
          </el-tooltip>
          <el-tooltip content="删除" placement="top">
            <el-icon class="action-icon del" @click="handleDelete(row.id)"><Delete /></el-icon>
          </el-tooltip>
        </template>
      </el-table-column>
    </el-table>

    <!-- 卡片列表（移动端） -->
    <div class="mobile-only record-list">
      <div v-for="row in list" :key="row.id" class="record-card" :class="rowClass({ row })">
        <div class="record-card-top">
          <el-tag :type="typeTagMap[row.transactionType]?.type" size="small" effect="light">{{ typeTagMap[row.transactionType]?.label }}</el-tag>
          <span :class="amountClass(row.transactionType)" class="record-amount">
            {{ row.transactionType === 2 ? '+' : row.transactionType === 4 ? '' : '-' }}{{ row.amount }}
          </span>
        </div>
        <div class="record-card-mid">
          <span class="category-chip">{{ row.category || '-' }}</span>
          <span class="record-account">{{ row.accountType }}</span>
          <span class="record-date">{{ row.recordDate }}</span>
        </div>
        <div class="record-card-bottom" v-if="row.remark">
          <span class="record-remark">{{ row.remark }}</span>
        </div>
        <div class="record-card-actions">
          <el-icon class="action-icon" @click="handleEdit(row)"><Edit /></el-icon>
          <el-icon class="action-icon del" @click="handleDelete(row.id)"><Delete /></el-icon>
        </div>
      </div>
      <div v-if="list.length === 0" class="empty-tip">暂无记录</div>
    </div>

    <!-- 弹窗 -->
    <el-dialog v-model="dialogVisible" :title="form.id ? '编辑记录' : '新增记录'" width="440px" class="responsive-dialog">
      <el-form :model="form" label-width="70px" class="ledger-form">
        <el-form-item label="类型">
          <el-radio-group v-model="form.transactionType" class="type-group">
            <el-radio-button :label="1">💸 支出</el-radio-button>
            <el-radio-button :label="2">💵 收入</el-radio-button>
            <el-radio-button :label="3">📈 投资</el-radio-button>
            <el-radio-button :label="4">🔄 转账</el-radio-button>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="金额">
          <el-input-number v-model="form.amount" :min="0" :precision="2" :step="10" style="width:100%" />
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="form.category" allow-create filterable placeholder="选择或输入分类" style="width:100%">
            <el-option v-for="c in categoryOptions" :key="c" :label="c" :value="c" />
          </el-select>
        </el-form-item>
        <el-form-item label="账户">
          <el-select v-model="form.accountType" allow-create filterable placeholder="选择或输入账户" style="width:100%">
            <el-option v-for="a in accountOptions" :key="a" :label="a" :value="a" />
          </el-select>
        </el-form-item>
        <el-form-item label="日期">
          <el-date-picker v-model="form.recordDate" type="date" value-format="YYYY-MM-DD" style="width:100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.remark" placeholder="可选备注" maxlength="100" show-word-limit />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submit">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { Plus, Edit, Delete } from '@element-plus/icons-vue'
import request from '@/utils/request'
import { ElMessage, ElMessageBox } from 'element-plus'

const list = ref([])
const summary = ref({})
const filterMonth = ref(new Date().toISOString().slice(0, 7))
const filterType = ref(null)
const filterCategory = ref(null)
const dialogVisible = ref(false)
const form = ref({})

const typeTagMap = {
  1: { label: '支出', type: 'danger' },
  2: { label: '收入', type: 'success' },
  3: { label: '投资', type: 'warning' },
  4: { label: '转账', type: 'info' }
}
const categoryOptions = ['餐饮', '交通', '购物', '服饰', '娱乐', '房租', '工资', '奖金', '指数基金', '股票', '其他']
const accountOptions = ['微信', '支付宝', '储蓄卡', '信用卡', '证券账户', '现金']

const fmt = (v) => (Number(v) || 0).toFixed(2)

const savingRate = computed(() => {
  const income = Number(summary.value.income) || 0
  if (income === 0) return '0.0'
  const balance = Number(summary.value.balance) || 0
  return ((balance / income) * 100).toFixed(1)
})

const amountClass = (type) => {
  if (type === 2) return 'income-text'
  if (type === 3) return 'invest-text'
  if (type === 4) return 'transfer-text'
  return 'expense-text'
}

const rowClass = ({ row }) => {
  if (row.transactionType === 2) return 'row-income'
  if (row.transactionType === 3) return 'row-invest'
  return ''
}

const fetchList = async () => {
  const res = await request.get('/ledger/list', {
    params: { month: filterMonth.value, type: filterType.value || undefined, category: filterCategory.value || undefined }
  })
  if (res.code === 200) list.value = res.data
}

const fetchSummary = async () => {
  const res = await request.get('/ledger/summary', { params: { month: filterMonth.value } })
  if (res.code === 200) summary.value = res.data
}

const fetchAll = () => { fetchList(); fetchSummary() }

const handleAdd = () => {
  form.value = { transactionType: 1, amount: 0, recordDate: new Date().toISOString().slice(0, 10) }
  dialogVisible.value = true
}
const handleEdit = (row) => { form.value = { ...row }; dialogVisible.value = true }

const submit = async () => {
  if (!form.value.amount || !form.value.recordDate) return ElMessage.warning('金额和日期必填')
  const res = await request.post('/ledger/save', form.value)
  if (res.code === 200) { ElMessage.success('保存成功'); dialogVisible.value = false; fetchAll() }
}

const handleDelete = (id) => {
  ElMessageBox.confirm('确定删除这条记录？', '提示', { type: 'warning' }).then(async () => {
    const res = await request.delete(`/ledger/delete/${id}`)
    if (res.code === 200) { ElMessage.success('已删除'); fetchAll() }
  }).catch(() => {})
}

onMounted(fetchAll)
</script>

<style scoped>
.ledger-container { padding: 20px; }

/* 汇总卡 */
.summary-bar { display: grid; grid-template-columns: repeat(auto-fit, minmax(160px, 1fr)); gap: 14px; margin-bottom: 20px; }
.summary-card {
  flex: 1; min-width: 130px;
  display: flex; align-items: center; gap: 14px;
  padding: 16px 20px; border-radius: 14px;
  border: 1px solid transparent;
  transition: transform 0.2s, box-shadow 0.2s;
}
.summary-card:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(0,0,0,0.1); }
.card-icon { font-size: 28px; line-height: 1; }
.card-body .label { font-size: 12px; color: #6b7280; margin-bottom: 4px; }
.card-body .amount { font-size: 20px; font-weight: 700; }

.income { background: rgba(52, 211, 153, 0.08); border-color: rgba(52, 211, 153, 0.25); }
.income .amount { color: #34d399; }
.expense { background: rgba(248, 113, 113, 0.08); border-color: rgba(248, 113, 113, 0.25); }
.expense .amount { color: #f87171; }
.balance { background: rgba(96, 165, 250, 0.08); border-color: rgba(96, 165, 250, 0.25); }
.balance .amount { color: #60a5fa; }
.balance.negative { background: rgba(248, 113, 113, 0.08); border-color: rgba(248, 113, 113, 0.25); }
.balance.negative .amount { color: #f87171; }
.rate { background: rgba(167, 139, 250, 0.08); border-color: rgba(167, 139, 250, 0.25); }
.rate .amount { color: #a78bfa; }

/* 工具栏 */
.toolbar { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; margin-bottom: 16px; flex-wrap: wrap; }
.toolbar-filters { display: flex; gap: 10px; flex-wrap: wrap; align-items: center; flex: 1; }
.add-btn { flex-shrink: 0; align-self: flex-start; }
.record-count { font-size: 13px; color: #6b7280; padding: 0 4px; }

/* 表格 */
.ledger-table { border-radius: 10px; overflow: hidden; }
:deep(.row-income td) { background: rgba(52, 211, 153, 0.06) !important; }
:deep(.row-invest td) { background: rgba(167, 139, 250, 0.06) !important; }

.income-text { color: #34d399; font-weight: 600; }
.expense-text { color: #f87171; font-weight: 600; }
.invest-text { color: #a78bfa; font-weight: 600; }
.transfer-text { color: #60a5fa; font-weight: 600; }

.category-chip {
  background: rgba(255,255,255,0.08); border-radius: 4px;
  padding: 2px 8px; font-size: 12px; color: #cbd5e1;
}

/* 弹窗 */
.type-group { flex-wrap: wrap; }
.ledger-form :deep(.el-form-item) { margin-bottom: 16px; }

.action-icon { cursor: pointer; color: #9ca3af; margin: 0 6px; font-size: 17px; transition: all 0.15s; }
.action-icon:hover { color: #3b82f6; transform: scale(1.15); }
.action-icon.del:hover { color: #ef4444; transform: scale(1.15); }

@media screen and (max-width: 768px) {
  :deep(.responsive-dialog) { width: 95% !important; }
  .ledger-container { padding: 12px; }
  .toolbar { gap: 8px; }
  .toolbar .el-button { margin-left: 0 !important; }
  .record-count { display: none; }
  .pc-only { display: none; }
  .summary-bar { grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 14px; }
  .summary-card { padding: 10px 12px; gap: 10px; }
  .card-icon { font-size: 20px; }
  .card-body .label { font-size: 11px; }
  .card-body .amount { font-size: 16px; }
}
@media screen and (min-width: 769px) {
  .mobile-only { display: none; }
  .summary-toggle { display: none; }
}

/* 折叠按钮 */
.summary-section { margin-bottom: 16px; }
.summary-toggle {
  align-items: center; justify-content: space-between;
  padding: 10px 14px; border-radius: 10px; cursor: pointer;
  background: rgba(255,255,255,0.04); border: 1px solid rgba(0,243,255,0.15);
  font-size: 14px; color: #94a3b8; margin-bottom: 8px;
}
.toggle-icon { transition: transform 0.3s; }
.toggle-icon.collapsed { transform: rotate(-90deg); }
/* 移动端卡片列表 */
.record-list { display: flex; flex-direction: column; gap: 8px; }
.record-card {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 14px;
  padding: 14px 16px;
  backdrop-filter: blur(8px);
  transition: transform 0.2s, box-shadow 0.2s;
}
.record-card:active { transform: scale(0.98); }
.record-card-top {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 10px;
}
.record-amount { font-size: 20px; font-weight: 700; }
.record-card-mid {
  display: flex; gap: 8px; align-items: center;
  font-size: 12px; color: #64748b; margin-bottom: 0;
}
.record-date { margin-left: auto; color: #475569; }
.record-account {
  background: rgba(255,255,255,0.06); border-radius: 4px;
  padding: 2px 7px; color: #94a3b8;
}
.record-card-bottom { margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(255,255,255,0.05); }
.record-remark { font-size: 12px; color: #64748b; font-style: italic; }
.record-card-actions {
  display: flex; justify-content: flex-end; gap: 20px;
  margin-top: 10px; padding-top: 8px;
  border-top: 1px solid rgba(255,255,255,0.05);
}
.empty-tip { text-align: center; color: #64748b; padding: 40px 0; font-size: 14px; }
</style>
