import type { Bookmark, BookmarkList, BookmarkPreview } from '../types'
import { apiDelete, apiGet, apiSend } from './client'

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
  return apiDelete(`/bookmarks/${id}`)
}
