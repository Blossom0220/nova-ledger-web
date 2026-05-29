import request from './request'
import type { ApiResponse, PageResult } from './types'

export interface Transaction {
  id: number
  userId: number
  bookId: number
  accountId: number
  toAccountId?: number
  categoryId?: number
  type: 'INCOME' | 'EXPENSE' | 'TRANSFER'
  amount: number
  transactionTime: string
  note: string
  merchant: string
  tagIds: string
  imageUrls: string
  billId?: number
}

export interface TransactionQuery {
  startDate?: string
  endDate?: string
  categoryId?: number
  accountId?: number
  type?: string
  keyword?: string
  page?: number
  size?: number
}

export const transactionApi = {
  search(bookId: number, params: TransactionQuery) {
    return request.get<any, ApiResponse<PageResult<Transaction>>>(`/ledger/books/${bookId}/transactions`, { params })
  },
  get(bookId: number, id: number) {
    return request.get<any, ApiResponse<Transaction>>(`/ledger/books/${bookId}/transactions/${id}`)
  },
  create(bookId: number, data: Partial<Transaction>) {
    return request.post<any, ApiResponse<Transaction>>(`/ledger/books/${bookId}/transactions`, data)
  },
  update(bookId: number, id: number, data: Partial<Transaction>) {
    return request.put<any, ApiResponse<Transaction>>(`/ledger/books/${bookId}/transactions/${id}`, data)
  },
  delete(bookId: number, id: number) {
    return request.delete<any, ApiResponse<null>>(`/ledger/books/${bookId}/transactions/${id}`)
  },
}
