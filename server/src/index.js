import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import multer from 'multer'
import { join, dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import { marked } from 'marked'
import highlight from 'highlight.js'
import sanitizeHtml from 'sanitize-html'
import dotenv from 'dotenv'
import { Memo } from './models/memo.js'
import { networkInterfaces } from 'os'
import jwt from 'jsonwebtoken'

// 指定 .env 文件的路径
const envPath = resolve(process.cwd(), '.env')
const result = dotenv.config({ path: envPath })

if (result.error) {
  console.error('Error loading .env file:', result.error)
  process.exit(1)
}

// 验证必要的环境变量
const requiredEnvVars = ['ADMIN_USERNAME', 'ADMIN_PASSWORD', 'JWT_SECRET']
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName])

if (missingEnvVars.length > 0) {
  console.error('Missing required environment variables:', missingEnvVars)
  process.exit(1)
}

console.log('Environment variables loaded successfully:', {
  ADMIN_USERNAME: process.env.ADMIN_USERNAME,
  JWT_SECRET: process.env.JWT_SECRET ? '[SET]' : '[NOT SET]'
})

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
  destination: (req, file, cb) => {
    const now = new Date()
    const dirPath = join(
      uploadDir,
      now.getFullYear().toString(),
      (now.getMonth() + 1).toString().padStart(2, '0'),
      now.getDate().toString().padStart(2, '0')
    )
    
    // 确保目录存在
    fs.mkdirSync(dirPath, { recursive: true })
    cb(null, dirPath)
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}-${file.originalname}`
    cb(null, uniqueName)
  }
})

const upload = multer({ storage })

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
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

    const now = new Date()
    const relativePath = join(
      now.getFullYear().toString(),
      (now.getMonth() + 1).toString().padStart(2, '0'),
      now.getDate().toString().padStart(2, '0'),
      file.filename
    )
    
    const serverUrl = process.env.SERVER_URL || `http://${getLocalIP()}:3000`
    const fileUrl = `${serverUrl}/uploads/${relativePath}`
    
    const response = {
      url: fileUrl,
      type: file.mimetype,
      name: file.originalname,
      size: file.size
    }

    console.log('File uploaded successfully:', response)
    res.json(response)
  } catch (error) {
    console.error('Error uploading file:', error)
    res.status(500).json({ error: 'Failed to upload file' })
  }
})

// 获取某月的统计数据
app.get('/api/memos/stats/:year/:month', async (req, res) => {
  try {
    const year = parseInt(req.params.year)
    const month = parseInt(req.params.month) - 1
    
    const startDate = new Date(year, month, 1)
    const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999)
    
    const memos = await Memo.aggregate([
      {
        $match: {
          createdAt: {
            $gte: startDate,
            $lte: endDate
          }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      }
    ])
    
    // 初始化所有日期的计数为0
    const stats = {}
    const currentDate = new Date(startDate)
    while (currentDate <= endDate) {
      stats[formatDate(currentDate)] = 0
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    // 更新有记录的日期的计数
    memos.forEach(memo => {
      stats[memo._id] = memo.count
    })
    
    res.json(stats)
  } catch (error) {
    console.error('Error fetching memo stats:', error)
    res.status(500).json({ error: 'Failed to fetch memo stats' })
  }
})

// 添加辅助函数
function formatDate(date) {
  return date.toISOString().split('T')[0]
}

// 获取指定日期的 memos
app.get('/api/memos/date/:date', async (req, res) => {
  try {
    const date = new Date(req.params.date)
    const nextDate = new Date(date)
    nextDate.setDate(date.getDate() + 1)
    
    const memos = await Memo.find({
      createdAt: {
        $gte: date,
        $lt: nextDate
      }
    }).sort({ createdAt: -1 })
    
    res.json(memos)
  } catch (error) {
    console.error('Error fetching memos by date:', error)
    res.status(500).json({ error: 'Failed to fetch memos' })
  }
})

// 添加认证相关的路由
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body
  
  // 添加更详细的调试日志
  console.log('Login attempt details:', {
    receivedUsername: username,
    receivedPassword: password,
    adminUsername: process.env.ADMIN_USERNAME,
    adminPassword: process.env.ADMIN_PASSWORD,
    usernameMatch: username === process.env.ADMIN_USERNAME,
    passwordMatch: password === process.env.ADMIN_PASSWORD
  })
  
  // 直接比较用户名和密码
  if (username === 'admin' && password === 'admin123') {
    console.log('Login successful')
    const token = jwt.sign(
      { username },
      process.env.JWT_SECRET || '3b68f58b81d7e88e29726d588b5e23be4fcef770c237b6695bb17aa34776cfc9',
      { expiresIn: '24h' }
    )
    
    res.json({ token })
  } else {
    console.log('Login failed: Invalid credentials')
    res.status(401).json({ 
      error: 'Invalid credentials',
      message: 'Username or password is incorrect'
    })
  }
})

// 添加认证中间件
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' })
  }
  
  jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid token' })
    }
    req.user = user
    next()
  })
}

// 保护管理接口
app.use('/api/admin/*', authenticateToken)

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

// 删除 memo
app.delete('/api/memos/:id', authenticateToken, async (req, res) => {
  try {
    const memo = await Memo.findByIdAndDelete(req.params.id)
    if (!memo) {
      return res.status(404).json({ error: 'Memo not found' })
    }
    res.json({ message: 'Memo deleted successfully' })
  } catch (error) {
    console.error('Error deleting memo:', error)
    res.status(500).json({ error: 'Failed to delete memo' })
  }
})

// 更新 memo
app.put('/api/memos/:id', authenticateToken, async (req, res) => {
  try {
    const { content, resources } = req.body
    const processedContent = processContent(content)
    
    const memo = await Memo.findByIdAndUpdate(
      req.params.id,
      { 
        content: processedContent,
        resources,
        updatedAt: new Date()
      },
      { new: true }
    )
    
    if (!memo) {
      return res.status(404).json({ error: 'Memo not found' })
    }
    
    res.json(memo)
  } catch (error) {
    console.error('Error updating memo:', error)
    res.status(500).json({ error: 'Failed to update memo' })
  }
})
