import { Routes, Route } from 'react-router'
import RootLayout from './layouts/RootLayout'
import BookmarksPage from './pages/BookmarksPage'
import TagsPage from './pages/TagsPage'
import DashboardPage from './pages/DashboardPage'

function App() {
  return (
    <Routes>
      {/* Layout route: no path of its own, renders RootLayout + <Outlet /> */}
      <Route element={<RootLayout />}>
        {/* index = the "/" route, rendered into the layout's Outlet */}
        <Route index element={<BookmarksPage />} />
        <Route path="tags" element={<TagsPage />} />
        <Route path="dashboard" element={<DashboardPage />} />
      </Route>
    </Routes>
  )
}

export default App
