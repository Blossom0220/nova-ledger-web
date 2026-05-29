<template>
  <div class="book-setting">
    <el-card shadow="never">
      <template #header>
        <div class="flex-between">
          <span style="font-size: 16px; font-weight: bold">账本管理</span>
          <el-button type="primary" size="small" @click="openAdd">创建账本</el-button>
        </div>
      </template>

      <el-table :data="userStore.books" stripe>
        <el-table-column label="账本名" prop="name" min-width="150" />
        <el-table-column label="描述" prop="description" min-width="200" show-overflow-tooltip />
        <el-table-column label="货币" prop="currency" width="80" />
        <el-table-column label="操作" width="160">
          <template #default="{ row }">
            <el-button
              :type="userStore.currentBook?.id === row.id ? 'primary' : 'default'"
              size="small"
              @click="userStore.setCurrentBook(row)"
            >
              {{ userStore.currentBook?.id === row.id ? '使用中' : '切换' }}
            </el-button>
            <el-button text type="primary" size="small" @click="openEdit(row)">编辑</el-button>
            <el-popconfirm title="确定删除这个账本？" @confirm="handleDelete(row.id)">
              <template #reference>
                <el-button text type="danger" size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="userStore.books.length === 0" description="暂无账本" style="padding: 40px" />
    </el-card>

    <el-card shadow="never" style="margin-top: 20px">
      <template #header>
        <span style="font-size: 16px; font-weight: bold">账户信息</span>
      </template>
      <el-descriptions :column="2" border>
        <el-descriptions-item label="用户名">{{ userStore.user?.username }}</el-descriptions-item>
        <el-descriptions-item label="用户ID">{{ userStore.user?.userId }}</el-descriptions-item>
      </el-descriptions>
    </el-card>

    <!-- 创建/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑账本' : '创建账本'" width="400px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="如：个人账本" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="2" placeholder="选填" />
        </el-form-item>
        <el-form-item label="币种">
          <el-select v-model="form.currency" style="width: 100%">
            <el-option label="CNY（人民币）" value="CNY" />
            <el-option label="USD（美元）" value="USD" />
            <el-option label="HKD（港币）" value="HKD" />
            <el-option label="JPY（日元）" value="JPY" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="loading" @click="handleSubmit">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useUserStore } from '@/stores/user'
import { bookApi, type Book } from '@/api/book'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

const userStore = useUserStore()
const formRef = ref<FormInstance>()
const loading = ref(false)
const dialogVisible = ref(false)
const editingId = ref<number | undefined>()

const form = reactive({
  name: '',
  description: '',
  currency: 'CNY',
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入账本名称', trigger: 'blur' }],
}

function openAdd() {
  editingId.value = undefined
  form.name = ''
  form.description = ''
  form.currency = 'CNY'
  dialogVisible.value = true
}

function openEdit(book: Book) {
  editingId.value = book.id
  form.name = book.name
  form.description = book.description || ''
  form.currency = book.currency || 'CNY'
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  loading.value = true
  try {
    if (editingId.value) {
      await bookApi.updateBook(editingId.value, {
        name: form.name,
        description: form.description,
        currency: form.currency,
      })
      ElMessage.success('更新成功')
    } else {
      const res = await bookApi.createBook({
        name: form.name,
        description: form.description,
        currency: form.currency,
      })
      if (res.data) userStore.setCurrentBook(res.data)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    userStore.fetchBooks()
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '操作失败')
  } finally {
    loading.value = false
  }
}

async function handleDelete(id: number) {
  try {
    await bookApi.deleteBook(id)
    ElMessage.success('删除成功')
    if (userStore.currentBook?.id === id) {
      userStore.setCurrentBook(userStore.books.filter(b => b.id !== id)[0] || null as any)
    }
    userStore.fetchBooks()
  } catch {
    ElMessage.error('删除失败')
  }
}
</script>

<style scoped>
.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style>
