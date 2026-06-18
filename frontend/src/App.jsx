import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import useAuthStore from './store/authStore'
import ProtectedRoute from './components/ProtectedRoute'
import StudentDashboard from './pages/student/Dashboard'

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
                    <Route path="dashboard" element={<StudentDashboard/>}/>
                </Route>
                <Route path="*" element={<Navigate to={home} replace />} />
            </Routes>
        </BrowserRouter>
    )
}