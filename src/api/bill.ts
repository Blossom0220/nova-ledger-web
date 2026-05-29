import request from './request'
import type { ApiResponse } from './types'

export interface Bill {
  id: number
  userId: number
  bookId: number
  name: string
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
  amount: number
  categoryId?: number
  accountId?: number
  toAccountId?: number
  frequency: 'ONCE' | 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'YEARLY'
  nextDate: string
  endDate?: string
  note: string
  autoGenerate: boolean
  enabled: boolean
}

export const billApi = {
  list(bookId: number, enabled?: boolean) {
    const params: any = {}
    if (enabled !== undefined) params.enabled = enabled
    return request.get<any, ApiResponse<Bill[]>>(`/ledger/books/${bookId}/bills`, { params })
  },
  create(bookId: number, data: Partial<Bill>) {
    return request.post<any, ApiResponse<Bill>>(`/ledger/books/${bookId}/bills`, data)
  },
  update(bookId: number, id: number, data: Partial<Bill>) {
    return request.put<any, ApiResponse<Bill>>(`/ledger/books/${bookId}/bills/${id}`, data)
  },
  delete(bookId: number, id: number) {
    return request.delete<any, ApiResponse<null>>(`/ledger/books/${bookId}/bills/${id}`)
  },
}
