import { defineStore } from 'pinia'
import { ref } from 'vue'
import { authApi, type AuthResult } from '@/api/auth'
import { bookApi, type Book } from '@/api/book'

export const useUserStore = defineStore('user', () => {
  const user = ref<AuthResult | null>(JSON.parse(localStorage.getItem('user') || 'null'))
  const token = ref<string>(localStorage.getItem('token') || '')
  const books = ref<Book[]>([])
  const currentBook = ref<Book | null>(null)

  async function login(username: string, password: string) {
    const res = await authApi.login({ username, password })
    if (res.code === 200) {
      user.value = res.data
      token.value = res.data.token
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data))
      return true
    }
    throw new Error(res.message)
  }

  async function register(username: string, password: string, email?: string) {
    const res = await authApi.register({ username, password, email })
    if (res.code === 200) {
      user.value = res.data
      token.value = res.data.token
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data))
      return true
    }
    throw new Error(res.message)
  }

  function logout() {
    user.value = null
    token.value = ''
    currentBook.value = null
    books.value = []
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    localStorage.removeItem('currentBookId')
  }

  /**
   * 页面刷新后初始化：恢复 token/用户信息，拉取账本列表
   */
  async function init() {
    const savedToken = localStorage.getItem('token')
    if (!savedToken) return false

    token.value = savedToken
    const savedUser = localStorage.getItem('user')
    if (savedUser) user.value = JSON.parse(savedUser)

    await fetchBooks()
    return true
  }

  async function fetchBooks() {
    try {
      const res = await bookApi.getBooks()
      if (res.code === 200) {
        books.value = res.data
        if (res.data.length > 0) {
          // 优先选 localStorage 记录的账本 ID
          const savedBookId = localStorage.getItem('currentBookId')
          const found = savedBookId ? res.data.find((b: Book) => b.id === Number(savedBookId)) : null
          currentBook.value = found || res.data[0]
        }
      }
    } catch {
      // token 失效等情况，静默处理
    }
  }

  function setCurrentBook(book: Book) {
    currentBook.value = book
    localStorage.setItem('currentBookId', String(book.id))
  }

  return {
    user, token, books, currentBook,
    login, register, logout, init, fetchBooks, setCurrentBook,
  }
})
