<template>
  <div class="transaction-list">
    <el-card shadow="never">
      <template #header>
        <div class="header-bar">
          <span style="font-size: 16px; font-weight: bold">📋 流水记录</span>
          <div>
            <span style="color: #909399; font-size: 13px; margin-right: 12px">
              近30天：收入 <b style="color:#67c23a">¥{{ monthIncome.toFixed(2) }}</b>
              ｜支出 <b style="color:#f56c6c">¥{{ monthExpense.toFixed(2) }}</b>
            </span>
            <el-button type="primary" @click="showForm = true">➕ 记一笔</el-button>
          </div>
        </div>
      </template>

      <!-- 快捷日期筛选 -->
      <div class="quick-date-bar">
        <el-radio-group v-model="quickDate" size="small" @change="onQuickDate">
          <el-radio value="today">今天</el-radio>
          <el-radio value="yesterday">昨天</el-radio>
          <el-radio value="week">本周</el-radio>
          <el-radio value="month">本月</el-radio>
          <el-radio value="3month">近3月</el-radio>
          <el-radio value="">全部</el-radio>
        </el-radio-group>
        <div class="date-picker-wrap">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始"
            end-placeholder="结束"
            value-format="YYYY-MM-DD"
            size="small"
            @change="onDateRangeChange"
          />
        </div>
      </div>

      <!-- 筛选栏 -->
      <el-form :inline="true" :model="query" size="small" style="margin-top: 8px">
        <el-form-item label="类型">
          <el-select v-model="query.type" placeholder="全部" clearable @change="search" style="width: 90px">
            <el-option label="全部" value="" />
            <el-option label="收入" value="INCOME" />
            <el-option label="支出" value="EXPENSE" />
            <el-option label="转账" value="TRANSFER" />
          </el-select>
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="query.categoryId" placeholder="全部" clearable filterable @change="search" style="width: 140px">
            <el-option label="全部" :value="undefined" />
            <el-option v-for="c in allCategories" :key="c.id" :label="c.name" :value="c.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="query.keyword" placeholder="备注/商家" clearable @clear="search" @keyup.enter="search" style="width: 160px" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="search">🔍 查询</el-button>
          <el-button @click="reset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 交易列表 -->
      <el-table :data="list" stripe v-loading="loading" style="width: 100%">
        <el-table-column label="时间" width="150">
          <template #default="{ row }">
            <span style="font-size: 12px; color: #606266">{{ formatDate(row.transactionTime) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="类型" width="70">
          <template #default="{ row }">
            <el-tag :type="typeTagType(row.type)" size="small" effect="plain">
              {{ typeLabel(row.type) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="分类" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.categoryName" hit size="small" :type="row.type === 'INCOME' ? 'success' : row.type === 'EXPENSE' ? 'danger' : 'warning'">
              {{ row.categoryName }}
            </el-tag>
            <span v-else style="color: #c0c4cc">-</span>
          </template>
        </el-table-column>
        <el-table-column label="金额" width="130">
          <template #default="{ row }">
            <span :style="{ color: row.type === 'INCOME' ? '#67c23a' : row.type === 'EXPENSE' ? '#f56c6c' : '#e6a23c', fontWeight: 700, fontSize: '15px' }">
              {{ row.type === 'INCOME' ? '+' : row.type === 'EXPENSE' ? '-' : '' }}¥{{ row.amount.toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="账户" width="100">
          <template #default="{ row }">
            <span style="color: #606266">{{ row.accountName || '-' }}</span>
          </template>
        </el-table-column>
        <el-table-column prop="note" label="备注" min-width="130" show-overflow-tooltip />
        <el-table-column prop="merchant" label="商家" width="90" show-overflow-tooltip />
        <el-table-column label="操作" width="130" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" size="small" @click="editRow(row)">编辑</el-button>
            <el-popconfirm title="确定删除这笔记录？" @confirm="deleteRow(row.id)">
              <template #reference>
                <el-button text type="danger" size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <div v-if="list.length === 0 && !loading" style="text-align: center; padding: 60px 0; color: #c0c4cc">
        🧾 暂无流水记录，点击「记一笔」开始记账
      </div>

      <!-- 分页 -->
      <div class="pagination">
        <el-pagination
          v-model:current-page="page"
          v-model:page-size="size"
          :total="total"
          :page-sizes="[20, 50, 100]"
          layout="total, sizes, prev, pager, next"
          @change="search"
        />
      </div>
    </el-card>

    <TransactionForm v-model:visible="showForm" :edit-id="editId" @saved="onSaved" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { transactionApi, type TransactionVO, type TransactionQuery } from '@/api/transaction'
import { categoryApi, type Category } from '@/api/category'
import { statsApi } from '@/api/stats'
import TransactionForm from './TransactionForm.vue'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()

const list = ref<TransactionVO[]>([])
const loading = ref(false)
const page = ref(0)
const size = ref(20)
const total = ref(0)
const showForm = ref(false)
const editId = ref<number | undefined>()
const dateRange = ref<string[]>([])
const quickDate = ref('month')
const allCategories = ref<Category[]>([])
const monthIncome = ref(0)
const monthExpense = ref(0)

const query = reactive<TransactionQuery>({
  type: undefined,
  categoryId: undefined,
  keyword: '',
})

function typeLabel(t: string) {
  return t === 'INCOME' ? '收入' : t === 'EXPENSE' ? '支出' : '转账'
}
function typeTagType(t: string) {
  return t === 'INCOME' ? 'success' : t === 'EXPENSE' ? 'danger' : 'warning' as any
}

function formatDate(t: string) {
  if (!t) return ''
  const d = t.substring(0, 16).replace('T', ' ')
  return d
}

function getQuickDateRange(key: string): [string, string] | null {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const d = now.getDate()
  function pad(n: number) { return String(n).padStart(2, '0') }

  if (!key) return null
  if (key === 'today') return [`${y}-${pad(m+1)}-${pad(d)}T00:00:00`, `${y}-${pad(m+1)}-${pad(d)}T23:59:59`]
  if (key === 'yesterday') {
    const yd = new Date(now)
    yd.setDate(d - 1)
    return [`${yd.getFullYear()}-${pad(yd.getMonth()+1)}-${pad(yd.getDate())}T00:00:00`, `${yd.getFullYear()}-${pad(yd.getMonth()+1)}-${pad(yd.getDate())}T23:59:59`]
  }
  if (key === 'week') {
    const day = now.getDay() || 7
    const start = new Date(now)
    start.setDate(d - day + 1)
    const end = new Date(now)
    end.setDate(d + (7 - day))
    return [`${start.getFullYear()}-${pad(start.getMonth()+1)}-${pad(start.getDate())}T00:00:00`, `${end.getFullYear()}-${pad(end.getMonth()+1)}-${pad(end.getDate())}T23:59:59`]
  }
  if (key === 'month') return [`${y}-${pad(m+1)}-01T00:00:00`, new Date(y, m+1, 0).toISOString().substring(0,10)+'T23:59:59']
  if (key === '3month') {
    const start = new Date(y, m-2, 1)
    return [`${start.getFullYear()}-${pad(start.getMonth()+1)}-01T00:00:00`, new Date(y, m+1, 0).toISOString().substring(0,10)+'T23:59:59']
  }
  return null
}

function onQuickDate(val: string) {
  dateRange.value = []
  const range = getQuickDateRange(val)
  if (range) {
    query.startDate = range[0]
    query.endDate = range[1]
  } else {
    query.startDate = undefined
    query.endDate = undefined
  }
  page.value = 0
  search()
}

function onDateRangeChange(val: string[] | null) {
  quickDate.value = ''
  if (val) {
    query.startDate = val[0] + 'T00:00:00'
    query.endDate = val[1] + 'T23:59:59'
  } else {
    query.startDate = undefined
    query.endDate = undefined
  }
  page.value = 0
  search()
}

async function loadCategoryOptions() {
  if (!userStore.currentBook) return
  const [inc, exp] = await Promise.all([
    categoryApi.getTree(userStore.currentBook.id, 'INCOME').catch(() => ({ data: [] as Category[] })),
    categoryApi.getTree(userStore.currentBook.id, 'EXPENSE').catch(() => ({ data: [] as Category[] })),
  ])
  const flat: Category[] = []
  function walk(items: Category[]) {
    for (const item of items) {
      flat.push(item)
      if (item.children) walk(item.children)
    }
  }
  walk((inc as any).data || [])
  walk((exp as any).data || [])
  allCategories.value = flat
}

async function loadMonthStats() {
  if (!userStore.currentBook) return
  const res = await statsApi.overview(userStore.currentBook.id).catch(() => null)
  if (res?.code === 200) {
    monthIncome.value = res.data.income
    monthExpense.value = res.data.expense
  }
}

async function search() {
  if (!userStore.currentBook) {
    ElMessage.warning('请先选择账本')
    return
  }
  loading.value = true
  try {
    const res = await transactionApi.search(userStore.currentBook.id, {
      ...query,
      page: page.value,
      size: size.value,
    })
    if (res.code === 200) {
      list.value = res.data.content
      total.value = res.data.totalElements
    }
  } finally {
    loading.value = false
  }
}

function reset() {
  query.type = undefined
  query.categoryId = undefined
  query.keyword = ''
  query.startDate = undefined
  query.endDate = undefined
  dateRange.value = []
  quickDate.value = 'month'
  page.value = 0
  onQuickDate('month')
}

function editRow(row: TransactionVO) {
  editId.value = row.id
  showForm.value = true
}

async function deleteRow(id: number) {
  try {
    const res = await transactionApi.delete(userStore.currentBook!.id, id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      search()
      loadMonthStats()
    }
  } catch {
    ElMessage.error('删除失败')
  }
}

function onSaved() {
  showForm.value = false
  editId.value = undefined
  search()
  loadMonthStats()
}

// 账本切换时自动刷新
watch(() => userStore.currentBook?.id, () => {
  page.value = 0
  loadCategoryOptions()
  loadMonthStats()
  search()
})

onMounted(() => {
  loadCategoryOptions()
  loadMonthStats()
  // 默认本月
  const range = getQuickDateRange('month')
  if (range) { query.startDate = range[0]; query.endDate = range[1] }
  search()
})
</script>

<style scoped>
.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 8px;
}
.quick-date-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid #f0f0f0;
}
.date-picker-wrap { flex-shrink: 0; }
.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
