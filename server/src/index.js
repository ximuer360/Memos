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
import { networkInterfaces } from 'os'

dotenv.config()

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()

// 配置 Markdown 渲染
marked.setOptions({
  highlight: (code, language) => {
    if (language && highlight.getLanguage(language)) {
      return highlight.highlight(code, {
        language: language,
        ignoreIllegals: true
      }).value
    }
    return highlight.highlightAuto(code).value
  },
  langPrefix: 'hljs language-',
  breaks: true,
  gfm: true,
  headerIds: true,
  mangle: false
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
  origin: '*',
  //origin: ['http://localhost:5174','http://192.168.101.6:5174','http://192.168.101.7:5174'],
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
    allowedTags: [
      ...sanitizeHtml.defaults.allowedTags,
      'img',
      'h1',
      'h2',
      'h3',
      'h4',
      'h5',
      'h6',
      'pre',
      'code',
      'span'
    ],
    allowedAttributes: {
      ...sanitizeHtml.defaults.allowedAttributes,
      img: ['src', 'alt'],
      code: ['class'],
      pre: ['class'],
      span: ['class']
    },
    allowedClasses: {
      code: ['*'],
      pre: ['*'],
      span: ['*']
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
    
    // 修改资源 URL
    const serverUrl = process.env.SERVER_URL || `http://${getLocalIP()}:3000`
    const processedResources = resources.map(resource => {
      // 如果 URL 包含 localhost，替换为服务器 URL
      const url = resource.url.replace('http://localhost:3000', serverUrl)
      return {
        type: resource.type,
        name: resource.name,
        url: url,
        size: resource.size
      }
    })
    
    const memo = new Memo({
      content: processedContent,
      userId: '1',
      visibility: 'PUBLIC',
      resources: processedResources,
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

    // 使用环境变量中的服务器 URL
    const serverUrl = process.env.SERVER_URL || `http://${getLocalIP()}:3000`
    const fileUrl = `${serverUrl}/uploads/${file.filename}`
    
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

// 获取本机 IP 地址
const getLocalIP = () => {
  const nets = networkInterfaces()
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      // 跳过内部 IP 和非 IPv4 地址
      if (net.family === 'IPv4' && !net.internal) {
        return net.address
      }
    }
  }
  return 'localhost'
}

// 在服务器启动时
const IP = getLocalIP()
const PORT = 3000
process.env.SERVER_URL = process.env.SERVER_URL || `http://${IP}:${PORT}`

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on:`)
  console.log(`- Local: http://localhost:${PORT}`)
  console.log(`- Network: ${process.env.SERVER_URL}`)
}) 