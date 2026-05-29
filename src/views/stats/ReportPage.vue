<template>
  <div class="report-page">
    <el-card shadow="never">
      <template #header>
        <div class="flex-between">
          <span style="font-size: 16px; font-weight: bold">统计报表</span>
          <div>
            <el-date-picker
              v-model="monthRange"
              type="monthrange"
              range-separator="至"
              start-placeholder="开始月份"
              end-placeholder="结束月份"
              value-format="YYYY-MM"
              size="small"
              style="width: 280px; margin-right: 8px"
              @change="loadAllData"
            />
          </div>
        </div>
      </template>

      <el-row :gutter="20">
        <!-- 月度概况 -->
        <el-col :span="24" style="margin-bottom: 20px">
          <el-card shadow="hover">
            <template #header>
              <span>月度收支概况</span>
            </template>
            <div ref="overviewChart" style="height: 350px"></div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20">
        <!-- 支出分类 -->
        <el-col :span="12" style="margin-bottom: 20px">
          <el-card shadow="hover">
            <template #header>
              <div class="flex-between">
                <span>支出分类占比</span>
                <el-button text type="primary" size="small" @click="switchChart('EXPENSE')">
                  {{ chartMode === 'EXPENSE' ? '饼图' : '柱状图' }}
                </el-button>
              </div>
            </template>
            <div ref="expenseChart" style="height: 300px"></div>
          </el-card>
        </el-col>
        <!-- 收入分类 -->
        <el-col :span="12" style="margin-bottom: 20px">
          <el-card shadow="hover">
            <template #header>
              <div class="flex-between">
                <span>收入分类占比</span>
                <el-button text type="primary" size="small" @click="switchChart('INCOME')">
                  {{ chartMode === 'INCOME' ? '饼图' : '柱状图' }}
                </el-button>
              </div>
            </template>
            <div ref="incomeChart" style="height: 300px"></div>
          </el-card>
        </el-col>
      </el-row>

      <!-- 月度详情表 -->
      <el-card shadow="hover">
        <template #header>
          <span>月度明细表</span>
        </template>
        <el-table :data="detailMonths" stripe size="small">
          <el-table-column label="月份" width="100">
            <template #default="{ row }"> {{ row.month }} </template>
          </el-table-column>
          <el-table-column label="收入" width="150">
            <template #default="{ row }">
              <span class="income">¥{{ row.income.toFixed(2) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="支出" width="150">
            <template #default="{ row }">
              <span class="expense">¥{{ row.expense.toFixed(2) }}</span>
            </template>
          </el-table-column>
          <el-table-column label="结余" width="150">
            <template #default="{ row }">
              <span :class="row.balance >= 0 ? 'income' : 'expense'">
                ¥{{ row.balance.toFixed(2) }}
              </span>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, nextTick, onBeforeUnmount } from 'vue'
import { useUserStore } from '@/stores/user'
import { statsApi, type StatsOverview, type DailyStats, type CategoryStats } from '@/api/stats'
import * as echarts from 'echarts'

const userStore = useUserStore()

const monthRange = ref<string[]>(() => {
  const now = new Date()
  const m = now.getMonth()
  const y = now.getFullYear()
  const end = `${y}-${String(m + 1).padStart(2, '0')}`
  const start = `${y - 1}-${String(m + 1).padStart(2, '0')}`
  return [start, end]
})

const overviewChart = ref<HTMLElement>()
const expenseChart = ref<HTMLElement>()
const incomeChart = ref<HTMLElement>()

const chartMode = ref<'INCOME' | 'EXPENSE'>('EXPENSE')
const detailMonths = ref<{ month: string; income: number; expense: number; balance: number }[]>([])

let chartInstances: echarts.ECharts[] = []

function initChart(el: HTMLElement): echarts.ECharts {
  const chart = echarts.init(el)
  chartInstances.push(chart)
  return chart
}

async function loadAllData() {
  if (!userStore.currentBook || !monthRange.value?.length) return

  const startMonth = monthRange.value[0]
  const endMonth = monthRange.value[1]
  const startDate = startMonth + '-01'
  const endDate = getMonthEnd(endMonth)

  try {
    // 日趋势
    const dailyRes = await statsApi.daily(userStore.currentBook.id, startDate, endDate)
    if (dailyRes.code === 200) renderTrendChart(dailyRes.data)

    // 支出分类分析（用整月数据）
    const expCatRes = await statsApi.byCategory(userStore.currentBook.id, startDate, endDate, 'EXPENSE')
    if (expCatRes.code === 200) renderCategoryChart(expCatRes.data, 'EXPENSE')

    // 收入分类
    const incCatRes = await statsApi.byCategory(userStore.currentBook.id, startDate, endDate, 'INCOME')
    if (incCatRes.code === 200) renderCategoryChart(incCatRes.data, 'INCOME')

    // 月度明细
    buildDetailMonths(dailyRes.data)
  } catch {}
}

function getMonthEnd(month: string) {
  const [y, m] = month.split('-').map(Number)
  const lastDay = new Date(y, m, 0).getDate()
  return `${month}-${String(lastDay).padStart(2, '0')}`
}

function renderTrendChart(data: DailyStats[]) {
  if (!overviewChart.value) return
  const chart = initChart(overviewChart.value)
  chart.setOption({
    tooltip: { trigger: 'axis' },
    legend: { data: ['收入', '支出'] },
    grid: { left: 60, right: 20, bottom: 40 },
    xAxis: {
      type: 'category',
      data: data.map(d => d.date.substring(5, 10)),
      axisLabel: { rotate: 45 },
    },
    yAxis: { type: 'value' },
    series: [
      {
        name: '收入',
        type: 'bar',
        itemStyle: { color: '#67c23a' },
        data: data.map(d => d.income),
      },
      {
        name: '支出',
        type: 'bar',
        itemStyle: { color: '#f56c6c' },
        data: data.map(d => d.expense),
      },
    ],
  })
}

function renderCategoryChart(data: CategoryStats[], type: 'INCOME' | 'EXPENSE') {
  const el = type === 'EXPENSE' ? expenseChart.value : incomeChart.value
  if (!el) return

  const isPie = chartMode.value === type
  const chart = initChart(el)

  if (isPie) {
    chart.setOption({
      tooltip: { formatter: '{b}: {c} ({d}%)' },
      series: [{
        type: 'pie',
        radius: '60%',
        data: data.map(d => ({
          name: d.categoryName,
          value: d.amount,
          itemStyle: d.color ? { color: d.color } : undefined,
        })),
        emphasis: { label: { show: true, fontSize: 14, fontWeight: 'bold' } },
      }],
    })
  } else {
    chart.setOption({
      tooltip: { trigger: 'axis' },
      grid: { left: 60, right: 20, bottom: 50 },
      xAxis: {
        type: 'category',
        data: data.map(d => d.categoryName),
        axisLabel: { rotate: 30 },
      },
      yAxis: { type: 'value' },
      series: [{
        type: 'bar',
        itemStyle: { color: type === 'EXPENSE' ? '#f56c6c' : '#67c23a' },
        data: data.map(d => d.amount),
      }],
    })
  }
}

function buildDetailMonths(dailyData: DailyStats[]) {
  const monthMap: Record<string, { income: number; expense: number }> = {}
  for (const d of dailyData) {
    const m = d.date.substring(0, 7)
    if (!monthMap[m]) monthMap[m] = { income: 0, expense: 0 }
    monthMap[m].income += d.income
    monthMap[m].expense += d.expense
  }
  detailMonths.value = Object.entries(monthMap)
    .map(([month, v]) => ({
      month,
      income: v.income,
      expense: v.expense,
      balance: v.income - v.expense,
    }))
    .sort((a, b) => a.month.localeCompare(b.month))
}

function switchChart(type: 'INCOME' | 'EXPENSE') {
  chartMode.value = type
  loadAllData()
}

onMounted(() => {
  if (!userStore.books.length) {
    userStore.fetchBooks().then(() => loadAllData())
  } else {
    loadAllData()
  }
})

onBeforeUnmount(() => {
  chartInstances.forEach(c => c.dispose())
  chartInstances = []
})
</script>

<style scoped>
.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.income { color: #67c23a; font-weight: bold; }
.expense { color: #f56c6c; font-weight: bold; }
</style>
