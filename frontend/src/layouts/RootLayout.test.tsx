import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { expect, test } from 'vitest'

import RootLayout from './RootLayout'

function renderShell() {
  render(
    <MemoryRouter>
      <Routes>
        <Route element={<RootLayout />}>
          <Route index element={<div>home</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

test('renders sidebar nav links', () => {
  renderShell()
  expect(screen.getByRole('link', { name: 'Bookmarks' })).toBeTruthy()
  expect(screen.getByRole('link', { name: 'Tags' })).toBeTruthy()
  expect(screen.getByRole('link', { name: 'Dashboard' })).toBeTruthy()
})

test('renders topbar search and add button', () => {
  renderShell()
  expect(screen.getByPlaceholderText(/search bookmarks/i)).toBeTruthy()
  expect(screen.getByRole('button', { name: /add bookmark/i })).toBeTruthy()
})

test('mobile menu toggle opens and closes the drawer', () => {
  renderShell()
  // Closed initially: no backdrop.
  expect(screen.queryByLabelText('Close menu')).toBeNull()
  // Hamburger opens it (backdrop appears).
  fireEvent.click(screen.getByLabelText('Open menu'))
  expect(screen.getByLabelText('Close menu')).toBeTruthy()
  // Backdrop click closes it.
  fireEvent.click(screen.getByLabelText('Close menu'))
  expect(screen.queryByLabelText('Close menu')).toBeNull()
})
