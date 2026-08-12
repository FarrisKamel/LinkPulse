// Mirrors the backend response schemas (app/schemas.py).

export interface Tag {
  id: string
  name: string
  color: string
}

export interface TagWithCount extends Tag {
  bookmark_count: number
}

export interface Bookmark {
  id: string
  url: string
  title: string | null
  description: string | null
  favicon_url: string | null
  og_image_url: string | null
  domain: string | null
  notes: string | null
  is_starred: boolean
  is_deleted: boolean
  created_at: string
  updated_at: string
  tags: Tag[]
}

export interface BookmarkList {
  items: Bookmark[]
  total: number
  limit: number
  offset: number
}

export interface BookmarkPreview {
  url: string
  domain: string | null
  title: string | null
  description: string | null
  og_image_url: string | null
  favicon_url: string | null
}
