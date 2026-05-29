<template>
  <div class="category-manager">
    <el-row :gutter="20">
      <!-- 收入分类 -->
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <div class="flex-between">
              <span style="font-size: 16px; font-weight: bold">
                <el-tag type="success" size="small" round>收入</el-tag>
                分类
              </span>
              <el-button type="primary" size="small" @click="openAdd('INCOME')">添加收入分类</el-button>
            </div>
          </template>
          <div v-if="incomeTree.length === 0" style="text-align: center; padding: 40px; color: #909399">
            暂无收入分类，点击上方按钮添加
          </div>
          <el-tree
            v-else
            :data="incomeTree"
            :props="{ children: 'children', label: 'name' }"
            node-key="id"
            default-expand-all
            :expand-on-click-node="false"
          >
            <template #default="{ node, data }">
              <span class="custom-tree-node">
                <span class="node-label">
                  <el-tag :color="data.color || '#e6e6e6'" :style="{ color: data.color ? '#fff' : '#333', borderRadius: '4px', border: 'none', padding: '0 6px' }" size="small">
                    {{ data.icon || '📁' }}
                  </el-tag>
                  {{ data.name }}
                </span>
                <span class="node-actions">
                  <el-button text size="small" @click="openEdit(data)">编辑</el-button>
                  <el-button v-if="!data.parentId" text size="small" @click="openAdd(data.type, data.id)">添加子类</el-button>
                  <el-popconfirm title="确定删除？" @confirm="handleDelete(data.id)">
                    <template #reference>
                      <el-button text size="small" type="danger">删除</el-button>
                    </template>
                  </el-popconfirm>
                </span>
              </span>
            </template>
          </el-tree>
        </el-card>
      </el-col>

      <!-- 支出分类 -->
      <el-col :span="12">
        <el-card shadow="never">
          <template #header>
            <div class="flex-between">
              <span style="font-size: 16px; font-weight: bold">
                <el-tag type="danger" size="small" round>支出</el-tag>
                分类
              </span>
              <el-button type="primary" size="small" @click="openAdd('EXPENSE')">添加支出分类</el-button>
            </div>
          </template>
          <div v-if="expenseTree.length === 0" style="text-align: center; padding: 40px; color: #909399">
            暂无支出分类，点击上方按钮添加
          </div>
          <el-tree
            v-else
            :data="expenseTree"
            :props="{ children: 'children', label: 'name' }"
            node-key="id"
            default-expand-all
            :expand-on-click-node="false"
          >
            <template #default="{ node, data }">
              <span class="custom-tree-node">
                <span class="node-label">
                  <el-tag :color="data.color || '#e6e6e6'" :style="{ color: data.color ? '#fff' : '#333', borderRadius: '4px', border: 'none', padding: '0 6px' }" size="small">
                    {{ data.icon || '📁' }}
                  </el-tag>
                  {{ data.name }}
                </span>
                <span class="node-actions">
                  <el-button text size="small" @click="openEdit(data)">编辑</el-button>
                  <el-button v-if="!data.parentId" text size="small" @click="openAdd(data.type, data.id)">添加子类</el-button>
                  <el-popconfirm title="确定删除？" @confirm="handleDelete(data.id)">
                    <template #reference>
                      <el-button text size="small" type="danger">删除</el-button>
                    </template>
                  </el-popconfirm>
                </span>
              </span>
            </template>
          </el-tree>
        </el-card>
      </el-col>
    </el-row>

    <!-- 添加/编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="editingId ? '编辑分类' : '添加分类'" width="420px">
      <el-form ref="formRef" :model="form" :rules="rules" label-width="80px">
        <el-form-item label="分类名" prop="name">
          <el-input v-model="form.name" placeholder="如：工资、餐饮" />
        </el-form-item>
        <el-form-item label="上级分类" v-if="!editingId">
          <el-tree-select
            v-model="form.parentId"
            :data="dialogType === 'INCOME' ? incomeTree : expenseTree"
            :props="{ children: 'children', label: 'name', value: 'id' }"
            placeholder="不选则为顶级分类"
            clearable
            style="width: 100%"
          />
        </el-form-item>
        <el-form-item label="类型">
          <el-radio-group v-model="form.type" :disabled="!!editingId">
            <el-radio value="INCOME">收入</el-radio>
            <el-radio value="EXPENSE">支出</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="图标">
          <el-input v-model="form.icon" placeholder="如：💰 🍔 🏠（emoji）" maxlength="10" />
        </el-form-item>
        <el-form-item label="颜色">
          <el-color-picker v-model="form.color" show-alpha />
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
import { ref, reactive, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { categoryApi, type Category } from '@/api/category'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'

const userStore = useUserStore()
const formRef = ref<FormInstance>()
const loading = ref(false)
const dialogVisible = ref(false)
const editingId = ref<number | undefined>()
const dialogType = ref<'INCOME' | 'EXPENSE'>('EXPENSE')

const incomeTree = ref<Category[]>([])
const expenseTree = ref<Category[]>([])

const form = reactive({
  name: '',
  parentId: null as number | null,
  type: 'EXPENSE' as 'INCOME' | 'EXPENSE',
  icon: '',
  color: '',
})

const rules: FormRules = {
  name: [{ required: true, message: '请输入分类名', trigger: 'blur' }],
  type: [{ required: true, message: '请选择类型' }],
}

async function loadCategories() {
  if (!userStore.currentBook) return
  const [incomeRes, expenseRes] = await Promise.all([
    categoryApi.getTree(userStore.currentBook.id, 'INCOME'),
    categoryApi.getTree(userStore.currentBook.id, 'EXPENSE'),
  ])
  if (incomeRes.code === 200) incomeTree.value = incomeRes.data
  if (expenseRes.code === 200) expenseTree.value = expenseRes.data
}

function openAdd(type: 'INCOME' | 'EXPENSE', parentId?: number) {
  editingId.value = undefined
  dialogType.value = type
  form.name = ''
  form.parentId = parentId ?? null
  form.type = type
  form.icon = ''
  form.color = ''
  dialogVisible.value = true
}

function openEdit(data: Category) {
  editingId.value = data.id
  dialogType.value = data.type
  form.name = data.name
  form.parentId = data.parentId
  form.type = data.type
  form.icon = data.icon || ''
  form.color = data.color || ''
  dialogVisible.value = true
}

async function handleSubmit() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid || !userStore.currentBook) return
  loading.value = true
  try {
    if (editingId.value) {
      await categoryApi.update(userStore.currentBook.id, editingId.value, {
        name: form.name, icon: form.icon, color: form.color,
      })
      ElMessage.success('更新成功')
    } else {
      await categoryApi.create(userStore.currentBook.id, {
        name: form.name, type: form.type, parentId: form.parentId,
        icon: form.icon, color: form.color,
      })
      ElMessage.success('添加成功')
    }
    dialogVisible.value = false
    loadCategories()
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '操作失败')
  } finally {
    loading.value = false
  }
}

async function handleDelete(id: number) {
  if (!userStore.currentBook) return
  try {
    const res = await categoryApi.delete(userStore.currentBook.id, id)
    if (res.code === 200) {
      ElMessage.success('删除成功')
      loadCategories()
    }
  } catch (e: any) {
    ElMessage.error(e.response?.data?.message || '删除失败')
  }
}

onMounted(() => loadCategories())
</script>

<style scoped>
.flex-between {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.custom-tree-node {
  display: flex;
  flex: 1;
  justify-content: space-between;
  align-items: center;
  padding-right: 8px;
}
.node-label {
  display: flex;
  align-items: center;
  gap: 6px;
}
.node-actions {
  display: none;
}
.custom-tree-node:hover .node-actions {
  display: inline-flex;
}
.category-manager :deep(.el-tree-node__content) {
  height: 36px;
}
</style>
