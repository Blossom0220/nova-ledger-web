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
  }

  async function fetchBooks() {
    const res = await bookApi.getBooks()
    if (res.code === 200) {
      books.value = res.data
      if (!currentBook.value && res.data.length > 0) {
        currentBook.value = res.data[0]
      }
    }
  }

  function setCurrentBook(book: Book) {
    currentBook.value = book
  }

  return { user, token, books, currentBook, login, register, logout, fetchBooks, setCurrentBook }
})
