import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen } from '@testing-library/react'
import { afterEach, expect, test, vi } from 'vitest'

import type { Stats } from '../types'
import DashboardPage from './DashboardPage'

function renderPage() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  render(
    <QueryClientProvider client={client}>
      <DashboardPage />
    </QueryClientProvider>,
  )
}

const STATS: Stats = {
  total_bookmarks: 12,
  total_tags: 4,
  bookmarks_this_week: 3,
  top_domains: [{ domain: 'react.dev', count: 5 }],
  bookmarks_over_time: [{ date: '2026-08-10', count: 2 }],
  tag_distribution: [{ name: 'frontend', color: '#0ea5e9', count: 5 }],
}

afterEach(() => {
  vi.restoreAllMocks()
})

test('renders the stat tiles from the API', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response(JSON.stringify(STATS), { status: 200 })),
  )
  renderPage()
  expect(await screen.findByText('12')).toBeTruthy()
  expect(screen.getByText('Total bookmarks')).toBeTruthy()
  expect(screen.getByText('Tags')).toBeTruthy()
  expect(screen.getByText('Added this week')).toBeTruthy()
})

test('shows an error state on failure', async () => {
  vi.stubGlobal(
    'fetch',
    vi.fn(async () => new Response('nope', { status: 500 })),
  )
  renderPage()
  expect(await screen.findByText(/couldn't load stats/i)).toBeTruthy()
})
