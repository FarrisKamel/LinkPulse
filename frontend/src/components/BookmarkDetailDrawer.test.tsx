import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'

import type { Bookmark } from '../types'
import BookmarkDetailDrawer from './BookmarkDetailDrawer'

function make(overrides: Partial<Bookmark> = {}): Bookmark {
  return {
    id: '1',
    url: 'https://example.com/',
    title: 'Example',
    description: null,
    favicon_url: null,
    og_image_url: null,
    domain: 'example.com',
    notes: null,
    is_starred: false,
    is_deleted: false,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    tags: [],
    ...overrides,
  }
}

function renderDrawer(bookmark: Bookmark) {
  const client = new QueryClient()
  const onClose = vi.fn()
  render(
    <QueryClientProvider client={client}>
      <BookmarkDetailDrawer bookmark={bookmark} onClose={onClose} />
    </QueryClientProvider>,
  )
  return { onClose }
}

test('shows existing notes and tags', () => {
  renderDrawer(
    make({ notes: 'read later', tags: [{ id: 't', name: 'react', color: '#000' }] }),
  )
  expect(screen.getByDisplayValue('read later')).toBeTruthy()
  expect(screen.getByText('react')).toBeTruthy()
})

test('delete asks for confirmation first', () => {
  renderDrawer(make())
  expect(screen.queryByText(/delete this bookmark\?/i)).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'Delete bookmark' }))
  expect(screen.getByText(/delete this bookmark\?/i)).toBeTruthy()
})

test('escape closes the drawer', () => {
  const { onClose } = renderDrawer(make())
  fireEvent.keyDown(window, { key: 'Escape' })
  expect(onClose).toHaveBeenCalled()
})
