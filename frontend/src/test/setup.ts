import { cleanup } from '@testing-library/react'
import { afterEach } from 'vitest'

// recharts' ResponsiveContainer uses ResizeObserver, which jsdom lacks.
class ResizeObserverStub {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver

// Unmount and clear the DOM after each test. Auto-registered by Testing Library
// only when using Vitest globals; we import explicitly, so wire it up here.
afterEach(() => {
  cleanup()
})
