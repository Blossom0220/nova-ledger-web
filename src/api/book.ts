import request from './request'
import type { ApiResponse } from './types'

export interface Book {
  id: number
  userId: number
  name: string
  description: string
  currency: string
  coverColor: string
  sortOrder: number
}

export const bookApi = {
  getBooks() {
    return request.get<any, ApiResponse<Book[]>>('/ledger/books')
  },
  getBook(id: number) {
    return request.get<any, ApiResponse<Book>>(`/ledger/books/${id}`)
  },
  createBook(data: Partial<Book>) {
    return request.post<any, ApiResponse<Book>>('/ledger/books', data)
  },
  updateBook(id: number, data: Partial<Book>) {
    return request.put<any, ApiResponse<Book>>(`/ledger/books/${id}`, data)
  },
  deleteBook(id: number) {
    return request.delete<any, ApiResponse<null>>(`/ledger/books/${id}`)
  },
}
