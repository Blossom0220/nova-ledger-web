<template>
  <div class="dashboard">
    <!-- 概览卡片 -->
    <el-row :gutter="20">
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-label">本月收入</div>
            <div class="stat-value income">¥{{ overview.income.toFixed(2) }}</div>
            <div class="stat-change" :class="overview.incomeChange >= 0 ? 'up' : 'down'">
              环比 {{ overview.incomeChange >= 0 ? '+' : '' }}{{ overview.incomeChange.toFixed(1) }}%
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-label">本月支出</div>
            <div class="stat-value expense">¥{{ overview.expense.toFixed(2) }}</div>
            <div class="stat-change" :class="overview.expenseChange >= 0 ? 'up' : 'down'">
              环比 {{ overview.expenseChange >= 0 ? '+' : '' }}{{ overview.expenseChange.toFixed(1) }}%
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-label">本月结余</div>
            <div class="stat-value" :class="overview.balance >= 0 ? 'income' : 'expense'">
              ¥{{ overview.balance.toFixed(2) }}
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :span="6">
        <el-card shadow="hover">
          <div class="stat-item">
            <div class="stat-label">账户余额</div>
            <div class="stat-value">---</div>
            <div class="stat-change">查看详情</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 图表 -->
    <el-row :gutter="20" style="margin-top: 20px">
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header><span>收支趋势（本月）</span></template>
          <div ref="trendChart" style="height: 300px"></div>
        </el-card>
      </el-col>
      <el-col :span="12">
        <el-card shadow="hover">
          <template #header><span>支出分类（本月）</span></template>
          <div ref="categoryChart" style="height: 300px"></div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 快捷记账 -->
    <el-card shadow="hover" style="margin-top: 20px">
      <template #header>
        <span>快捷记账</span>
        <el-button text type="primary" @click="showQuickForm = true">记一笔</el-button>
      </template>
      <el-empty v-if="!showQuickForm" :description="'点击「记一笔」快速记录收支'" />
    </el-card>

    <!-- 快捷记账弹窗 -->
    <TransactionForm v-model:visible="showQuickForm" @saved="onTransactionSaved" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick } from 'vue'
import { useUserStore } from '@/stores/user'
import TransactionForm from '@/views/transactions/TransactionForm.vue'
import * as echarts from 'echarts'

const userStore = useUserStore()

const overview = reactive({
  income: 0, expense: 0, balance: 0,
  incomeChange: 0, expenseChange: 0,
  lastIncome: 0, lastExpense: 0,
})

const showQuickForm = ref(false)
const trendChart = ref<HTMLElement>()
const categoryChart = ref<HTMLElement>()

async function loadStats() {
  if (!userStore.currentBook) return
  try {
    const res = await fetch(`/api/ledger/books/${userStore.currentBook.id}/stats/overview`, {
      headers: { Authorization: `Bearer ${userStore.token}` },
    }).then(r => r.json())
    if (res.code === 200) {
      Object.assign(overview, res.data)
    }
  } catch {}
}

function onTransactionSaved() {
  showQuickForm.value = false
  loadStats()
}

onMounted(async () => {
  if (!userStore.books.length) await userStore.fetchBooks()
  loadStats()
})
</script>

<style scoped>
.stat-item { text-align: center; }
.stat-label { font-size: 13px; color: #909399; margin-bottom: 8px; }
.stat-value { font-size: 28px; font-weight: bold; margin-bottom: 4px; }
.stat-value.income { color: #67c23a; }
.stat-value.expense { color: #f56c6c; }
.stat-change { font-size: 12px; }
.stat-change.up { color: #f56c6c; }
.stat-change.down { color: #67c23a; }
</style>
