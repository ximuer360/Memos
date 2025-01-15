import mongoose from 'mongoose'

const resourceSchema = new mongoose.Schema({
  type: String,
  name: String,
  url: String,
  size: Number,
  createdAt: { type: Date, default: Date.now }
})

const memoSchema = new mongoose.Schema({
  content: {
    raw: String,      // 原始 Markdown
    html: String,     // 渲染后的 HTML
    text: String      // 纯文本（用于搜索）
  },
  resources: [resourceSchema],
  tags: [String],
  visibility: {
    type: String,
    enum: ['PUBLIC', 'PRIVATE'],
    default: 'PUBLIC'
  },
  userId: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
})

// 添加全文搜索索引
memoSchema.index({ 'content.text': 'text' })

export const Memo = mongoose.model('Memo', memoSchema) 