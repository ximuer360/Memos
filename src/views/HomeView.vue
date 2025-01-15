<template>
  <div class="home">
    <MemoEditor @create="createMemo" />
    <div v-if="loading" class="loading">加载中...</div>
    <div v-else-if="error" class="error">{{ error }}</div>
    <MemoList v-else :memos="memos" />
  </div>
</template>

<script setup lang="ts">
import { useMemoStore } from '../stores/memos'
import MemoEditor from '../components/MemoEditor.vue'
import MemoList from '../components/MemoList.vue'

const { memos, loading, error, createMemo } = useMemoStore()
</script>

<style scoped>
.home {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.loading, .error {
  text-align: center;
  padding: 20px;
  color: #666;
}

.error {
  color: #dc3545;
}
</style> 