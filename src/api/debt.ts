import request from './request'
import type { ApiResponse } from './types'

export interface Debt {
  id: number
  userId: number
  bookId: number
  name: string
  type: 'LEND' | 'BORROW'
  amount: number
  remainingAmount: number
  debtor: string
  dueDate?: string
  note: string
  status: 'ACTIVE' | 'SETTLED'
}

export const debtApi = {
  list(bookId: number, status?: string) {
    const params: any = {}
    if (status) params.status = status
    return request.get<any, ApiResponse<Debt[]>>(`/ledger/books/${bookId}/debts`, { params })
  },
  create(bookId: number, data: Partial<Debt>) {
    return request.post<any, ApiResponse<Debt>>(`/ledger/books/${bookId}/debts`, data)
  },
  update(bookId: number, id: number, data: Partial<Debt>) {
    return request.put<any, ApiResponse<Debt>>(`/ledger/books/${bookId}/debts/${id}`, data)
  },
  settle(bookId: number, id: number) {
    return request.post<any, ApiResponse<null>>(`/ledger/books/${bookId}/debts/${id}/settle`)
  },
  delete(bookId: number, id: number) {
    return request.delete<any, ApiResponse<null>>(`/ledger/books/${bookId}/debts/${id}`)
  },
}
