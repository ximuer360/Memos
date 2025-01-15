<template>
  <div class="memo-list">
    <div v-for="memo in memos" :key="memo.id" class="memo-item">
      <div class="memo-content">{{ memo.content }}</div>
      <div class="memo-meta">
        <span class="memo-time">{{ formatDate(memo.createdAt) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Memo } from '../types/memo'
import { formatDate } from '../utils/date'

defineProps<{
  memos: Memo[]
}>()
</script>

<style scoped>
.memo-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.memo-item {
  background: white;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.memo-content {
  font-size: 16px;
  margin-bottom: 8px;
}

.memo-meta {
  font-size: 14px;
  color: #666;
}

.memo-time {
  color: #888;
}
</style> 