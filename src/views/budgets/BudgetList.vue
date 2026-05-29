<template>
  <div class="budget-list">
    <el-card shadow="never">
      <template #header>
        <div class="flex-between">
          <span style="font-size: 16px; font-weight: bold">预算管理</span>
          <div>
            <el-date-picker
              v-model="currentMonth"
              type="month"
              value-format="YYYY-MM"
              size="small"
              style="width: 160px; margin-right: 8px"
              @change="loadBudgets"
            />
            <el-button type="primary" size="small" @click="openAdd">添加预算</el-button>
          </div>
        </div>
      </template>

      <!-- 预算总览 -->
      <el-row :gutter="16" style="margin-bottom: 20px">
        <el-col :span="8">
          <div class="budget-overview-card">
            <div class="overview-label">预算总计</div>
            <div class="overview-value">¥{{ totalBudget.toFixed(2) }}</div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="budget-overview-card">
            <div class="overview-label">已支出</div>
            <div class="overview-value" style="color: #f56c6c">¥{{ totalSpent.toFixed(2) }}</div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="budget-overview-card">
            <div class="overview-label">剩余</div>
            <div :class="['overview-value', remaining >= 0 ? 'income' : 'expense']">
              ¥{{ remaining.toFixed(2) }}
            </div>
          </div>
        </el-col>
      </el-row>

      <!-- 预算列表 -->
      <el-table :data="budgets" v-loading="loading" stripe>
        <el-table-column label="分类" min-width="150">
          <template #default="{ row }"> {{ row.categoryName || '未分类' }} </template>
        </el-table-column>
        <el-table-column label="预算金额" width="150">
          <template #default="{ row }"> ¥{{ row.budgetAmount.toFixed(2) }} </template>
        </el-table-column>
        <el-table-column label="已使用" width="150">
          <template #default="{ row }"> ¥{{ row.spentAmount.toFixed(2) }} </template>
        </el-table-column>
        <el-table-column label="剩余" width="150">
          <template #default="{ row }">
            <span :class="(row.budgetAmount - row.spentAmount) >= 0 ? 'income' : 'expense'">
              ¥{{ (row.budgetAmount - row.spentAmount).toFixed(2) }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="使用率" width="200">
          <template #default="{ row }">
            <div class="progress-wrapper">
              <el-progress
                :percentage="Math.min(calculatePercent(row), 100)"
                :status="calculatePercent(row) >= 100 ? 'exception' : calculatePercent(row) >= 80 ? 'warning' : 'success'"
                :stroke-width="16"
                :text-inside="true"
              />
            </div>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.overBudget" type="danger" size="small">超支</el-tag>
            <el-tag v-else type="success" size="small">正常</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" size="small" @click="openEdit(row)">编辑</el-button>
            <el-popconfirm title="确定删除这项预算？" @confirm="handleDelete(row.id)">
              <template #reference>
                <el-button text type="danger" size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && budgets.length === 0" description="暂无预算，点击「添加预算」开始规划" style="padding: 40px" />
    </el-card>

    <!-- 添加/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑预算' : '添加预算'" width="400px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="分类" prop="categoryId">
          <el-tree-select
            v-model="form.categoryId"
            :data="expenseCategories"
            :props="{ children: 'children', label: 'name', value: 'id', emitPath: false }"
            placeholder="选择支出分类"
            style="width: 100%"
            check-strictly
          />
        </el-form-item>
        <el-form-item label="月份" prop="month">
          <el-date-picker v-model="form.month" type="month" value-format="YYYY-MM" placeholder="选择月份" style="width: 100%" />
        </el-form-item>
        <el-form-item label="预算金额" prop="budgetAmount">
          <el-input-number v-model="form.budgetAmount" :min="0.01" :precision="2" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="loadingSubmit" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { budgetApi, type Budget } from '@/api/budget'
import { categoryApi, type Category } from '@/api/category'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

const userStore = useUserStore()
const formRef = ref<FormInstance>()
const loading = ref(false)
const loadingSubmit = ref(false)
const dialogVisible = ref(false)
const editingId = ref<number | undefined>()
const currentMonth = ref(new Date().toISOString().substring(0, 7))

const budgets = ref<Budget[]>([])
const expenseCategories = ref<Category[]>([])

const totalBudget = computed(() => budgets.value.reduce((s, b) => s + b.budgetAmount, 0))
const totalSpent = computed(() => budgets.value.reduce((s, b) => s + b.spentAmount, 0))
const remaining = computed(() => totalBudget.value - totalSpent.value)

const form = reactive({
  categoryId: undefined as number | undefined,
  month: currentMonth.value,
  budgetAmount: 0,
})

const rules: FormRules = {
  categoryId: [{ required: true, message: '请选择分类' }],
  month: [{ required: true, message: '请选择月份' }],
  budgetAmount: [{ required: true, message: '请输入预算金额' }],
}

function calculatePercent(row: Budget) {
  if (row.budgetAmount <= 0) return 0
  return Math.round((row.spentAmount / row.budgetAmount) * 100)
}

async function loadBudgets() {
  if (!userStore.currentBook) return
  loading.value = true
  try {
    const res = await budgetApi.list(userStore.currentBook.id, currentMonth.value)
    if (res.code === 200) budgets.value = res.data
  } finally {
    loading.value = false
  }
}

async function loadExpenseCategories() {
  if (!userStore.currentBook) return
  const res = await categoryApi.getTree(userStore.currentBook.id, 'EXPENSE')
  if (res.code === 200) expenseCategories.value = res.data
}

function openAdd() {
  editingId.value = undefined
  form.categoryId = undefined
  form.month = currentMonth.value
  form.budgetAmount = 0
  dialogVisible.value = true
}

function openEdit(b: Budget) {
  editingId.value = b.id
  form.categoryId = b.categoryId
  form.month = b.month
  form.budgetAmount = b.budgetAmount
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid || !userStore.currentBook) return
  loadingSubmit.value = true
  try {
    if (editingId.value) {
      await budgetApi.update(userStore.currentBook.id, editingId.value, { budgetAmount: form.budgetAmount })
      ElMessage.success('更新成功')
    } else {
      await budgetApi.create(userStore.currentBook.id, {
        categoryId: form.categoryId!, month: form.month!, budgetAmount: form.budgetAmount,
      })
      ElMessage.success('添加成功')
    }
    dialogVisible.value = false
    loadBudgets()
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '操作失败')
  } finally {
    loadingSubmit.value = false
  }
}

async function handleDelete(id: number) {
  if (!userStore.currentBook) return
  try {
    await budgetApi.delete(userStore.currentBook.id, id)
    ElMessage.success('删除成功')
    loadBudgets()
  } catch {
    ElMessage.error('删除失败')
  }
}

onMounted(() => {
  loadExpenseCategories()
  loadBudgets()
})
</script>

<style scoped>
.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.budget-overview-card {
  background: #f5f7fa;
  border-radius: 8px;
  padding: 16px;
  text-align: center;
}
.overview-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}
.overview-value {
  font-size: 24px;
  font-weight: bold;
  color: #303133;
}
.overview-value.income { color: #67c23a; }
.overview-value.expense { color: #f56c6c; }
.progress-wrapper { padding-right: 16px; }
.income { color: #67c23a; font-weight: bold; }
.expense { color: #f56c6c; font-weight: bold; }
</style>
