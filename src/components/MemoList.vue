<template>
  <div class="memo-list">
    <div v-for="memo in memos" :key="memo._id" class="memo-item">
      <div class="memo-content" v-html="memo.content.html"></div>
      <div class="memo-resources" v-if="memo.resources?.length">
        <div v-for="resource in memo.resources" :key="resource.url" class="resource-item">
          <img v-if="resource.type.startsWith('image/')" 
               :src="resource.url" 
               :alt="resource.name"
               @click="openImage(resource.url)"
               @error="handleImageError">
        </div>
      </div>
      <div class="memo-meta">
        <span class="memo-time">{{ formatDate(memo.createdAt) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Memo } from '../types/memo'
import { formatDate } from '../utils/date'

defineProps<{
  memos: Memo[]
}>()

const openImage = (url: string) => {
  window.open(url, '_blank')
}

const handleImageError = (e: Event) => {
  const img = e.target as HTMLImageElement
  console.error('Image failed to load:', img.src)
}
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

.memo-content :deep(pre) {
  background: #f6f8fa;
  padding: 16px;
  border-radius: 6px;
  overflow-x: auto;
}

.memo-content :deep(code) {
  font-family: monospace;
}

.memo-content :deep(p) {
  margin: 8px 0;
}

.memo-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}

.memo-resources {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.resource-item {
  position: relative;
  width: 150px;
  height: 150px;
  border-radius: 4px;
  overflow: hidden;
  cursor: pointer;
}

.resource-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.2s;
}

.resource-item img:hover {
  transform: scale(1.05);
}
</style> 