<template>
  <div class="home">
    <div class="main-content">
      <MemoEditor @create="createMemo" />
      <div class="memo-header">
        <h2>
          {{ selectedDate ? `${formatDisplayDate(selectedDate)}的记录` : '全部记录' }}
          <button 
            v-if="selectedDate" 
            class="clear-filter"
            @click="clearDateFilter"
          >
            显示全部
          </button>
        </h2>
      </div>
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="error" class="error">{{ error }}</div>
      <MemoList v-else :memos="memos" />
    </div>
    <div class="sidebar">
      <ContributionCalendar @dateSelect="loadMemosByDate" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMemoStore } from '../stores/memos'
import MemoEditor from '../components/MemoEditor.vue'
import MemoList from '../components/MemoList.vue'
import ContributionCalendar from '../components/ContributionCalendar.vue'

const { 
  memos, 
  loading, 
  error, 
  selectedDate,
  createMemo, 
  fetchMemosByDate,
  clearDateFilter 
} = useMemoStore()

const loadMemosByDate = async (date: string) => {
  await fetchMemosByDate(date)
}

const formatDisplayDate = (date: string) => {
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}
</script>

<style scoped>
.home {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
  display: grid;
  grid-template-columns: 1fr 300px;
  gap: 20px;
}

.main-content {
  min-width: 0;
}

.sidebar {
  position: sticky;
  top: 20px;
}

@media (max-width: 768px) {
  .home {
    grid-template-columns: 1fr;
  }
  
  .sidebar {
    position: static;
  }
}

.loading, .error {
  text-align: center;
  padding: 20px;
  color: #666;
}

.error {
  color: #dc3545;
}

.memo-header {
  margin: 20px 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.memo-header h2 {
  font-size: 1.2em;
  color: #333;
  display: flex;
  align-items: center;
  gap: 10px;
}

.clear-filter {
  background: none;
  border: 1px solid #ddd;
  padding: 4px 8px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.8em;
  color: #666;
}

.clear-filter:hover {
  background: #f5f5f5;
}
</style> 