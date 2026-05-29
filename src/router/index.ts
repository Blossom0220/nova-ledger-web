import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/login/LoginPage.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/register',
      name: 'Register',
      component: () => import('@/views/login/RegisterPage.vue'),
      meta: { requiresAuth: false },
    },
    {
      path: '/',
      component: () => import('@/views/layout/MainLayout.vue'),
      meta: { requiresAuth: true },
      redirect: '/dashboard',
      children: [
        {
          path: 'dashboard',
          name: 'Dashboard',
          component: () => import('@/views/dashboard/DashboardPage.vue'),
        },
        {
          path: 'transactions',
          name: 'Transactions',
          component: () => import('@/views/transactions/TransactionList.vue'),
        },
        {
          path: 'accounts',
          name: 'Accounts',
          component: () => import('@/views/accounts/AccountList.vue'),
        },
        {
          path: 'categories',
          name: 'Categories',
          component: () => import('@/views/categories/CategoryManager.vue'),
        },
        {
          path: 'budgets',
          name: 'Budgets',
          component: () => import('@/views/budgets/BudgetList.vue'),
        },
        {
          path: 'bills',
          name: 'Bills',
          component: () => import('@/views/bills/BillList.vue'),
        },
        {
          path: 'debts',
          name: 'Debts',
          component: () => import('@/views/debts/DebtList.vue'),
        },
        {
          path: 'stats',
          name: 'Stats',
          component: () => import('@/views/stats/ReportPage.vue'),
        },
        {
          path: 'settings',
          name: 'Settings',
          component: () => import('@/views/settings/BookSetting.vue'),
        },
        {
          path: 'tags',
          name: 'Tags',
          component: () => import('@/views/settings/TagManager.vue'),
        },
      ],
    },
  ],
})

// 初始化标记：防止每次路由切换都重复拉取
let initialized = false

router.beforeEach(async (to) => {
  // 初始化状态（刷新后只执行一次）
  if (!initialized) {
    initialized = true
    const token = localStorage.getItem('token')
    if (token) {
      const userStore = useUserStore()
      await userStore.init()
    }
  }

  const storeToken = localStorage.getItem('token')
  if (to.meta.requiresAuth !== false && !storeToken) {
    return '/login'
  }
  if ((to.name === 'Login' || to.name === 'Register') && storeToken) {
    return '/'
  }
})

export default router
