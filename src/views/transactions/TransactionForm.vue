<template>
  <el-dialog v-model="visible" :title="editId ? '编辑交易' : '记一笔'" width="500px" :close-on-click-modal="false">
    <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
      <el-form-item label="类型" prop="type">
        <el-radio-group v-model="form.type">
          <el-radio value="EXPENSE">支出</el-radio>
          <el-radio value="INCOME">收入</el-radio>
          <el-radio value="TRANSFER">转账</el-radio>
        </el-radio-group>
      </el-form-item>
      <el-form-item label="账户" prop="accountId">
        <el-select v-model="form.accountId" placeholder="选择账户" style="width: 100%">
          <el-option v-for="a in accounts" :key="a.id" :label="a.name" :value="a.id" />
        </el-select>
      </el-form-item>
      <el-form-item v-if="form.type === 'TRANSFER'" label="转入账户" prop="toAccountId">
        <el-select v-model="form.toAccountId" placeholder="选择转入账户" style="width: 100%">
          <el-option v-for="a in accounts.filter(a => a.id !== form.accountId)" :key="a.id" :label="a.name" :value="a.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="金额" prop="amount">
        <el-input-number v-model="form.amount" :min="0.01" :precision="2" style="width: 100%" />
      </el-form-item>
      <el-form-item label="分类">
        <el-select v-model="form.categoryId" placeholder="选择分类" clearable style="width: 100%">
          <el-option v-for="c in categories" :key="c.id" :label="c.name" :value="c.id" />
        </el-select>
      </el-form-item>
      <el-form-item label="时间" prop="transactionTime">
        <el-date-picker v-model="form.transactionTime" type="datetime" placeholder="选择时间" style="width: 100%" />
      </el-form-item>
      <el-form-item label="备注">
        <el-input v-model="form.note" type="textarea" :rows="2" placeholder="备注信息" />
      </el-form-item>
      <el-form-item label="商家">
        <el-input v-model="form.merchant" placeholder="商家名称" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="visible = false">取消</el-button>
      <el-button type="primary" :loading="loading" @click="handleSubmit">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import { useUserStore } from '@/stores/user'
import { transactionApi } from '@/api/transaction'
import { accountApi, type Account } from '@/api/account'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

const props = defineProps<{ visible: boolean; editId?: number }>()
const emit = defineEmits<{ (e: 'update:visible', v: boolean): void; (e: 'saved'): void }>()

const visible = computed({
  get: () => props.visible,
  set: (v) => emit('update:visible', v),
})

const userStore = useUserStore()
const formRef = ref<FormInstance>()
const loading = ref(false)
const accounts = ref<Account[]>([])
const categories = ref<any[]>([])

const form = reactive({
  type: 'EXPENSE' as 'INCOME' | 'EXPENSE' | 'TRANSFER',
  accountId: undefined as number | undefined,
  toAccountId: undefined as number | undefined,
  categoryId: undefined as number | undefined,
  amount: 0,
  transactionTime: new Date().toISOString().substring(0, 16),
  note: '',
  merchant: '',
})

const rules: FormRules = {
  type: [{ required: true, message: '请选择类型' }],
  accountId: [{ required: true, message: '请选择账户' }],
  amount: [{ required: true, message: '请输入金额' }],
  transactionTime: [{ required: true, message: '请选择时间' }],
}

async function loadAccounts() {
  if (!userStore.currentBook) return
  const res = await accountApi.getAccounts(userStore.currentBook.id)
  if (res.code === 200) accounts.value = res.data
}

async function loadCategories() {
  if (!userStore.currentBook) return
  try {
    const res = await fetch(`/api/ledger/books/${userStore.currentBook.id}/categories`, {
      headers: { Authorization: `Bearer ${userStore.token}` },
    }).then(r => r.json())
    if (res.code === 200) {
      const flat: any[] = []
      function flatten(items: any[]) {
        for (const item of items) {
          flat.push(item)
          if (item.children?.length) flatten(item.children)
        }
      }
      flatten(res.data)
      categories.value = flat
    }
  } catch {}
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    const payload = {
      ...form,
      transactionTime: new Date(form.transactionTime).toISOString(),
    }
    if (props.editId) {
      await transactionApi.update(userStore.currentBook!.id, props.editId, payload)
      ElMessage.success('更新成功')
    } else {
      await transactionApi.create(userStore.currentBook!.id, payload)
      ElMessage.success('记账成功')
    }
    emit('saved')
  } catch {
    ElMessage.error('操作失败')
  } finally {
    loading.value = false
  }
}

watch(() => props.visible, (v) => {
  if (v) {
    loadAccounts()
    loadCategories()
  }
})
</script>
