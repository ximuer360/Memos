export interface Resource {
  type: string
  name: string
  url: string
  size: number
  createdAt: string
}

export interface MemoContent {
  raw: string
  html: string
  text: string
}

export interface Memo {
  _id: string
  content: MemoContent
  resources: Resource[]
  tags: string[]
  visibility: 'PUBLIC' | 'PRIVATE'
  userId: string
  createdAt: string
  updatedAt: string
} 