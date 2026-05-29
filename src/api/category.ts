import request from './request'
import type { ApiResponse } from './types'

export interface Category {
  id: number
  parentId: number | null
  name: string
  icon: string
  color: string
  type: 'INCOME' | 'EXPENSE'
  sortOrder: number
  children: Category[]
}

export const categoryApi = {
  getTree(bookId: number, type?: 'INCOME' | 'EXPENSE') {
    const params: any = {}
    if (type) params.type = type
    return request.get<any, ApiResponse<Category[]>>(`/ledger/books/${bookId}/categories`, { params })
  },
  create(bookId: number, data: { name: string; type: 'INCOME' | 'EXPENSE'; parentId?: number | null; icon?: string; color?: string }) {
    return request.post<any, ApiResponse<Category>>(`/ledger/books/${bookId}/categories`, data)
  },
  update(bookId: number, id: number, data: { name?: string; icon?: string; color?: string; sortOrder?: number }) {
    return request.put<any, ApiResponse<Category>>(`/ledger/books/${bookId}/categories/${id}`, data)
  },
  delete(bookId: number, id: number) {
    return request.delete<any, ApiResponse<null>>(`/ledger/books/${bookId}/categories/${id}`)
  },
}
