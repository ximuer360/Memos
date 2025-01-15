import express from 'express'
import cors from 'cors'
import mysql from 'mysql2/promise'
import multer from 'multer'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'
import { v4 as uuidv4 } from 'uuid'
import LinkifyIt from 'linkify-it'
import dotenv from 'dotenv'

dotenv.config()

const __dirname = dirname(fileURLToPath(import.meta.url))
const app = express()
const linkify = new LinkifyIt()

// 数据库连接
const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  port: 3306,
  host: 'localhost'
})

// 添加连接测试
pool.getConnection()
  .then(connection => {
    console.log('Database connected successfully')
    connection.release()
  })
  .catch(err => {
    console.error('Error connecting to the database:', err)
    process.exit(1)
  })

// 配置文件上传
const uploadDir = join(__dirname, '..', process.env.UPLOAD_DIR)
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

app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(uploadDir))

// 处理内容中的链接
function processContent(content) {
  const matches = linkify.match(content)
  if (!matches) return content

  let lastIndex = 0
  let result = ''
  
  matches.forEach(match => {
    result += content.slice(lastIndex, match.index)
    result += `<a href="${match.url}" target="_blank" rel="noopener noreferrer">${match.text}</a>`
    lastIndex = match.lastIndex
  })
  
  result += content.slice(lastIndex)
  return result
}

// API 路由
app.get('/api/memos', async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT m.*, GROUP_CONCAT(r.url) as resources
      FROM memos m
      LEFT JOIN resources r ON m.id = r.memo_id
      GROUP BY m.id
      ORDER BY m.created_at DESC
    `)
    
    const memos = rows.map(row => ({
      ...row,
      content: processContent(row.content),
      resources: row.resources ? row.resources.split(',') : []
    }))
    
    res.json(memos)
  } catch (error) {
    console.error('Error fetching memos:', error)
    res.status(500).json({ error: 'Failed to fetch memos' })
  }
})

app.post('/api/memos', async (req, res) => {
  try {
    const { content } = req.body
    const id = uuidv4()
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
    
    const processedContent = processContent(content)
    
    await pool.query(
      'INSERT INTO memos (id, content, created_at, updated_at, user_id, visibility) VALUES (?, ?, ?, ?, ?, ?)',
      [id, processedContent, now, now, '1', 'PUBLIC']
    )
    
    const [rows] = await pool.query('SELECT * FROM memos WHERE id = ?', [id])
    res.json(rows[0])
  } catch (error) {
    console.error('Error creating memo:', error)
    res.status(500).json({ error: 'Failed to create memo' })
  }
})

// 文件上传
app.post('/api/resources', upload.single('file'), async (req, res) => {
  try {
    const { memoId } = req.body
    const file = req.file
    const id = uuidv4()
    const now = new Date().toISOString().slice(0, 19).replace('T', ' ')
    
    const fileUrl = `/uploads/${file.filename}`
    
    await pool.query(
      'INSERT INTO resources (id, memo_id, type, name, size, url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, memoId, file.mimetype, file.originalname, file.size, fileUrl, now]
    )
    
    res.json({
      id,
      url: fileUrl,
      type: file.mimetype,
      name: file.originalname,
      size: file.size
    })
  } catch (error) {
    console.error('Error uploading file:', error)
    res.status(500).json({ error: 'Failed to upload file' })
  }
})

const PORT = 3000
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
}) 