<template>
  <div class="memo-editor">
    <div class="editor-content">
      <textarea
        v-model="content"
        placeholder="写点什么..."
        rows="3"
        :disabled="isSubmitting"
        @paste="handlePaste"
      ></textarea>
      <div class="editor-toolbar">
        <input
          type="file"
          ref="fileInput"
          @change="handleFileChange"
          accept="image/*"
          class="hidden"
          multiple
        >
        <button class="toolbar-btn" @click="triggerFileInput">
          <i class="fas fa-image"></i>
        </button>
      </div>
    </div>
    <div class="preview" v-if="uploadedFiles.length">
      <div v-for="file in uploadedFiles" :key="file.url" class="preview-item">
        <img :src="file.url" :alt="file.name">
        <button class="remove-btn" @click="removeFile(file)">×</button>
      </div>
    </div>
    <div class="actions">
      <div v-if="error" class="error">{{ error }}</div>
      <button 
        @click="handleSubmit" 
        :disabled="isSubmitting || !content.trim()"
        class="submit-btn"
      >
        {{ isSubmitting ? '发布中...' : '发布' }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const content = ref('')
const error = ref('')
const isSubmitting = ref(false)
const fileInput = ref<HTMLInputElement | null>(null)
const uploadedFiles = ref<Array<{ url: string, name: string }>>([])

const emit = defineEmits<{
  (e: 'create', content: string, files: Array<{ url: string, name: string }>): void
}>()

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileChange = async (event: Event) => {
  const input = event.target as HTMLInputElement
  if (!input.files?.length) return

  for (const file of Array.from(input.files)) {
    try {
      const formData = new FormData()
      formData.append('file', file)
      
      const response = await fetch('http://localhost:3000/api/resources', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) throw new Error('Upload failed')
      
      const data = await response.json()
      uploadedFiles.value.push({
        url: data.url,
        name: data.name
      })
    } catch (e) {
      console.error(e)
      error.value = '图片上传失败'
    }
  }
  
  input.value = ''
}

const removeFile = (file: { url: string, name: string }) => {
  uploadedFiles.value = uploadedFiles.value.filter(f => f.url !== file.url)
}

const handlePaste = async (event: ClipboardEvent) => {
  const items = event.clipboardData?.items
  if (!items) return

  for (const item of Array.from(items)) {
    if (item.type.startsWith('image/')) {
      const file = item.getAsFile()
      if (file) {
        const formData = new FormData()
        formData.append('file', file)
        
        try {
          const response = await fetch('http://localhost:3000/api/resources', {
            method: 'POST',
            body: formData
          })
          
          if (!response.ok) throw new Error('Upload failed')
          
          const data = await response.json()
          uploadedFiles.value.push({
            url: data.url,
            name: data.name
          })
        } catch (e) {
          console.error(e)
          error.value = '图片上传失败'
        }
      }
    }
  }
}

const handleSubmit = async () => {
  if (!content.value.trim()) return
  
  isSubmitting.value = true
  error.value = ''
  
  try {
    await emit('create', content.value, uploadedFiles.value)
    content.value = ''
    uploadedFiles.value = []
  } catch (e) {
    error.value = '发布失败，请重试'
    console.error('Failed to create memo:', e)
  } finally {
    isSubmitting.value = false
  }
}
</script>

<style scoped>
.memo-editor {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.editor-content {
  position: relative;
}

textarea {
  width: 100%;
  border: none;
  resize: none;
  outline: none;
  font-size: 16px;
  min-height: 100px;
}

.editor-toolbar {
  border-top: 1px solid #eee;
  padding-top: 8px;
  display: flex;
  gap: 8px;
}

.toolbar-btn {
  background: none;
  border: none;
  padding: 4px 8px;
  cursor: pointer;
  color: #666;
}

.toolbar-btn:hover {
  color: #007bff;
}

.hidden {
  display: none;
}

.preview {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.preview-item {
  position: relative;
  width: 100px;
  height: 100px;
}

.preview-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
}

.remove-btn {
  position: absolute;
  top: -8px;
  right: -8px;
  background: rgba(0,0,0,0.5);
  color: white;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 8px;
}

.error {
  color: #dc3545;
  font-size: 14px;
}

.submit-btn {
  background: #007bff;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.submit-btn:disabled {
  background: #ccc;
  cursor: not-allowed;
}
</style> 