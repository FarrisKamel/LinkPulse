import { NavLink } from 'react-router'

const NAV_ITEMS = [
  { to: '/', label: 'Bookmarks', end: true },
  { to: '/tags', label: 'Tags', end: false },
  { to: '/dashboard', label: 'Dashboard', end: false },
]

const linkClass = ({ isActive }: { isActive: boolean }) =>
  [
    'block rounded-lg px-3 py-2 text-sm font-medium transition-colors',
    isActive
      ? 'bg-indigo-600 text-white'
      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
  ].join(' ')

interface SidebarProps {
  /** Whether the mobile drawer is open. */
  open: boolean
  /** Close the mobile drawer (backdrop click or nav selection). */
  onClose: () => void
}

function Sidebar({ open, onClose }: SidebarProps) {
  return (
    <>
      {/* Backdrop — only on mobile, only when open. */}
      {open && (
        <button
          type="button"
          aria-label="Close menu"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-slate-900/40 md:hidden"
        />
      )}

      <aside
        className={[
          // Mobile: display:none when closed removes the links from the tab
          // order and a11y tree entirely (translate-off-screen would leave
          // them keyboard-focusable). Always a static column on md+.
          open ? 'block' : 'hidden',
          'fixed inset-y-0 left-0 z-40 w-64 border-r border-slate-200 bg-white p-4',
          'md:static md:block',
        ].join(' ')}
      >
        <div className="mb-6 px-3 text-lg font-bold text-indigo-600">
          LinkPulse
        </div>
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={linkClass}
              onClick={onClose}
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  )
}

export default Sidebar
