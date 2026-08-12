import type { Tag, TagWithCount } from '../types'
import { apiDelete, apiGet, apiSend } from './client'

export async function fetchTags(): Promise<TagWithCount[]> {
  return apiGet<TagWithCount[]>('/tags')
}

export async function createTag(input: {
  name: string
  color: string
}): Promise<Tag> {
  return apiSend<Tag>('POST', '/tags', input)
}

export async function updateTag(
  id: string,
  patch: { name?: string; color?: string },
): Promise<Tag> {
  return apiSend<Tag>('PATCH', `/tags/${id}`, patch)
}

export async function deleteTag(id: string): Promise<void> {
  return apiDelete(`/tags/${id}`)
}
