import request from './request'
import type { ApiResponse, PageResult } from './types'

export interface Account {
  id: number
  userId: number
  bookId: number
  name: string
  type: 'CASH' | 'BANK' | 'ALIPAY' | 'WECHAT' | 'CREDIT_CARD' | 'INVESTMENT' | 'OTHER'
  balance: number
  initialBalance: number
  currency: string
  icon: string
  sortOrder: number
}

export const accountApi = {
  getAccounts(bookId: number) {
    return request.get<any, ApiResponse<Account[]>>(`/ledger/books/${bookId}/accounts`)
  },
  createAccount(bookId: number, data: Partial<Account>) {
    return request.post<any, ApiResponse<Account>>(`/ledger/books/${bookId}/accounts`, data)
  },
  updateAccount(bookId: number, id: number, data: Partial<Account>) {
    return request.put<any, ApiResponse<Account>>(`/ledger/books/${bookId}/accounts/${id}`, data)
  },
  deleteAccount(bookId: number, id: number) {
    return request.delete<any, ApiResponse<null>>(`/ledger/books/${bookId}/accounts/${id}`)
  },
  recalculate(bookId: number, id: number) {
    return request.post<any, ApiResponse<null>>(`/ledger/books/${bookId}/accounts/${id}/recalculate`)
  },
}
