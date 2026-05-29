import request from './request'
import type { ApiResponse } from './types'

export interface Tag {
  id: number
  userId: number
  name: string
  color: string
}

export const tagApi = {
  list() {
    return request.get<any, ApiResponse<Tag[]>>('/ledger/tags')
  },
  create(data: { name: string; color?: string }) {
    return request.post<any, ApiResponse<Tag>>('/ledger/tags', data)
  },
  update(id: number, data: { name?: string; color?: string }) {
    return request.put<any, ApiResponse<Tag>>(`/ledger/tags/${id}`, data)
  },
  delete(id: number) {
    return request.delete<any, ApiResponse<null>>(`/ledger/tags/${id}`)
  },
}
