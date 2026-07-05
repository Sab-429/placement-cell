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


export default function App() {
    const { role } = useAuthStore()
    const home =
        role === 'student' ? '/student/dashboard' :
            role === 'recruiter' ? '/recruiter/dashboard' :
                role === 'admin' ? '/admin/dashboard' : '/login'

    return (
        <BrowserRouter>
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
                    <Route path="listings/:id/applications" element={<ListingApplicants />} />
                </Route>
                <Route path="*" element={<Navigate to={home} replace />} />
            </Routes>
        </BrowserRouter>
    )
}