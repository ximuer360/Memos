import { ref, computed } from 'vue'
import type { Memo } from '../types/memo'
import { memoApi } from '../api/memos'
import { useAuthStore } from '../stores/auth'

export const useMemoStore = () => {
  const memos = ref<Memo[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const selectedDate = ref<string | null>(null)
  
  const displayedMemos = computed(() => {
    if (!selectedDate.value) {
      return memos.value
    }
    
    const date = new Date(selectedDate.value)
    const nextDate = new Date(date)
    nextDate.setDate(date.getDate() + 1)
    
    return memos.value.filter(memo => {
      const memoDate = new Date(memo.createdAt)
      return memoDate >= date && memoDate < nextDate
    })
  })

  const fetchMemos = async () => {
    loading.value = true
    error.value = null
    try {
      memos.value = await memoApi.getAllMemos()
    } catch (e) {
      console.error(e)
      error.value = '获取数据失败'
    } finally {
      loading.value = false
    }
  }

  const fetchMemosByDate = async (date: string) => {
    loading.value = true
    error.value = null
    try {
      selectedDate.value = date
      const dateMemos = await memoApi.getMemosByDate(date)
      // 更新当前显示的 memos
      memos.value = dateMemos
    } catch (e) {
      console.error(e)
      error.value = '获取数据失败'
    } finally {
      loading.value = false
    }
  }

  const clearDateFilter = async () => {
    selectedDate.value = null
    await fetchMemos()
  }

  const createMemo = async (content: string, resources: Array<{ url: string, name: string, type: string, size: number }>) => {
    loading.value = true
    error.value = null
    try {
      const newMemo = await memoApi.createMemo(content, resources)
      memos.value.unshift(newMemo)
    } catch (e) {
      console.error(e)
      error.value = '创建失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  const deleteMemo = async (id: string) => {
    try {
      const authStore = useAuthStore()
      await fetch(`${import.meta.env.VITE_API_URL}/api/memos/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${authStore.token}`
        }
      })
      memos.value = memos.value.filter(memo => memo._id !== id)
    } catch (e) {
      console.error('Delete error:', e)
      throw e
    }
  }

  const updateMemo = async (id: string, content: string, resources: any[]) => {
    try {
      const authStore = useAuthStore()
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/memos/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authStore.token}`
        },
        body: JSON.stringify({ content, resources })
      })

      if (!response.ok) {
        throw new Error('Failed to update memo')
      }

      const updatedMemo = await response.json()
      const index = memos.value.findIndex(memo => memo._id === id)
      if (index !== -1) {
        memos.value[index] = updatedMemo
      }
    } catch (e) {
      console.error('Update error:', e)
      throw e
    }
  }

  // 初始加载数据
  fetchMemos()

  return {
    memos: displayedMemos,
    loading,
    error,
    selectedDate,
    createMemo,
    fetchMemos,
    fetchMemosByDate,
    clearDateFilter,
    deleteMemo,
    updateMemo
  }
} 