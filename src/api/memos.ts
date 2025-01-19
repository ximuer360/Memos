import type { Memo } from '../types/memo'

const API_URL = `${import.meta.env.VITE_API_URL}/api`

export const memoApi = {
  async getAllMemos(): Promise<Memo[]> {
    const response = await fetch(`${API_URL}/memos`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response.json()
  },

  async createMemo(
    content: string, 
    resources: Array<{ url: string, name: string, type: string, size: number }>
  ): Promise<Memo> {
    const response = await fetch(`${API_URL}/memos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content, resources })
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to create memo')
    }
    
    return response.json()
  },

  async getMemosByDate(date: string): Promise<Memo[]> {
    const response = await fetch(`${API_URL}/memos/date/${date}`)
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    return response.json()
  },

  async deleteMemo(id: string): Promise<void> {
    const response = await fetch(`${API_URL}/memos/${id}`, {
      method: 'DELETE'
    })
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
  },

  async updateMemo(
    id: string,
    content: string,
    resources: Array<{ url: string, name: string, type: string, size: number }>
  ): Promise<Memo> {
    const response = await fetch(`${API_URL}/memos/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content, resources })
    })
    
    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Failed to update memo')
    }
    
    return response.json()
  }
} 