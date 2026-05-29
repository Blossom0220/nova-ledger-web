<template>
  <div class="debt-list">
    <el-card shadow="never">
      <template #header>
        <div class="flex-between">
          <span style="font-size: 16px; font-weight: bold">债权债务</span>
          <div>
            <el-radio-group v-model="filterStatus" size="small" style="margin-right: 8px" @change="loadDebts">
              <el-radio value="">全部</el-radio>
              <el-radio value="ACTIVE">未清</el-radio>
              <el-radio value="SETTLED">已结清</el-radio>
            </el-radio-group>
            <el-button type="primary" size="small" @click="openAdd">添加记录</el-button>
          </div>
        </div>
      </template>

      <!-- 概览 -->
      <el-row :gutter="16" style="margin-bottom: 20px">
        <el-col :span="8">
          <div class="overview-card">
            <div class="overview-label">借出（应收）</div>
            <div class="overview-value income">¥{{ lendAmount.toFixed(2) }}</div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="overview-card">
            <div class="overview-label">借入（应付）</div>
            <div class="overview-value expense">¥{{ borrowAmount.toFixed(2) }}</div>
          </div>
        </el-col>
        <el-col :span="8">
          <div class="overview-card">
            <div class="overview-label">净债权</div>
            <div :class="['overview-value', netDebt >= 0 ? 'income' : 'expense']">
              ¥{{ netDebt.toFixed(2) }}
            </div>
          </div>
        </el-col>
      </el-row>

      <el-table :data="debts" v-loading="loading" stripe>
        <el-table-column label="类型" width="80">
          <template #default="{ row }">
            <el-tag :type="row.type === 'LEND' ? 'success' : 'warning'" size="small">
              {{ row.type === 'LEND' ? '借出' : '借入' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="对方" prop="debtor" min-width="120" />
        <el-table-column label="描述" prop="name" min-width="140" show-overflow-tooltip />
        <el-table-column label="总额" width="120">
          <template #default="{ row }">
            <span style="font-weight: bold">¥{{ row.amount.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="剩余" width="120">
          <template #default="{ row }">
            <span style="font-weight: bold">¥{{ row.remainingAmount.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="到期日" width="100">
          <template #default="{ row }">
            <span :class="{ 'expired': row.dueDate && row.dueDate < today && row.status === 'ACTIVE' }">
              {{ row.dueDate ? row.dueDate.substring(0, 10) : '-' }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-tag :type="row.status === 'ACTIVE' ? 'warning' : 'success'" size="small">
              {{ row.status === 'ACTIVE' ? '进行中' : '已结清' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="备注" prop="note" min-width="100" show-overflow-tooltip />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button v-if="row.status === 'ACTIVE'" text type="success" size="small" @click="handleSettle(row)">
              结清
            </el-button>
            <el-button text type="primary" size="small" @click="openEdit(row)">编辑</el-button>
            <el-popconfirm title="确定删除？" @confirm="handleDelete(row.id)">
              <template #reference>
                <el-button text type="danger" size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && debts.length === 0" description="暂无记录" style="padding: 40px" />
    </el-card>

    <!-- 添加/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑记录' : '添加记录'" width="480px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="类型" prop="type">
          <el-radio-group v-model="form.type">
            <el-radio value="LEND">借出（应收款）</el-radio>
            <el-radio value="BORROW">借入（应付款）</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="如：借给张三" />
        </el-form-item>
        <el-form-item label="对方" prop="debtor">
          <el-input v-model="form.debtor" placeholder="姓名/昵称" />
        </el-form-item>
        <el-form-item label="金额" prop="amount">
          <el-input-number v-model="form.amount" :min="0.01" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="到期日">
          <el-date-picker v-model="form.dueDate" type="date" value-format="YYYY-MM-DD" placeholder="选填" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.note" type="textarea" :rows="2" />
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
import { debtApi, type Debt } from '@/api/debt'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

const userStore = useUserStore()
const formRef = ref<FormInstance>()
const loading = ref(false)
const loadingSubmit = ref(false)
const dialogVisible = ref(false)
const editingId = ref<number | undefined>()
const filterStatus = ref('')
const today = new Date().toISOString().substring(0, 10)

const debts = ref<Debt[]>([])

const activeDebts = computed(() => debts.value.filter(d => filterStatus.value ? d.status === filterStatus.value : true))

const lendAmount = computed(() => activeDebts.value.filter(d => d.type === 'LEND').reduce((s, d) => s + d.remainingAmount, 0))
const borrowAmount = computed(() => activeDebts.value.filter(d => d.type === 'BORROW').reduce((s, d) => s + d.remainingAmount, 0))
const netDebt = computed(() => lendAmount.value - borrowAmount.value)

const form = reactive({
  type: 'LEND' as 'LEND' | 'BORROW',
  name: '',
  debtor: '',
  amount: 0,
  dueDate: '',
  note: '',
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入名称' }],
  debtor: [{ required: true, message: '请输入对方' }],
  amount: [{ required: true, message: '请输入金额' }],
}

async function loadDebts() {
  if (!userStore.currentBook) return
  loading.value = true
  try {
    const status = filterStatus.value || undefined
    const res = await debtApi.list(userStore.currentBook.id, status)
    if (res.code === 200) debts.value = res.data
  } finally {
    loading.value = false
  }
}

function openAdd() {
  editingId.value = undefined
  form.type = 'LEND'
  form.name = ''
  form.debtor = ''
  form.amount = 0
  form.dueDate = ''
  form.note = ''
  dialogVisible.value = true
}

function openEdit(d: Debt) {
  editingId.value = d.id
  form.type = d.type
  form.name = d.name
  form.debtor = d.debtor
  form.amount = d.amount
  form.dueDate = d.dueDate?.substring(0, 10) || ''
  form.note = d.note || ''
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid || !userStore.currentBook) return
  loadingSubmit.value = true
  try {
    if (editingId.value) {
      await debtApi.update(userStore.currentBook.id, editingId.value, form as any)
      ElMessage.success('更新成功')
    } else {
      await debtApi.create(userStore.currentBook.id, form as any)
      ElMessage.success('添加成功')
    }
    dialogVisible.value = false
    loadDebts()
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '操作失败')
  } finally {
    loadingSubmit.value = false
  }
}

async function handleDelete(id: number) {
  if (!userStore.currentBook) return
  try {
    await debtApi.delete(userStore.currentBook.id, id)
    ElMessage.success('删除成功')
    loadDebts()
  } catch {
    ElMessage.error('删除失败')
  }
}

async function handleSettle(d: Debt) {
  if (!userStore.currentBook) return
  try {
    await debtApi.settle(userStore.currentBook.id, d.id)
    ElMessage.success('已标记为结清')
    loadDebts()
  } catch {
    ElMessage.error('操作失败')
  }
}

onMounted(() => loadDebts())
</script>

<style scoped>
.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.overview-card {
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
.expired { color: #f56c6c; font-weight: bold; }
</style>
