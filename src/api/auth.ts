import request from './request'

export interface LoginDTO {
  username: string
  password: string
}

export interface RegisterDTO {
  username: string
  password: string
  email?: string
}

export interface AuthResult {
  userId: number
  username: string
  token: string
}

export const authApi = {
  login(data: LoginDTO) {
    return request.post<any, { code: number; message: string; data: AuthResult }>('/auth/login', data)
  },
  register(data: RegisterDTO) {
    return request.post<any, { code: number; message: string; data: AuthResult }>('/auth/register', data)
  },
}
