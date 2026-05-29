<template>
  <el-container class="main-layout">
    <!-- 侧边栏 -->
    <el-aside :width="isCollapse ? '64px' : '220px'" class="sidebar">
      <div class="logo" @click="router.push('/')">
        <el-icon :size="24"><Coin /></el-icon>
        <span v-show="!isCollapse">Nova Ledger</span>
      </div>

      <div class="book-select" v-show="!isCollapse">
        <el-select v-model="currentBookId" placeholder="选择账本" @change="switchBook" style="width: 100%">
          <el-option v-for="b in userStore.books" :key="b.id" :label="b.name" :value="b.id" />
        </el-select>
      </div>

      <el-menu :default-active="activeMenu" :collapse="isCollapse" router>
        <el-menu-item index="/dashboard">
          <el-icon><Odometer /></el-icon>
          <template #title>仪表盘</template>
        </el-menu-item>
        <el-menu-item index="/transactions">
          <el-icon><List /></el-icon>
          <template #title>流水记录</template>
        </el-menu-item>
        <el-menu-item index="/accounts">
          <el-icon><Wallet /></el-icon>
          <template #title>账户管理</template>
        </el-menu-item>
        <el-menu-item index="/categories">
          <el-icon><CollectionTag /></el-icon>
          <template #title>分类管理</template>
        </el-menu-item>
        <el-menu-item index="/budgets">
          <el-icon><DataBoard /></el-icon>
          <template #title>预算管理</template>
        </el-menu-item>
        <el-menu-item index="/bills">
          <el-icon><Clock /></el-icon>
          <template #title>周期账单</template>
        </el-menu-item>
        <el-menu-item index="/debts">
          <el-icon><CreditCard /></el-icon>
          <template #title>债权债务</template>
        </el-menu-item>
        <el-menu-item index="/stats">
          <el-icon><TrendCharts /></el-icon>
          <template #title>统计报表</template>
        </el-menu-item>
        <el-menu-item index="/settings">
          <el-icon><Setting /></el-icon>
          <template #title>设置</template>
        </el-menu-item>
      </el-menu>
    </el-aside>

    <el-container>
      <!-- 顶部栏 -->
      <el-header class="header">
        <el-button text @click="isCollapse = !isCollapse">
          <el-icon><Fold v-if="!isCollapse" /><Expand v-else /></el-icon>
        </el-button>
        <div style="flex: 1" />
        <el-dropdown trigger="click">
          <span class="user-info">
            <el-avatar :size="32" icon="UserFilled" />
            <span class="username">{{ userStore.user?.username }}</span>
            <el-icon><ArrowDown /></el-icon>
          </span>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item @click="handleLogout">退出登录</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>
      </el-header>

      <!-- 内容区 -->
      <el-main class="main-content">
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'
import {
  Coin, Odometer, List, Wallet, CollectionTag,
  DataBoard, Clock, CreditCard, TrendCharts, Setting,
  Fold, Expand, UserFilled, ArrowDown,
} from '@element-plus/icons-vue'

const router = useRouter()
const route = useRoute()
const userStore = useUserStore()

const isCollapse = ref(false)
const currentBookId = ref<number | undefined>(userStore.currentBook?.id)

const activeMenu = computed(() => route.path)

function switchBook(id: number) {
  const book = userStore.books.find(b => b.id === id)
  if (book) userStore.setCurrentBook(book)
}

function handleLogout() {
  userStore.logout()
  ElMessage.success('已退出')
  router.push('/login')
}

onMounted(() => {
  currentBookId.value = userStore.currentBook?.id
})
</script>

<style scoped>
.main-layout {
  height: 100vh;
}
.sidebar {
  background: #304156;
  color: #fff;
  overflow: hidden;
  transition: width 0.3s;
}
.logo {
  height: 60px;
  display: flex;
  align-items: center;
  padding: 0 16px;
  gap: 10px;
  cursor: pointer;
  color: #fff;
  font-size: 18px;
  font-weight: bold;
  border-bottom: 1px solid rgba(255,255,255,0.1);
}
.book-select {
  padding: 12px 12px 8px;
}
.book-select :deep(.el-select .el-input__wrapper) {
  background: rgba(255,255,255,0.1);
  box-shadow: none;
}
.book-select :deep(.el-select .el-input__inner) {
  color: #fff;
}
.sidebar :deep(.el-menu) {
  border-right: none;
  background: transparent;
}
.sidebar :deep(.el-menu-item) {
  color: rgba(255,255,255,0.65);
}
.sidebar :deep(.el-menu-item.is-active) {
  color: #409eff;
  background: rgba(64,158,255,0.1);
}
.sidebar :deep(.el-menu-item:hover) {
  background: rgba(255,255,255,0.05);
  color: #fff;
}
.header {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #e4e7ed;
  background: #fff;
  padding: 0 16px;
}
.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}
.username {
  font-size: 14px;
  color: #303133;
}
.main-content {
  background: #f5f7fa;
  padding: 20px;
  overflow-y: auto;
}
</style>
