import { Navigate, Outlet } from 'react-router-dom'
import useAuthStore from '../store/authStore'

function isTokenValid(token) {
  if (!token) return false
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp * 1000 > Date.now()
  } catch {
    return false
  }
}

export default function ProtectedRoute({ role }) {
  const { token, role: userRole, logout } = useAuthStore()

  // Token expired — logout cleanly and redirect
  if (!isTokenValid(token)) {
    logout()
    return <Navigate to="/login" replace />
  }

  if (role && userRole !== role) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}