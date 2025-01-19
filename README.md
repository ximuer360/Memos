# Memo 灵感系统

一个简洁的个人灵感系统，支持 Markdown 格式、图片上传、贡献度统计等功能。

## 项目结构

memobbs/
├── src/
│ ├── api/ # API 接口
│ ├── components/ # 组件
│ ├── stores/ # 状态管理
│ ├── types/ # TypeScript 类型
│ ├── utils/ # 工具函数
│ └── views/ # 页面视图
├── server/
│ ├── src/ # 服务器源码
│ └── uploads/ # 上传文件存储
└── public/ # 静态资源

## 功能特点

### 前台功能
- ✍️ Markdown 编辑器
- 📸 图片上传与预览
- 📅 贡献度日历展示
- 🎨 优雅的界面设计

![前台界面截图](image.png)

### 后台管理
- 🔐 管理员登录认证
- 📝 Memo 内容管理
- 🖼️ 图片资源管理
- 🔍 搜索与排序功能
- 📊 分页显示

![后台管理界面截图](image-1.png)

## 技术栈

### 前端
- Vue 3
- TypeScript
- Vue Router
- Markdown 渲染
- 自定义组件

### 后端
- Node.js
- Express
- MongoDB
- JWT 认证
- Multer 文件上传

## 项目结构 

## 主要功能说明

### 1. Memo 发布
- 支持 Markdown 格式
- 支持图片上传
- 实时预览
- 自动保存

### 2. 贡献度日历
- 按日期统计记录数
- 可视化展示
- 支持日期筛选

### 3. 后台管理
- 内容管理
  - 编辑
  - 删除
  - 预览
- 资源管理
  - 图片预览
  - 资源删除
- 数据筛选
  - 搜索功能
  - 排序功能
  - 分页展示

## 安装部署

1. 克隆项目 
    git clone https://github.com/your-repo/memobbs.git
2. 安装依赖
    cd memobbs
    npm install
3. 配置环境变量 
    cp .env.example .env
4. 启动前端和后端
    npm run dev/cd server && npm run server
5. 访问 http://localhost:3000 接口即可使用
6. 访问 http://localhost:5174/ 前台展示即可使用
7. 访问 http://localhost:5174/admin 后台管理即可使用

## API 文档

### 前台 API
- `GET /api/memos` - 获取所有记录
- `POST /api/memos` - 创建新记录
- `POST /api/resources` - 上传资源文件
- `GET /api/memos/stats/:year/:month` - 获取月度统计

### 后台 API
- `POST /api/auth/login` - 管理员登录
- `PUT /api/memos/:id` - 更新记录
- `DELETE /api/memos/:id` - 删除记录

## 开发计划

- [ ] 标签管理功能
- [ ] 评论系统
- [ ] 用户系统
- [ ] 数据导入/导出
- [ ] 更多主题样式
- [ ] 移动端适配优化

## 贡献指南

欢迎提交 Issue 和 Pull Request 来帮助改进项目。

## 许可证

[MIT License](LICENSE)
