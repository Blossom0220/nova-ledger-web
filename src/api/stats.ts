import request from './request'
import type { ApiResponse } from './types'

export interface StatsOverview {
  income: number
  expense: number
  balance: number
  incomeChange: number
  expenseChange: number
  lastIncome: number
  lastExpense: number
}

export interface DailyStats {
  date: string
  income: number
  expense: number
}

export interface CategoryStats {
  categoryId: number
  categoryName: string
  amount: number
  percentage: number
  color: string
}

export const statsApi = {
  overview(bookId: number, month?: string) {
    const params: any = {}
    if (month) params.month = month
    return request.get<any, ApiResponse<StatsOverview>>(`/ledger/books/${bookId}/stats/overview`, { params })
  },
  daily(bookId: number, startDate: string, endDate: string) {
    return request.get<any, ApiResponse<DailyStats[]>>(`/ledger/books/${bookId}/stats/daily`, {
      params: { startDate, endDate },
    })
  },
  byCategory(bookId: number, startDate: string, endDate: string, type?: 'INCOME' | 'EXPENSE') {
    const params: any = { startDate, endDate }
    if (type) params.type = type
    return request.get<any, ApiResponse<CategoryStats[]>>(`/ledger/books/${bookId}/stats/by-category`, { params })
  },
}
