import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useEffect } from 'react'
import Landing from './pages/Landing'
import Login from './pages/Login'
import AppLayout from './pages/app/AppLayout'
import Dashboard from './pages/app/Dashboard'
import Incidents from './pages/app/Incidents'
import Guards from './pages/app/Guards'
import Sites from './pages/app/Sites'
import Reports from './pages/app/Reports'
import { useStore } from './data/store'

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => window.scrollTo(0, 0), [pathname])
  return null
}

export default function App() {
  const { user } = useStore()
  return (
    <>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={user ? <Navigate to="/app" replace /> : <Login />} />
        <Route path="/app" element={user ? <AppLayout /> : <Navigate to="/login" replace />}>
          <Route index element={<Dashboard />} />
          <Route path="incidents" element={<Incidents />} />
          <Route path="guards" element={<Guards />} />
          <Route path="sites" element={<Sites />} />
          <Route path="reports" element={<Reports />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}
