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

async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const resp = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
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
}

export async function fetchBookmarks(
  params: BookmarkListParams = {},
): Promise<BookmarkList> {
  const search = new URLSearchParams()
  if (params.limit != null) search.set('limit', String(params.limit))
  if (params.offset != null) search.set('offset', String(params.offset))
  const qs = search.toString()
  return apiGet<BookmarkList>(`/bookmarks${qs ? `?${qs}` : ''}`)
}

export async function previewBookmark(url: string): Promise<BookmarkPreview> {
  return apiPost<BookmarkPreview>('/bookmarks/preview', { url })
}

export interface CreateBookmarkInput {
  url: string
  tags: string[]
}

export async function createBookmark(
  input: CreateBookmarkInput,
): Promise<Bookmark> {
  return apiPost<Bookmark>('/bookmarks', input)
}
