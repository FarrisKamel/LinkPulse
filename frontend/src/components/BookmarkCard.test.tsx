import { render, screen } from '@testing-library/react'
import { expect, test } from 'vitest'

import type { Bookmark } from '../types'
import BookmarkCard from './BookmarkCard'

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
    created_at: '',
    updated_at: '',
    tags: [],
    ...overrides,
  }
}

test('renders title linking to the url, plus the domain', () => {
  render(<BookmarkCard bookmark={make()} />)
  const link = screen.getByRole('link', { name: 'Example' })
  expect(link.getAttribute('href')).toBe('https://example.com/')
  expect(screen.getByText('example.com')).toBeTruthy()
})

test('falls back to the domain when the title is missing', () => {
  render(<BookmarkCard bookmark={make({ title: null })} />)
  expect(screen.getByRole('link', { name: 'example.com' })).toBeTruthy()
})

test('renders tag chips', () => {
  render(
    <BookmarkCard
      bookmark={make({ tags: [{ id: 't1', name: 'python', color: '#3572A5' }] })}
    />,
  )
  expect(screen.getByText('python')).toBeTruthy()
})

test('marks a starred bookmark', () => {
  render(<BookmarkCard bookmark={make({ is_starred: true })} />)
  expect(screen.getByLabelText('Starred')).toBeTruthy()
})
