import type { Memo } from '../types/memo'

const API_URL = 'http://localhost:3000/api'

export const memoApi = {
  async getAllMemos(): Promise<Memo[]> {
    try {
      const response = await fetch(`${API_URL}/memos`)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      return data.map((memo: any) => ({
        id: memo.id,
        content: memo.content,
        createdAt: memo.created_at,
        updatedAt: memo.updated_at,
        userId: memo.user_id,
        visibility: memo.visibility
      }))
    } catch (error) {
      console.error('Failed to fetch memos:', error)
      throw error
    }
  },

  async createMemo(content: string): Promise<Memo> {
    try {
      const response = await fetch(`${API_URL}/memos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content })
      })
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      return {
        id: data.id,
        content: data.content,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        userId: data.user_id,
        visibility: data.visibility
      }
    } catch (error) {
      console.error('Failed to create memo:', error)
      throw error
    }
  }
} 