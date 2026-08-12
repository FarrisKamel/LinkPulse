import type { BookmarkList } from '../types'

// Relative path — Vite proxies /api to the backend (see vite.config.ts).
const API_BASE = '/api'

async function apiGet<T>(path: string): Promise<T> {
  const resp = await fetch(`${API_BASE}${path}`)
  if (!resp.ok) {
    throw new Error(`Request failed with status ${resp.status}`)
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
