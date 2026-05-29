<template>
  <div class="page-placeholder">
    <el-card shadow="never">
      <template #header>
        <span style="font-size: 16px; font-weight: bold">{{ title }}</span>
      </template>
      <el-empty :description="'功能开发中...'">
        <el-button type="primary" @click="goBack">返回仪表盘</el-button>
      </el-empty>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router'

const props = defineProps<{ title: string }>()
const router = useRouter()

function goBack() {
  router.push('/')
}
</script>
