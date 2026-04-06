import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import useAuthStore from './store/authStore'

import Login    from './pages/Login'
import Register from './pages/Register'

import StudentDashboard from './pages/student/Dashboard'
import StudentProfile   from './pages/student/Profile'
import Listings         from './pages/student/Listings'
import ListingDetail    from './pages/student/ListingDetail'

import RecruiterDashboard from './pages/recruiter/Dashboard'
import RecruiterProfile   from './pages/recruiter/Profile'
import MyListings         from './pages/recruiter/MyListings'
import CreateListing      from './pages/recruiter/CreateListing'
import ListingApplicants  from './pages/recruiter/ListingApplicants'

import AdminDashboard from './pages/admin/Dashboard'
import ProtectedRoute from './components/ProtectedRoute'

export default function App() {
  const { role } = useAuthStore()
  const home =
    role === 'student'   ? '/student/dashboard'  :
    role === 'recruiter' ? '/recruiter/dashboard' :
    role === 'admin'     ? '/admin/dashboard'     : '/login'

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"    element={<Login />} />
        <Route path="/register" element={<Register />} />

        <Route path="/student" element={<ProtectedRoute role="student" />}>
          <Route path="dashboard"    element={<StudentDashboard />} />
          <Route path="profile"      element={<StudentProfile />} />
          <Route path="listings"     element={<Listings />} />
          <Route path="listings/:id" element={<ListingDetail />} />
        </Route>

        <Route path="/recruiter" element={<ProtectedRoute role="recruiter" />}>
          <Route path="dashboard"               element={<RecruiterDashboard />} />
          <Route path="profile"                 element={<RecruiterProfile />} />
          <Route path="listings"                element={<MyListings />} />
          <Route path="listings/create"         element={<CreateListing />} />
          <Route path="listings/:id/applicants" element={<ListingApplicants />} />
        </Route>

        <Route path="/admin" element={<ProtectedRoute role="admin" />}>
          <Route path="dashboard" element={<AdminDashboard />} />
        </Route>

        <Route path="*" element={<Navigate to={home} replace />} />
      </Routes>
    </BrowserRouter>
  )
}