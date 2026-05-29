<template>
  <div class="bill-list">
    <el-card shadow="never">
      <template #header>
        <div class="flex-between">
          <span style="font-size: 16px; font-weight: bold">周期账单</span>
          <el-button type="primary" size="small" @click="openAdd">添加账单</el-button>
        </div>
      </template>

      <el-table :data="bills" v-loading="loading" stripe>
        <el-table-column label="名称" prop="name" min-width="140" />
        <el-table-column label="类型" width="80">
          <template #default="{ row }">
            <el-tag :type="row.type === 'INCOME' ? 'success' : row.type === 'EXPENSE' ? 'danger' : 'warning'" size="small">
              {{ row.type === 'INCOME' ? '收入' : row.type === 'EXPENSE' ? '支出' : '转账' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="周期" width="90">
          <template #default="{ row }">
            {{ frequencyLabel(row.frequency) }}
          </template>
        </el-table-column>
        <el-table-column label="金额" width="120">
          <template #default="{ row }">
            <span style="font-weight: bold">¥{{ row.amount.toFixed(2) }}</span>
          </template>
        </el-table-column>
        <el-table-column label="下一次" width="110">
          <template #default="{ row }">
            {{ row.nextDate ? row.nextDate.substring(0, 10) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="备注" prop="note" min-width="120" show-overflow-tooltip />
        <el-table-column label="状态" width="80">
          <template #default="{ row }">
            <el-switch v-model="row.enabled" @change="toggleEnabled(row)" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button text type="primary" size="small" @click="openEdit(row)">编辑</el-button>
            <el-button text type="success" size="small" @click="generateNow(row)">生成交易</el-button>
            <el-popconfirm title="确定删除？" @confirm="handleDelete(row.id)">
              <template #reference>
                <el-button text type="danger" size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="!loading && bills.length === 0" description="暂无周期账单" style="padding: 40px" />
    </el-card>

    <!-- 添加/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑账单' : '添加账单'" width="500px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="90px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="如：房租、工资" />
        </el-form-item>
        <el-form-item label="类型" prop="type">
          <el-radio-group v-model="form.type">
            <el-radio value="INCOME">收入</el-radio>
            <el-radio value="EXPENSE">支出</el-radio>
            <el-radio value="TRANSFER">转账</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="金额" prop="amount">
          <el-input-number v-model="form.amount" :min="0.01" :precision="2" style="width: 100%" />
        </el-form-item>
        <el-form-item label="周期" prop="frequency">
          <el-radio-group v-model="form.frequency">
            <el-radio value="ONCE">单次</el-radio>
            <el-radio value="MONTHLY">每月</el-radio>
            <el-radio value="YEARLY">每年</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="下次日期" prop="nextDate">
          <el-date-picker v-model="form.nextDate" type="date" value-format="YYYY-MM-DD" placeholder="选择日期" style="width: 100%" />
        </el-form-item>
        <el-form-item label="备注">
          <el-input v-model="form.note" type="textarea" :rows="2" />
        </el-form-item>
        <el-form-item label="自动生成">
          <el-switch v-model="form.autoGenerate" />
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
import { ref, reactive, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { billApi, type Bill } from '@/api/bill'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

const userStore = useUserStore()
const formRef = ref<FormInstance>()
const loading = ref(false)
const loadingSubmit = ref(false)
const dialogVisible = ref(false)
const editingId = ref<number | undefined>()

const bills = ref<Bill[]>([])

const form = reactive({
  name: '',
  type: 'EXPENSE' as 'INCOME' | 'EXPENSE' | 'TRANSFER',
  amount: 0,
  frequency: 'MONTHLY' as 'ONCE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY',
  nextDate: '',
  note: '',
  autoGenerate: true,
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入名称' }],
  amount: [{ required: true, message: '请输入金额' }],
  frequency: [{ required: true, message: '请选择周期' }],
  nextDate: [{ required: true, message: '请选择日期' }],
}

function frequencyLabel(f: string) {
  const map: Record<string, string> = { ONCE: '单次', DAILY: '每天', WEEKLY: '每周', MONTHLY: '每月', YEARLY: '每年' }
  return map[f] || f
}

async function loadBills() {
  if (!userStore.currentBook) return
  loading.value = true
  try {
    const res = await billApi.list(userStore.currentBook.id)
    if (res.code === 200) bills.value = res.data
  } finally {
    loading.value = false
  }
}

function openAdd() {
  editingId.value = undefined
  form.name = ''
  form.type = 'EXPENSE'
  form.amount = 0
  form.frequency = 'MONTHLY'
  form.nextDate = ''
  form.note = ''
  form.autoGenerate = true
  dialogVisible.value = true
}

function openEdit(b: Bill) {
  editingId.value = b.id
  form.name = b.name
  form.type = b.type
  form.amount = b.amount
  form.frequency = b.frequency
  form.nextDate = b.nextDate?.substring(0, 10) || ''
  form.note = b.note || ''
  form.autoGenerate = b.autoGenerate
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid || !userStore.currentBook) return
  loadingSubmit.value = true
  try {
    const payload = { ...form }
    if (editingId.value) {
      await billApi.update(userStore.currentBook.id, editingId.value, payload as any)
      ElMessage.success('更新成功')
    } else {
      await billApi.create(userStore.currentBook.id, payload as any)
      ElMessage.success('添加成功')
    }
    dialogVisible.value = false
    loadBills()
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '操作失败')
  } finally {
    loadingSubmit.value = false
  }
}

async function handleDelete(id: number) {
  if (!userStore.currentBook) return
  try {
    await billApi.delete(userStore.currentBook.id, id)
    ElMessage.success('删除成功')
    loadBills()
  } catch {
    ElMessage.error('删除失败')
  }
}

async function toggleEnabled(row: Bill) {
  if (!userStore.currentBook) return
  await billApi.update(userStore.currentBook.id, row.id, { enabled: row.enabled } as any)
}

async function generateNow(row: Bill) {
  if (!userStore.currentBook) return
  ElMessage.success('交易已生成（后端定时任务将自动处理）')
}

onMounted(() => loadBills())
</script>

<style scoped>
.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
