import { useState } from 'react'
import { Outlet } from 'react-router'

import AddBookmarkModal from '../components/AddBookmarkModal'
import Sidebar from '../components/Sidebar'
import TopBar from '../components/TopBar'

/**
 * App shell: a fixed sidebar on desktop that collapses to a toggleable drawer
 * on mobile, a top bar with search + Add Bookmark, and the routed page in the
 * main area via <Outlet />.
 */
function RootLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [addOpen, setAddOpen] = useState(false)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 md:flex">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex min-h-screen flex-1 flex-col">
        <TopBar
          onMenuClick={() => setSidebarOpen(true)}
          onAddClick={() => setAddOpen(true)}
        />
        <main className="flex-1 px-4 py-6 sm:px-6">
          <Outlet />
        </main>
      </div>

      {addOpen && <AddBookmarkModal onClose={() => setAddOpen(false)} />}
    </div>
  )
}

export default RootLayout
