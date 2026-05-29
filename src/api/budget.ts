import request from './request'
import type { ApiResponse } from './types'

export interface Budget {
  id: number
  userId: number
  bookId: number
  categoryId: number
  categoryName?: string
  month: string
  budgetAmount: number
  spentAmount: number
  overBudget: boolean
}

export const budgetApi = {
  list(bookId: number, month?: string) {
    const params: any = {}
    if (month) params.month = month
    return request.get<any, ApiResponse<Budget[]>>(`/ledger/books/${bookId}/budgets`, { params })
  },
  create(bookId: number, data: { categoryId: number; month: string; budgetAmount: number }) {
    return request.post<any, ApiResponse<Budget>>(`/ledger/books/${bookId}/budgets`, data)
  },
  update(bookId: number, id: number, data: { budgetAmount: number }) {
    return request.put<any, ApiResponse<Budget>>(`/ledger/books/${bookId}/budgets/${id}`, data)
  },
  delete(bookId: number, id: number) {
    return request.delete<any, ApiResponse<null>>(`/ledger/books/${bookId}/budgets/${id}`)
  },
}
