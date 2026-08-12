import { fireEvent, render, screen } from '@testing-library/react'
import { expect, test, vi } from 'vitest'

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

test('renders the title and domain', () => {
  render(<BookmarkCard bookmark={make()} onOpen={() => {}} />)
  expect(screen.getByText('Example')).toBeTruthy()
  expect(screen.getByText('example.com')).toBeTruthy()
})

test('clicking the card calls onOpen with the bookmark', () => {
  const onOpen = vi.fn()
  const bookmark = make()
  render(<BookmarkCard bookmark={bookmark} onOpen={onOpen} />)
  fireEvent.click(screen.getByRole('button'))
  expect(onOpen).toHaveBeenCalledWith(bookmark)
})

test('renders tag chips', () => {
  render(
    <BookmarkCard
      bookmark={make({ tags: [{ id: 't1', name: 'python', color: '#3572A5' }] })}
      onOpen={() => {}}
    />,
  )
  expect(screen.getByText('python')).toBeTruthy()
})

test('marks a starred bookmark', () => {
  render(<BookmarkCard bookmark={make({ is_starred: true })} onOpen={() => {}} />)
  expect(screen.getByLabelText('Starred')).toBeTruthy()
})
