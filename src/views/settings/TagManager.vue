<template>
  <div class="tag-manager">
    <el-card shadow="never">
      <template #header>
        <div class="flex-between">
          <span style="font-size: 16px; font-weight: bold">🏷️ 标签管理</span>
          <el-button type="primary" size="small" @click="openAdd">添加标签</el-button>
        </div>
      </template>

      <el-empty v-if="loading && tags.length === 0" description="加载中..." />
      <el-empty v-else-if="tags.length === 0" :description="'暂无标签，点击「添加标签」创建'" />

      <div v-else class="tag-grid">
        <div v-for="tag in tags" :key="tag.id" class="tag-card" :style="{ borderLeftColor: tag.color || '#409eff' }">
          <div class="tag-info">
            <el-tag :color="tag.color || '#409eff'" :style="{ color: '#fff', border: 'none' }" size="small">
              {{ tag.name }}
            </el-tag>
          </div>
          <div class="tag-actions">
            <el-button text type="primary" size="small" @click="openEdit(tag)">编辑</el-button>
            <el-popconfirm title="确定删除？" @confirm="handleDelete(tag.id)">
              <template #reference>
                <el-button text type="danger" size="small">删除</el-button>
              </template>
            </el-popconfirm>
          </div>
        </div>
      </div>
    </el-card>

    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑标签' : '添加标签'" width="380px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="60px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" placeholder="标签名" maxlength="30" />
        </el-form-item>
        <el-form-item label="颜色">
          <el-color-picker v-model="form.color" show-alpha />
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
import { tagApi, type Tag } from '@/api/tag'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

const formRef = ref<FormInstance>()
const loading = ref(false)
const loadingSubmit = ref(false)
const dialogVisible = ref(false)
const editingId = ref<number | undefined>()

const tags = ref<Tag[]>([])
const form = reactive({ name: '', color: '#409eff' })
const rules: FormRules = { name: [{ required: true, message: '请输入名称', trigger: 'blur' }] }

async function loadTags() {
  loading.value = true
  try {
    const res = await tagApi.list()
    if (res.code === 200) tags.value = res.data
  } finally { loading.value = false }
}

function openAdd() {
  editingId.value = undefined
  form.name = ''
  form.color = '#409eff'
  dialogVisible.value = true
}

function openEdit(tag: Tag) {
  editingId.value = tag.id
  form.name = tag.name
  form.color = tag.color || '#409eff'
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  loadingSubmit.value = true
  try {
    if (editingId.value) {
      await tagApi.update(editingId.value, { name: form.name, color: form.color })
      ElMessage.success('更新成功')
    } else {
      await tagApi.create({ name: form.name, color: form.color })
      ElMessage.success('添加成功')
    }
    dialogVisible.value = false
    loadTags()
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '操作失败')
  } finally { loadingSubmit.value = false }
}

async function handleDelete(id: number) {
  try {
    await tagApi.delete(id)
    ElMessage.success('删除成功')
    loadTags()
  } catch { ElMessage.error('删除失败') }
}

onMounted(() => loadTags())
</script>

<style scoped>
.flex-between { display: flex; justify-content: space-between; align-items: center; }
.tag-grid { display: flex; flex-wrap: wrap; gap: 12px; }
.tag-card {
  display: flex; align-items: center; justify-content: space-between;
  padding: 10px 14px; border: 1px solid #ebeef5; border-radius: 8px;
  border-left: 4px solid; width: 240px; background: #fff;
}
.tag-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
.tag-info { display: flex; align-items: center; gap: 8px; }
.tag-actions { display: none; gap: 4px; flex-shrink: 0; }
.tag-card:hover .tag-actions { display: flex; }
</style>
