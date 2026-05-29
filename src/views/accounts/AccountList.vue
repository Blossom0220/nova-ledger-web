<template>
  <div class="account-list">
    <el-card shadow="never">
      <template #header>
        <div class="header-bar">
          <span style="font-size: 16px; font-weight: bold">账户管理</span>
          <el-dialog v-model="showForm" :title="editId ? '编辑账户' : '添加账户'" width="400px">
            <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
              <el-form-item label="名称" prop="name">
                <el-input v-model="form.name" placeholder="如：现金、银行卡" />
              </el-form-item>
              <el-form-item label="类型" prop="type">
                <el-select v-model="form.type" style="width: 100%">
                  <el-option label="现金" value="CASH" />
                  <el-option label="银行卡" value="BANK" />
                  <el-option label="支付宝" value="ALIPAY" />
                  <el-option label="微信" value="WECHAT" />
                  <el-option label="信用卡" value="CREDIT_CARD" />
                  <el-option label="投资" value="INVESTMENT" />
                  <el-option label="其他" value="OTHER" />
                </el-select>
              </el-form-item>
              <el-form-item label="初始余额">
                <el-input-number v-model="form.initialBalance" :precision="2" style="width: 100%" />
              </el-form-item>
            </el-form>
            <template #footer>
              <el-button @click="showForm = false">取消</el-button>
              <el-button type="primary" :loading="loading" @click="handleSubmit">确定</el-button>
            </template>
          </el-dialog>
        </div>
      </template>

      <el-row :gutter="16">
        <el-col v-for="a in accounts" :key="a.id" :span="6" style="margin-bottom: 16px">
          <el-card shadow="hover" @click="editAccount(a)">
            <div class="account-card">
              <div class="account-name">{{ a.name }}</div>
              <div class="account-type">{{ typeLabel(a.type) }}</div>
              <div class="account-balance">¥{{ a.balance.toFixed(2) }}</div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6" style="margin-bottom: 16px">
          <el-card shadow="hover" class="add-card" @click="addAccount">
            <div class="account-card" style="text-align: center; color: #909399">
              <el-icon :size="32"><Plus /></el-icon>
              <div>添加账户</div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { accountApi, type Account } from '@/api/account'
import { Plus } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

const userStore = useUserStore()
const accounts = ref<Account[]>([])
const showForm = ref(false)
const editId = ref<number | undefined>()
const loading = ref(false)
const formRef = ref<FormInstance>()

const form = reactive({
  name: '',
  type: 'CASH' as Account['type'],
  initialBalance: 0,
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入账户名称' }],
  type: [{ required: true, message: '请选择类型' }],
}

function typeLabel(t: string) {
  const map: Record<string, string> = { CASH: '现金', BANK: '银行卡', ALIPAY: '支付宝', WECHAT: '微信', CREDIT_CARD: '信用卡', INVESTMENT: '投资', OTHER: '其他' }
  return map[t] || t
}

async function loadAccounts() {
  if (!userStore.currentBook) return
  const res = await accountApi.getAccounts(userStore.currentBook.id)
  if (res.code === 200) accounts.value = res.data
}

function addAccount() {
  editId.value = undefined
  form.name = ''
  form.type = 'CASH'
  form.initialBalance = 0
  showForm.value = true
}

function editAccount(a: Account) {
  editId.value = a.id
  form.name = a.name
  form.type = a.type
  form.initialBalance = a.initialBalance
  showForm.value = true
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    if (editId.value) {
      await accountApi.updateAccount(userStore.currentBook!.id, editId.value, { name: form.name, type: form.type })
      ElMessage.success('更新成功')
    } else {
      await accountApi.createAccount(userStore.currentBook!.id, { name: form.name, type: form.type, initialBalance: form.initialBalance })
      ElMessage.success('创建成功')
    }
    showForm.value = false
    loadAccounts()
  } catch {
    ElMessage.error('操作失败')
  } finally {
    loading.value = false
  }
}

onMounted(() => loadAccounts())
</script>

<style scoped>
.header-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.account-card {
  padding: 8px 0;
}
.account-name {
  font-size: 16px;
  font-weight: bold;
  color: #303133;
}
.account-type {
  font-size: 12px;
  color: #909399;
  margin: 4px 0;
}
.account-balance {
  font-size: 24px;
  font-weight: bold;
  color: #409eff;
}
.add-card {
  border: 2px dashed #dcdfe6;
  cursor: pointer;
}
.add-card:hover {
  border-color: #409eff;
}
</style>
