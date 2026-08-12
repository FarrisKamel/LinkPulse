import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'

import TagsPage from './TagsPage'

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <TagsPage />
    </QueryClientProvider>,
  )
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status })
}

afterEach(() => {
  vi.restoreAllMocks()
})

test('lists tags with their bookmark counts', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () =>
      jsonResponse([
        { id: '1', name: 'python', color: '#3572A5', bookmark_count: 3 },
      ]),
    ),
  )
  renderPage()
  expect(await screen.findByText('python')).toBeTruthy()
  expect(screen.getByText(/3 bookmarks/)).toBeTruthy()
})

test('shows the empty state when there are no tags', async () => {
  vi.stubGlobal('fetch', vi.fn(async () => jsonResponse([])))
  renderPage()
  expect(await screen.findByText(/no tags yet/i)).toBeTruthy()
})
