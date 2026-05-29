<template>
  <div class="dashboard">
    <!-- 概览卡片 -->
    <el-row :gutter="16">
      <el-col :xs="12" :sm="6">
        <el-card shadow="hover" :body-style="{ padding: '16px' }">
          <div class="stat-item">
            <div class="stat-icon" style="background:#e8f5e9"><el-icon :size="22" color="#67c23a"><Top /></el-icon></div>
            <div class="stat-body">
              <div class="stat-label">本月收入</div>
              <div class="stat-value income">¥{{ overview.income.toFixed(2) }}</div>
              <div class="stat-change" :class="overview.incomeChange >= 0 ? 'up' : 'down'">
                环比 {{ overview.incomeChange >= 0 ? '+' : '' }}{{ overview.incomeChange.toFixed(1) }}%
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="hover" :body-style="{ padding: '16px' }">
          <div class="stat-item">
            <div class="stat-icon" style="background:#fce4ec"><el-icon :size="22" color="#f56c6c"><Bottom /></el-icon></div>
            <div class="stat-body">
              <div class="stat-label">本月支出</div>
              <div class="stat-value expense">¥{{ overview.expense.toFixed(2) }}</div>
              <div class="stat-change" :class="overview.expenseChange >= 0 ? 'up' : 'down'">
                环比 {{ overview.expenseChange >= 0 ? '+' : '' }}{{ overview.expenseChange.toFixed(1) }}%
              </div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="hover" :body-style="{ padding: '16px' }">
          <div class="stat-item">
            <div class="stat-icon" :style="{ background: overview.balance >= 0 ? '#e8f5e9' : '#fce4ec' }">
              <el-icon :size="22" :color="overview.balance >= 0 ? '#67c23a' : '#f56c6c'">
                <Wallet />
              </el-icon>
            </div>
            <div class="stat-body">
              <div class="stat-label">本月结余</div>
              <div class="stat-value" :class="overview.balance >= 0 ? 'income' : 'expense'">
                ¥{{ overview.balance.toFixed(2) }}
              </div>
              <div class="stat-change">本年度累计</div>
            </div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="12" :sm="6">
        <el-card shadow="hover" :body-style="{ padding: '16px' }">
          <div class="stat-item">
            <div class="stat-icon" style="background:#e3f2fd"><el-icon :size="22" color="#409eff"><Coin /></el-icon></div>
            <div class="stat-body">
              <div class="stat-label">账户总余额</div>
              <div class="stat-value" style="color:#409eff; font-size:22px">¥{{ totalBalance.toFixed(2) }}</div>
              <div class="stat-change">{{ accountCount }} 个账户</div>
            </div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 收支趋势 + 账户余额 -->
    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :xs="24" :sm="14">
        <el-card shadow="hover">
          <template #header>
            <span>📊 收支趋势</span>
            <span style="float:right; font-size:12px; color:#909399">本月 (每日)</span>
          </template>
          <div ref="trendChartRef" style="height: 280px"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="10">
        <el-card shadow="hover">
          <template #header>
            <span>💰 账户余额</span>
          </template>
          <div v-for="a in accountBalances" :key="a.accountId" class="account-balance-row">
            <span class="ab-name">{{ a.name }}</span>
            <span :class="['ab-balance', a.balance >= 0 ? 'income' : 'expense']">¥{{ a.balance.toFixed(2) }}</span>
          </div>
          <div v-if="accountBalances.length === 0" style="text-align:center; padding:20px; color:#c0c4cc">
            暂无账户
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 分类饼图 + 最近交易 -->
    <el-row :gutter="16" style="margin-top: 16px">
      <el-col :xs="24" :sm="12">
        <el-card shadow="hover">
          <template #header>
            <span>🍕 支出分类 TOP5</span>
          </template>
          <div ref="categoryChartRef" style="height: 280px"></div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="12">
        <el-card shadow="hover">
          <template #header>
            <div class="flex-between">
              <span>📝 最近交易</span>
              <router-link to="/transactions" style="text-decoration:none">
                <el-button text type="primary" size="small">查看全部 →</el-button>
              </router-link>
            </div>
          </template>
          <div v-for="t in recentTransactions" :key="t.id" class="recent-tx-row">
            <div class="tx-left">
              <div class="tx-category">{{ t.categoryName || '未分类' }}</div>
              <div class="tx-note">{{ t.note || t.merchant || '-' }}</div>
            </div>
            <div class="tx-right">
              <span :class="['tx-amount', t.type === 'INCOME' ? 'income' : 'expense']">
                {{ t.type === 'INCOME' ? '+' : '-' }}¥{{ t.amount.toFixed(2) }}
              </span>
            </div>
          </div>
          <div v-if="recentTransactions.length === 0" style="text-align:center; padding:20px; color:#c0c4cc">
            暂无最近交易
          </div>
        </el-card>
      </el-col>
    </el-row>

    <div style="margin-top: 16px; text-align: center">
      <el-button type="primary" size="large" @click="showForm = true" round>➕ 记一笔</el-button>
    </div>

    <TransactionForm v-model:visible="showForm" @saved="onSaved" />
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { useUserStore } from '@/stores/user'
import { transactionApi, type TransactionVO } from '@/api/transaction'
import { statsApi, type StatsOverview, type AccountBalanceInfo } from '@/api/stats'
import { categoryApi, type Category } from '@/api/category'
import { Top, Bottom, Wallet, Coin } from '@element-plus/icons-vue'
import TransactionForm from '@/views/transactions/TransactionForm.vue'
import * as echarts from 'echarts'

const userStore = useUserStore()

const overview = reactive<StatsOverview>({
  income: 0, expense: 0, balance: 0,
  incomeChange: 0, expenseChange: 0,
  lastIncome: 0, lastExpense: 0,
})
const showForm = ref(false)
const accountBalances = ref<AccountBalanceInfo[]>([])
const totalBalance = ref(0)
const accountCount = ref(0)
const recentTransactions = ref<TransactionVO[]>([])
const totalRecords = ref(0)

const trendChartRef = ref<HTMLElement>()
const categoryChartRef = ref<HTMLElement>()
let trendChart: echarts.ECharts | null = null
let categoryChart: echarts.ECharts | null = null

function getMonthRange() {
  const now = new Date()
  const y = now.getFullYear()
  const m = now.getMonth()
  const start = `${y}-${String(m+1).padStart(2,'0')}-01T00:00:00`
  const end = new Date(y, m+1, 0).toISOString().substring(0,10) + 'T23:59:59'
  return { start, end }
}

async function loadAll() {
  if (!userStore.currentBook) return
  const bid = userStore.currentBook.id

  // 概览
  const ovRes = await statsApi.overview(bid).catch(() => null)
  if (ovRes?.code === 200) Object.assign(overview, ovRes.data)

  // 账户余额
  const balRes = await statsApi.accountBalances(bid).catch(() => null)
  if (balRes?.code === 200) {
    accountBalances.value = balRes.data
    totalBalance.value = balRes.data.reduce((s: number, a: any) => s + (a.balance || 0), 0)
    accountCount.value = balRes.data.length
  }

  // 最近交易
  const txRes = await transactionApi.search(bid, { page: 0, size: 5 }).catch(() => null)
  if (txRes?.code === 200) {
    recentTransactions.value = txRes.data.content
    totalRecords.value = txRes.data.totalElements
  }

  // 图表
  const { start, end } = getMonthRange()

  // 趋势（用日统计）
  const trendRes = await statsApi.daily(bid, start, end).catch(() => null)
  if (trendRes?.code === 200 && trendRes.data.length > 0) {
    renderTrendChart(trendRes.data)
  }

  // 支出分类
  const catRes = await statsApi.byCategory(bid, start, end, 'EXPENSE').catch(() => null)
  if (catRes?.code === 200) {
    renderCategoryChart(catRes.data)
  }
}

function renderTrendChart(data: any[]) {
  if (!trendChartRef.value) return
  if (!trendChart) trendChart = echarts.init(trendChartRef.value)
  trendChart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['收入', '支出'], bottom: 0 },
    grid: { left: 50, right: 16, top: 10, bottom: 40 },
    xAxis: { type: 'category', data: data.map(d => d.date?.substring(5,10) || ''), axisLabel: { fontSize: 10 } },
    yAxis: { type: 'value', axisLabel: { fontSize: 10, formatter: (v: number) => v >= 10000 ? (v/10000).toFixed(1)+'w' : v.toString() } },
    series: [
      { name: '收入', type: 'bar', barWidth: 8, itemStyle: { color: '#67c23a', borderRadius: [4,4,0,0] }, data: data.map(d => d.income) },
      { name: '支出', type: 'bar', barWidth: 8, itemStyle: { color: '#f56c6c', borderRadius: [4,4,0,0] }, data: data.map(d => d.expense) },
    ],
  })
}

function renderCategoryChart(data: any[]) {
  if (!categoryChartRef.value) return
  if (!categoryChart) categoryChart = echarts.init(categoryChartRef.value)
  const sorted = [...data].sort((a: any, b: any) => b.amount - a.amount).slice(0, 5)
  categoryChart.setOption({
    tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
    legend: { bottom: 0, type: 'scroll' },
    series: [{
      type: 'pie',
      radius: ['30%', '60%'],
      center: ['50%', '45%'],
      data: sorted.map((d: any) => ({
        name: d.categoryName + (d.percentage ? ` (${d.percentage}%)` : ''),
        value: d.amount,
        itemStyle: d.color ? { color: d.color } : undefined,
      })),
      label: { show: true, formatter: '{b}', fontSize: 11 },
      emphasis: { label: { show: true, fontSize: 13, fontWeight: 'bold' } },
    }],
  })
}

function onSaved() {
  showForm.value = false
  loadAll()
}

watch(() => userStore.currentBook?.id, () => {
  loadAll()
})

onMounted(() => {
  loadAll()
})

onBeforeUnmount(() => {
  trendChart?.dispose()
  categoryChart?.dispose()
})
</script>

<style scoped>
.stat-item { display: flex; align-items: center; gap: 12px; }
.stat-icon {
  width: 44px; height: 44px; border-radius: 12px;
  display: flex; align-items: center; justify-content: center;
  flex-shrink: 0;
}
.stat-body { flex: 1; min-width: 0; }
.stat-label { font-size: 12px; color: #909399; }
.stat-value { font-size: 20px; font-weight: 700; }
.stat-value.income { color: #67c23a; }
.stat-value.expense { color: #f56c6c; }
.stat-change { font-size: 11px; margin-top: 2px; }
.stat-change.up { color: #f56c6c; }
.stat-change.down { color: #67c23a; }

.account-balance-row {
  display: flex; justify-content: space-between; padding: 6px 0;
  border-bottom: 1px solid #f5f5f5; font-size: 13px;
}
.account-balance-row:last-child { border-bottom: none; }
.ab-name { color: #606266; }
.ab-balance { font-weight: 600; }
.ab-balance.income { color: #67c23a; }
.ab-balance.expense { color: #f56c6c; }

.recent-tx-row {
  display: flex; justify-content: space-between; align-items: center;
  padding: 8px 0; border-bottom: 1px solid #f5f5f5;
}
.recent-tx-row:last-child { border-bottom: none; }
.tx-category { font-size: 13px; font-weight: 500; color: #303133; }
.tx-note { font-size: 11px; color: #909399; margin-top: 2px; }
.tx-amount { font-weight: 700; font-size: 14px; }
.tx-amount.income { color: #67c23a; }
.tx-amount.expense { color: #f56c6c; }
.flex-between { display: flex; justify-content: space-between; align-items: center; }
</style>
