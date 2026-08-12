import type { Bookmark, BookmarkList, BookmarkPreview } from '../types'

// Relative path — Vite proxies /api to the backend (see vite.config.ts).
const API_BASE = '/api'

async function apiGet<T>(path: string): Promise<T> {
  const resp = await fetch(`${API_BASE}${path}`)
  if (!resp.ok) {
    throw new Error(`Request failed with status ${resp.status}`)
  }
  return resp.json() as Promise<T>
}

async function apiSend<T>(
  method: string,
  path: string,
  body?: unknown,
): Promise<T> {
  const resp = await fetch(`${API_BASE}${path}`, {
    method,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  })
  if (!resp.ok) {
    // Surface the backend's error detail (e.g. the 409 duplicate message).
    let detail = `Request failed with status ${resp.status}`
    try {
      const data = (await resp.json()) as { detail?: string }
      if (data.detail) detail = data.detail
    } catch {
      // non-JSON error body — keep the generic message
    }
    throw new Error(detail)
  }
  return resp.json() as Promise<T>
}

export interface BookmarkListParams {
  limit?: number
  offset?: number
  search?: string
  tag?: string
  starred?: boolean
}

export async function fetchBookmarks(
  params: BookmarkListParams = {},
): Promise<BookmarkList> {
  const search = new URLSearchParams()
  if (params.limit != null) search.set('limit', String(params.limit))
  if (params.offset != null) search.set('offset', String(params.offset))
  if (params.search) search.set('search', params.search)
  if (params.tag) search.set('tag', params.tag)
  if (params.starred) search.set('starred', 'true')
  const qs = search.toString()
  return apiGet<BookmarkList>(`/bookmarks${qs ? `?${qs}` : ''}`)
}

export async function previewBookmark(url: string): Promise<BookmarkPreview> {
  return apiSend<BookmarkPreview>('POST', '/bookmarks/preview', { url })
}

export interface CreateBookmarkInput {
  url: string
  tags: string[]
}

export async function createBookmark(
  input: CreateBookmarkInput,
): Promise<Bookmark> {
  return apiSend<Bookmark>('POST', '/bookmarks', input)
}

export interface UpdateBookmarkInput {
  notes?: string | null
  is_starred?: boolean
  tags?: string[]
}

export async function updateBookmark(
  id: string,
  patch: UpdateBookmarkInput,
): Promise<Bookmark> {
  return apiSend<Bookmark>('PATCH', `/bookmarks/${id}`, patch)
}

export async function deleteBookmark(id: string): Promise<void> {
  const resp = await fetch(`${API_BASE}/bookmarks/${id}`, { method: 'DELETE' })
  if (!resp.ok) {
    throw new Error(`Delete failed with status ${resp.status}`)
  }
}
