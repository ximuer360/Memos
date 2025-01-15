import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import multer from 'multer'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import { marked } from 'marked'
import highlight from 'highlight.js'
import sanitizeHtml from 'sanitize-html'
import dotenv from 'dotenv'
import { Memo } from './models/memo.js'

dotenv.config()

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()

// 配置 Markdown 渲染
marked.setOptions({
  highlight: (code, lang) => {
    if (lang && highlight.getLanguage(lang)) {
      return highlight.highlight(code, { language: lang }).value
    }
    return highlight.highlightAuto(code).value
  },
  breaks: true
})

// 连接 MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/memobbs', {
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
.then(() => {
  console.log('MongoDB connected successfully')
})
.catch(err => {
  console.error('MongoDB connection error:', err)
  process.exit(1)
})

// 监听连接错误
mongoose.connection.on('error', err => {
  console.error('MongoDB connection error:', err)
})

// 配置文件上传
const uploadDir = join(__dirname, '..', 'uploads')
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true })
}

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}-${file.originalname}`
    cb(null, uniqueName)
  }
})

const upload = multer({ storage })

app.use(cors({
  origin: 'http://localhost:5174',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
  credentials: true
}))
app.use(express.json())
app.use('/uploads', express.static(uploadDir))

// 处理 Markdown 内容
function processContent(rawContent) {
  const html = marked(rawContent)
  const sanitized = sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ['src', 'alt']
    }
  })
  return {
    raw: rawContent,
    html: sanitized,
    text: sanitizeHtml(html, { allowedTags: [] })
  }
}

// API 路由
app.get('/api/memos', async (req, res) => {
  try {
    const memos = await Memo.find()
      .sort({ createdAt: -1 })
      .exec()
    res.json(memos)
  } catch (error) {
    console.error('Error fetching memos:', error)
    res.status(500).json({ error: 'Failed to fetch memos' })
  }
})

app.post('/api/memos', async (req, res) => {
  try {
    const { content, resources = [] } = req.body
    console.log('Creating memo with content:', content)
    console.log('Resources:', resources)

    if (!content || typeof content !== 'string') {
      return res.status(400).json({ error: 'Content is required and must be a string' })
    }

    const processedContent = processContent(content)
    
    const memo = new Memo({
      content: processedContent,
      userId: '1',
      visibility: 'PUBLIC',
      resources: resources.map(resource => ({
        type: resource.type,
        name: resource.name,
        url: resource.url,
        size: resource.size
      })),
      tags: []
    })
    
    const savedMemo = await memo.save()
    console.log('Created memo:', savedMemo)
    res.json(savedMemo)
  } catch (error) {
    console.error('Error creating memo:', error)
    res.status(500).json({ 
      error: 'Failed to create memo',
      details: error.message 
    })
  }
})

// 文件上传
app.post('/api/resources', upload.single('file'), async (req, res) => {
  try {
    const file = req.file
    if (!file) {
      return res.status(400).json({ error: 'No file uploaded' })
    }

    // 使用完整的 URL
    const fileUrl = `http://localhost:3000/uploads/${file.filename}`
    
    // 构造响应对象
    const response = {
      url: fileUrl,
      type: file.mimetype,
      name: file.originalname,
      size: file.size
    }

    console.log('File uploaded successfully:', response)
    
    // 设置响应头
    res.setHeader('Content-Type', 'application/json')
    res.status(200).json(response)
  } catch (error) {
    console.error('Error uploading file:', error)
    res.status(500).json({ 
      error: 'Failed to upload file',
      details: error.message 
    })
  }
})

// 添加错误处理中间件
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({ 
    error: 'Internal Server Error',
    details: err.message
  })
})

const PORT = 3000
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
}) 