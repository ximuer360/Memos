<template>
  <div class="admin">
    <div class="admin-header">
      <h1>Memo 管理</h1>
      <div class="filters">
        <input 
          type="text" 
          v-model="searchText" 
          placeholder="搜索内容..." 
          @input="handleSearch"
        >
        <select v-model="sortBy" @change="handleSort">
          <option value="createdAt-desc">最新创建</option>
          <option value="createdAt-asc">最早创建</option>
          <option value="updatedAt-desc">最近更新</option>
          <option value="updatedAt-asc">最早更新</option>
        </select>
      </div>
    </div>

    <div class="admin-content">
      <div v-if="loading" class="loading">加载中...</div>
      <div v-else-if="error" class="error">{{ error }}</div>
      <table v-else class="memo-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>内容预览</th>
            <th>资源数</th>
            <th>创建时间</th>
            <th>更新时间</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="memo in paginatedMemos" :key="memo._id">
            <td>{{ memo._id.slice(-6) }}</td>
            <td>
              <div class="content-preview" @click="showFullContent(memo)">
                {{ getContentPreview(memo.content.text) }}
              </div>
            </td>
            <td>{{ memo.resources.length }}</td>
            <td>{{ formatDate(memo.createdAt) }}</td>
            <td>{{ formatDate(memo.updatedAt) }}</td>
            <td>
              <button class="edit-btn" @click="editMemo(memo)">编辑</button>
              <button class="delete-btn" @click="deleteMemo(memo._id)">删除</button>
            </td>
          </tr>
        </tbody>
      </table>

      <div class="pagination">
        <button 
          :disabled="currentPage === 1" 
          @click="changePage(currentPage - 1)"
        >
          上一页
        </button>
        <span>{{ currentPage }} / {{ totalPages }}</span>
        <button 
          :disabled="currentPage === totalPages" 
          @click="changePage(currentPage + 1)"
        >
          下一页
        </button>
      </div>
    </div>

    <!-- 全文内容弹窗 -->
    <div v-if="selectedMemo" class="modal" @click="selectedMemo = null">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Memo 详情</h3>
          <button @click="selectedMemo = null">×</button>
        </div>
        <div class="modal-body">
          <div class="memo-content markdown-body" v-html="selectedMemo.content.html" @click="handleImageClick"></div>
          <div v-if="selectedMemo.resources.length" class="resources">
            <h4>附件资源：</h4>
            <div class="resource-list">
              <div v-for="resource in selectedMemo.resources" :key="resource.url" class="resource-item">
                <img 
                  v-if="resource.type.startsWith('image/')" 
                  :src="resource.url" 
                  :alt="resource.name"
                  @click="previewImage(resource.url)"
                >
                <a v-else :href="resource.url" target="_blank">{{ resource.name }}</a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 图片预览弹窗 -->
    <div v-if="previewImageUrl" class="modal image-preview" @click="previewImageUrl = null">
      <img :src="previewImageUrl" @click.stop>
    </div>

    <!-- 编辑弹窗 -->
    <div v-if="editingMemo" class="modal" @click="cancelEdit">
      <div class="modal-content edit-modal" @click.stop>
        <div class="modal-header">
          <h3>编辑 Memory</h3>
          <button @click="cancelEdit">×</button>
        </div>
        <div class="modal-body">
          <textarea 
            v-model="editingMemo.content.raw"
            rows="10"
            placeholder="编辑内容..."
          ></textarea>
          <div class="resources-edit" v-if="editingMemo.resources.length">
            <h4>附件资源：</h4>
            <div class="resource-list">
              <div v-for="(resource, index) in editingMemo.resources" :key="resource.url" class="resource-item">
                <img v-if="resource.type.startsWith('image/')" :src="resource.url" :alt="resource.name">
                <a v-else :href="resource.url" target="_blank">{{ resource.name }}</a>
                <button class="remove-resource" @click="removeResource(index)">×</button>
              </div>
            </div>
          </div>
          <div class="edit-actions">
            <button class="btn-primary" @click="saveEdit" :disabled="saving">
              {{ saving ? '保存中...' : '保存' }}
            </button>
            <button class="btn-secondary" @click="cancelEdit">取消</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Memo } from '../types/memo'
import { formatDate } from '../utils/date'
import { useMemoStore } from '../stores/memos'

const memoStore = useMemoStore()
const searchText = ref('')
const sortBy = ref('createdAt-desc')
const currentPage = ref(1)
const pageSize = 15
const selectedMemo = ref<Memo | null>(null)
const previewImageUrl = ref<string | null>(null)
const editingMemo = ref<Memo | null>(null)
const saving = ref(false)

const { loading, error } = memoStore

// 获取筛选和排序后的数据
const filteredMemos = computed(() => {
  let result = [...memoStore.memos.value]
  
  // 搜索过滤
  if (searchText.value) {
    const searchLower = searchText.value.toLowerCase()
    result = result.filter(memo => 
      memo.content.text.toLowerCase().includes(searchLower)
    )
  }
  
  // 排序
  const [field, order] = sortBy.value.split('-')
  result.sort((a, b) => {
    const aValue = a[field as keyof typeof a]
    const bValue = b[field as keyof typeof b]
    return order === 'desc' ? 
      (bValue > aValue ? 1 : -1) : 
      (aValue > bValue ? 1 : -1)
  })
  
  return result
})

// 分页数据
const paginatedMemos = computed(() => {
  const start = (currentPage.value - 1) * pageSize
  return filteredMemos.value.slice(start, start + pageSize)
})

// 总页数
const totalPages = computed(() => 
  Math.ceil(filteredMemos.value.length / pageSize)
)

// 内容预览
const getContentPreview = (text: string) => {
  return text.length > 50 ? text.slice(0, 50) + '...' : text
}

// 事件处理
const handleSearch = () => {
  currentPage.value = 1
}

const handleSort = () => {
  currentPage.value = 1
}

const changePage = (page: number) => {
  currentPage.value = page
}

const showFullContent = (memo: Memo) => {
  selectedMemo.value = memo
}

const editMemo = (memo: Memo) => {
  editingMemo.value = JSON.parse(JSON.stringify(memo)) // 深拷贝
}

const deleteMemo = async (id: string) => {
  if (!confirm('确定要删除这条记录吗？')) return
  try {
    await memoStore.deleteMemo(id)
  } catch (e) {
    console.error('Delete failed:', e)
  }
}

// 处理图片点击
const handleImageClick = (e: MouseEvent) => {
  const target = e.target as HTMLElement
  if (target.tagName === 'IMG') {
    previewImage((target as HTMLImageElement).src)
  }
}

// 预览图片
const previewImage = (url: string) => {
  previewImageUrl.value = url
}

// 取消编辑
const cancelEdit = () => {
  editingMemo.value = null
}

// 移除资源
const removeResource = (index: number) => {
  if (editingMemo.value) {
    editingMemo.value.resources.splice(index, 1)
  }
}

// 保存编辑
const saveEdit = async () => {
  if (!editingMemo.value) return
  
  saving.value = true
  try {
    await memoStore.updateMemo(
      editingMemo.value._id,
      editingMemo.value.content.raw,
      editingMemo.value.resources
    )
    editingMemo.value = null
  } catch (e) {
    console.error('Failed to save memo:', e)
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.admin {
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
}

.admin-header {
  margin-bottom: 20px;
}

.filters {
  display: flex;
  gap: 10px;
  margin-top: 10px;
}

.filters input,
.filters select {
  padding: 8px;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.filters input {
  flex: 1;
}

.memo-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 20px;
}

.memo-table th,
.memo-table td {
  padding: 12px;
  text-align: left;
  border-bottom: 1px solid #eee;
}

.memo-table th {
  background: #f5f5f5;
  font-weight: 600;
}

.content-preview {
  cursor: pointer;
  color: #1890ff;
}

.content-preview:hover {
  text-decoration: underline;
}

.edit-btn,
.delete-btn {
  padding: 4px 8px;
  margin: 0 4px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.edit-btn {
  background: #1890ff;
  color: white;
}

.delete-btn {
  background: #ff4d4f;
  color: white;
}

.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 10px;
}

.pagination button {
  padding: 4px 12px;
  border: 1px solid #ddd;
  background: white;
  border-radius: 4px;
  cursor: pointer;
}

.pagination button:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

/* 弹窗样式 */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 8px;
  width: 90%;
  max-width: 800px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  padding: 16px;
  border-bottom: 1px solid #eee;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header button {
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
}

.modal-body {
  padding: 16px;
}

.resources {
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid #eee;
}

.resource-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 10px;
  margin-top: 10px;
}

.resource-item img {
  width: 100%;
  height: 150px;
  object-fit: cover;
  border-radius: 4px;
}

.resource-item a {
  display: block;
  padding: 8px;
  background: #f5f5f5;
  border-radius: 4px;
  text-decoration: none;
  color: #1890ff;
}

.image-preview {
  background: rgba(0, 0, 0, 0.9);
}

.image-preview img {
  max-width: 90%;
  max-height: 90vh;
  object-fit: contain;
}

.memo-content img {
  cursor: zoom-in;
  max-width: 100%;
  transition: transform 0.3s;
}

.memo-content img:hover {
  transform: scale(1.02);
}

.edit-modal {
  max-width: 800px;
  width: 90%;
}

textarea {
  width: 100%;
  min-height: 200px;
  padding: 12px;
  border: 1px solid var(--border-color);
  border-radius: 4px;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.6;
  resize: vertical;
}

.edit-actions {
  display: flex;
  gap: 12px;
  margin-top: 16px;
}

.btn-secondary {
  background: #fff;
  border: 1px solid var(--border-color);
  color: var(--text-color);
}

.remove-resource {
  position: absolute;
  top: 4px;
  right: 4px;
  background: rgba(255, 77, 79, 0.8);
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
</style> 