import express, { Request, Response } from 'express'
import cors from 'cors'
import sqlite3 from 'sqlite3'
import { open } from 'sqlite'
import path from 'path'
import fs from 'fs'

const app = express()
app.use(cors())
app.use(express.json())

// 类型定义
interface Memo {
  id: string
  content: string
  created_at: string
  updated_at: string
  user_id: string
  visibility: string
}

// 确保数据库目录存在
const dbDir = path.join(__dirname, '../db')
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true })
}

// 初始化数据库
const dbPath = path.join(dbDir, 'database.sqlite')
console.log('Database path:', dbPath)

async function initializeDatabase() {
  const db = await open({
    filename: dbPath,
    driver: sqlite3.Database
  })

  // 创建表
  await db.exec(`
    CREATE TABLE IF NOT EXISTS memos (
      id TEXT PRIMARY KEY,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      user_id TEXT NOT NULL,
      visibility TEXT NOT NULL
    )
  `)

  // 检查是否需要插入测试数据
  const count = await db.get('SELECT COUNT(*) as count FROM memos')
  if (count.count === 0) {
    const testMemo: Memo = {
      id: Date.now().toString(),
      content: '这是一条测试内容',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: '1',
      visibility: 'PUBLIC'
    }

    await db.run(
      'INSERT INTO memos (id, content, created_at, updated_at, user_id, visibility) VALUES (?, ?, ?, ?, ?, ?)',
      [testMemo.id, testMemo.content, testMemo.created_at, testMemo.updated_at, testMemo.user_id, testMemo.visibility]
    )

    console.log('Test data initialized')
  }

  return db
}

let db: Awaited<ReturnType<typeof initializeDatabase>>

// API 路由
app.get('/api/memos', async (req: Request, res: Response) => {
  try {
    const memos = await db.all('SELECT * FROM memos ORDER BY created_at DESC')
    console.log('Fetched memos:', memos)
    res.json(memos)
  } catch (error) {
    console.error('Error fetching memos:', error)
    res.status(500).json({ error: 'Failed to fetch memos' })
  }
})

app.post('/api/memos', async (req: Request, res: Response) => {
  try {
    const { content } = req.body
    const memo: Memo = {
      id: Date.now().toString(),
      content,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      user_id: '1',
      visibility: 'PUBLIC'
    }

    await db.run(
      'INSERT INTO memos (id, content, created_at, updated_at, user_id, visibility) VALUES (?, ?, ?, ?, ?, ?)',
      [memo.id, memo.content, memo.created_at, memo.updated_at, memo.user_id, memo.visibility]
    )

    console.log('Created memo:', memo)
    res.json(memo)
  } catch (error) {
    console.error('Error creating memo:', error)
    res.status(500).json({ error: 'Failed to create memo' })
  }
})

// 启动服务器
const PORT = 3000

initializeDatabase()
  .then((database) => {
    db = database
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`)
    })
  })
  .catch((error) => {
    console.error('Failed to initialize database:', error)
    process.exit(1)
  })

// 优雅退出
process.on('SIGINT', async () => {
  try {
    await db.close()
    console.log('Database connection closed')
    process.exit(0)
  } catch (error) {
    console.error('Error closing database:', error)
    process.exit(1)
  }
}) 