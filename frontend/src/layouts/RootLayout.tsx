import { NavLink, Outlet } from 'react-router'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'rounded px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-indigo-600 text-white'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  ].join(' ')

/**
 * The app's layout route. Renders persistent chrome (the nav) plus an
 * <Outlet />, into which React Router mounts whichever child route matches
 * the current URL. LP-9 replaces this minimal nav with the real sidebar +
 * top bar; for now it's just enough to prove routing works.
 */
function RootLayout() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <nav className="flex items-center gap-2 border-b border-slate-200 bg-white px-6 py-3">
        <span className="mr-4 text-lg font-bold text-indigo-600">LinkPulse</span>
        <NavLink to="/" end className={navLinkClass}>
          Bookmarks
        </NavLink>
        <NavLink to="/tags" className={navLinkClass}>
          Tags
        </NavLink>
        <NavLink to="/dashboard" className={navLinkClass}>
          Dashboard
        </NavLink>
      </nav>
      <main className="px-6 py-8">
        <Outlet />
      </main>
    </div>
  )
}

export default RootLayout
