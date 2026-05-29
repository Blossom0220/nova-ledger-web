import request from './request'
import type { ApiResponse, PageResult } from './types'

export interface TransactionVO {
  id: number
  userId: number
  bookId: number
  accountId: number
  accountName: string
  toAccountId?: number
  toAccountName?: string
  categoryId?: number
  categoryName?: string
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
    return request.get<any, ApiResponse<PageResult<TransactionVO>>>(`/ledger/books/${bookId}/transactions`, { params })
  },
  get(bookId: number, id: number) {
    return request.get<any, ApiResponse<TransactionVO>>(`/ledger/books/${bookId}/transactions/${id}`)
  },
  create(bookId: number, data: any) {
    return request.post<any, ApiResponse<TransactionVO>>(`/ledger/books/${bookId}/transactions`, data)
  },
  update(bookId: number, id: number, data: any) {
    return request.put<any, ApiResponse<TransactionVO>>(`/ledger/books/${bookId}/transactions/${id}`, data)
  },
  delete(bookId: number, id: number) {
    return request.delete<any, ApiResponse<null>>(`/ledger/books/${bookId}/transactions/${id}`)
  },
}
