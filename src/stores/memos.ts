import { ref } from 'vue'
import type { Memo } from '../types/memo'
import { memoApi } from '../api/memos'

export const useMemoStore = () => {
  const memos = ref<Memo[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

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

  const createMemo = async (content: string) => {
    loading.value = true
    error.value = null
    try {
      const newMemo = await memoApi.createMemo(content)
      memos.value.unshift(newMemo)
    } catch (e) {
      console.error(e)
      error.value = '创建失败'
      throw e
    } finally {
      loading.value = false
    }
  }

  // 初始加载数据
  fetchMemos()

  return {
    memos,
    loading,
    error,
    createMemo,
    fetchMemos
  }
} 