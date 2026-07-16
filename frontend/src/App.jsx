import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import useAuthStore from './store/authStore'
import ProtectedRoute from './components/ProtectedRoute'
import StudentDashboard from './pages/student/Dashboard'
import ListingDetails from './pages/student/ListingDetails'
import Listings from './pages/student/Listings'
import StudentProfile from './pages/student/Profile'
import RecruiterDashboard from './pages/recruiter/Dashboard'
import CreateListing from './pages/recruiter/CreateListing'
import MyListings from './pages/recruiter/MyListings'
import RecruiterProfile from './pages/recruiter/Profile'
import ListingApplicants  from './pages/recruiter/ListingApplicants'
import { useEffect } from 'react'
import { toast } from 'sonner'


function TokenExpiryWatcher() {
    const { token, logout } = useAuthStore()
  
    useEffect(() => {
      if (!token) return
  
      try {
        const payload  = JSON.parse(atob(token.split('.')[1]))
        const expiresAt = payload.exp * 1000
        const now       = Date.now()
        const timeLeft  = expiresAt - now
  
        if (timeLeft <= 0) {
          logout()
          return
        }
  
        // Warn 5 minutes before expiry
        const warnIn = timeLeft - 5 * 60 * 1000
        if (warnIn > 0) {
          const warnTimer = setTimeout(() => {
            toast.warning('Your session expires in 5 minutes. Save your work.')
          }, warnIn)
          return () => clearTimeout(warnTimer)
        }
  
        // Auto logout at expiry
        const logoutTimer = setTimeout(() => {
          toast.error('Session expired. Please login again.')
          logout()
          window.location.href = '/login'
        }, timeLeft)
  
        return () => clearTimeout(logoutTimer)
      } catch {
        // Malformed token
        logout()
      }
    }, [token])
  
    return null
  }
  
export default function App() {
    const { role } = useAuthStore()
    const home =
        role === 'student' ? '/student/dashboard' :
            role === 'recruiter' ? '/recruiter/dashboard' :
                role === 'admin' ? '/admin/dashboard' : '/login'

    return (
        <BrowserRouter>
         <TokenExpiryWatcher />
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />

                <Route path="/student" element={<ProtectedRoute role="student" />}>
                    <Route path="dashboard" element={<StudentDashboard />} />
                    <Route path="profile" element={<StudentProfile />} />
                    <Route path="listings" element={<Listings />} />
                    <Route path="listings/:id" element={<ListingDetails />} />
                </Route>

                <Route path="/recruiter" element={<ProtectedRoute role="recruiter" />}>
                    <Route path="dashboard" element={<RecruiterDashboard />} />
                    <Route path="listings/create" element={<CreateListing />} />
                    <Route path="listings" element={<MyListings />} />
                    <Route path="profile" element={<RecruiterProfile />} />
                    <Route path="listings/:id/applicants" element={<ListingApplicants />} />
                </Route>
                <Route path="*" element={<Navigate to={home} replace />} />
            </Routes>
        </BrowserRouter>
    )
}