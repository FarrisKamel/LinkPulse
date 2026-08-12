import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { afterEach, expect, test, vi } from 'vitest'

import type { Bookmark } from '../types'
import BookmarksPage from './BookmarksPage'

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <BookmarksPage />
      </MemoryRouter>
    </QueryClientProvider>,
  )
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status })
}

const SAMPLE: Bookmark = {
  id: '1',
  url: 'https://example.com/',
  title: 'Example Site',
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
}

afterEach(() => {
  vi.restoreAllMocks()
})

test('shows loading skeletons while the request is in flight', () => {
  vi.stubGlobal('fetch', vi.fn(() => new Promise<Response>(() => {})))
  renderPage()
  expect(screen.getByTestId('bookmarks-loading')).toBeTruthy()
})

test('shows the empty state when there are no bookmarks', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () =>
      jsonResponse({ items: [], total: 0, limit: 20, offset: 0 }),
    ),
  )
  renderPage()
  expect(await screen.findByText(/no bookmarks yet/i)).toBeTruthy()
})

test('renders a card for each bookmark', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () =>
      jsonResponse({ items: [SAMPLE], total: 1, limit: 20, offset: 0 }),
    ),
  )
  renderPage()
  expect(await screen.findByText('Example Site')).toBeTruthy()
})

test('shows the error state when the request fails', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => jsonResponse({}, 500)))
  renderPage()
  expect(await screen.findByText(/couldn't load bookmarks/i)).toBeTruthy()
})

test('shows pagination controls when there is more than one page', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () =>
      jsonResponse({ items: [SAMPLE], total: 25, limit: 20, offset: 0 }),
    ),
  )
  renderPage()
  expect(await screen.findByRole('button', { name: 'Next' })).toBeTruthy()
  expect(screen.getByRole('button', { name: 'Previous' })).toBeTruthy()
})
