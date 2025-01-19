<template>
  <div class="memo-list">
    <div v-for="memo in memos" :key="memo._id" class="memo-item">
      <div class="memo-content markdown-body" v-html="memo.content.html"></div>
      <div class="memo-resources" v-if="memo.resources?.length">
        <div v-for="resource in memo.resources" :key="resource.url" class="resource-item">
          <img v-if="resource.type.startsWith('image/')" 
               :src="resource.url" 
               :alt="resource.name"
               @click="showImage(resource.url)"
               @error="handleImageError">
        </div>
      </div>
      <div class="memo-meta">
        <span class="memo-time">{{ formatDate(memo.createdAt) }}</span>
      </div>
    </div>
    <ImageViewer ref="imageViewer" />
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Memo } from '../types/memo'
import { formatDate } from '../utils/date'
import ImageViewer from './ImageViewer.vue'

defineProps<{
  memos: Memo[]
}>()

const imageViewer = ref<InstanceType<typeof ImageViewer> | null>(null)

const showImage = (url: string) => {
  imageViewer.value?.show(url)
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

/* Markdown 样式 */
.markdown-body :deep(h1) {
  font-size: 1.5em;
  margin-top: 1em;
  margin-bottom: 0.5em;
}

.markdown-body :deep(h2) {
  font-size: 1.3em;
  margin-top: 0.8em;
  margin-bottom: 0.4em;
}

.markdown-body :deep(p) {
  margin: 0.5em 0;
  line-height: 1.6;
}

.markdown-body :deep(code) {
  background: rgba(175, 184, 193, 0.2);
  padding: 0.2em 0.4em;
  border-radius: 6px;
  font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;
  font-size: 0.85em;
}

.markdown-body :deep(pre) {
  background: #f6f8fa;
  padding: 16px;
  border-radius: 6px;
  overflow-x: auto;
  margin: 1em 0;
}

.markdown-body :deep(pre code) {
  background: none;
  padding: 0;
  font-family: ui-monospace, SFMono-Regular, SF Mono, Menlo, Consolas, Liberation Mono, monospace;
  font-size: 0.9em;
  line-height: 1.5;
  white-space: pre;
}

.markdown-body :deep(a) {
  color: #0366d6;
  text-decoration: none;
}

.markdown-body :deep(a:hover) {
  text-decoration: underline;
}

.markdown-body :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 4px;
}

.markdown-body :deep(ul), .markdown-body :deep(ol) {
  padding-left: 2em;
  margin: 0.5em 0;
}

.markdown-body :deep(li) {
  margin: 0.3em 0;
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
  cursor: zoom-in;
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

/* 高亮代码块的行样式 */
.markdown-body :deep(.hljs) {
  display: block;
  overflow-x: auto;
  padding: 1em;
  color: #24292e;
  background: #f6f8fa;
}

.markdown-body :deep(.hljs-comment),
.markdown-body :deep(.hljs-quote) {
  color: #6a737d;
  font-style: italic;
}

.markdown-body :deep(.hljs-keyword),
.markdown-body :deep(.hljs-selector-tag) {
  color: #d73a49;
}

.markdown-body :deep(.hljs-string),
.markdown-body :deep(.hljs-literal) {
  color: #032f62;
}

.markdown-body :deep(.hljs-number),
.markdown-body :deep(.hljs-variable),
.markdown-body :deep(.hljs-template-variable) {
  color: #005cc5;
}

.markdown-body :deep(.hljs-function) {
  color: #6f42c1;
}
</style> 