<template>
  <div class="transaction-list">
    <el-card shadow="never">
      <template #header>
        <div class="header-bar">
          <span style="font-size: 16px; font-weight: bold">流水记录</span>
          <el-button type="primary" @click="showForm = true">记一笔</el-button>
        </div>
      </template>

      <!-- 筛选栏 -->
      <el-form :inline="true" :model="query" size="small">
        <el-form-item label="日期">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            value-format="YYYY-MM-DD"
            @change="onDateChange"
          />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="query.type" placeholder="全部" clearable @change="search">
            <el-option label="全部" value="" />
            <el-option label="收入" value="INCOME" />
            <el-option label="支出" value="EXPENSE" />
            <el-option label="转账" value="TRANSFER" />
          </el-select>
        </el-form-item>
        <el-form-item label="分类">
          <el-select v-model="query.categoryId" placeholder="全部" clearable filterable @change="search">
            <el-option label="全部" :value="undefined" />
          </el-select>
        </el-form-item>
        <el-form-item label="关键词">
          <el-input v-model="query.keyword" placeholder="备注/商家" clearable @clear="search" @keyup.enter="search" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="search">查询</el-button>
          <el-button @click="reset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 交易列表 -->
      <el-table :data="list" stripe v-loading="loading" style="width: 100%">
        <el-table-column label="时间" width="160">
          <template #default="{ row }">
            {{ formatTime(row.transactionTime) }}
          </template>
        </el-table-column>
        <el-table-column label="类型" width="80">
          <template #default="{ row }">
            <el-tag :type="row.type === 'INCOME' ? 'success' : row.type === 'EXPENSE' ? 'danger' : 'warning'" size="small">
              {{ row.type === 'INCOME' ? '收入' : row.type === 'EXPENSE' ? '支出' : '转账' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="分类" width="100">
          <template #default="{ row }"> {{ row.categoryId || '-' }} </template>
        </el-table-column>
        <el-table-column label="金额" width="120">
          <template #default="{ row }">
            <span :style="{ color: row.type === 'INCOME' ? '#67c23a' : row.type === 'EXPENSE' ? '#f56c6c' : '#e6a23c', fontWeight: 'bold' }">
              {{ row.type === 'INCOME' ? '+' : row.type === 'EXPENSE' ? '-' : '' }}¥{{ row.amount.toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="note" label="备注" min-width="150" show-overflow-tooltip />
        <el-table-column prop="merchant" label="商家" width="120" show-overflow-tooltip />
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" size="small" @click="editRow(row)">编辑</el-button>
            <el-popconfirm title="确定删除？" @confirm="deleteRow(row.id)">
              <template #reference>
                <el-button text type="danger" size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

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
import { ref, reactive, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { transactionApi, type Transaction, type TransactionQuery } from '@/api/transaction'
import TransactionForm from './TransactionForm.vue'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()

const list = ref<Transaction[]>([])
const loading = ref(false)
const page = ref(0)
const size = ref(20)
const total = ref(0)
const showForm = ref(false)
const editId = ref<number | undefined>()
const dateRange = ref<string[]>([])

const query = reactive<TransactionQuery>({
  type: undefined,
  categoryId: undefined,
  keyword: '',
})

function formatTime(t: string) {
  if (!t) return ''
  return t.substring(0, 16).replace('T', ' ')
}

function onDateChange(val: string[] | null) {
  if (val) {
    query.startDate = val[0] + 'T00:00:00'
    query.endDate = val[1] + 'T23:59:59'
  } else {
    query.startDate = undefined
    query.endDate = undefined
  }
  search()
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
  page.value = 0
  search()
}

function editRow(row: Transaction) {
  editId.value = row.id
  showForm.value = true
}

async function deleteRow(id: number) {
  try {
    const res = await transactionApi.delete(userStore.currentBook!.id, id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      search()
    }
  } catch {
    ElMessage.error('删除失败')
  }
}

function onSaved() {
  showForm.value = false
  editId.value = undefined
  search()
}

onMounted(() => search())
</script>

<style scoped>
.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.pagination {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}
</style>
