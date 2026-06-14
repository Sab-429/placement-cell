import useAuthStore from "@/store/authStore";
import { Navigate, Outlet } from "react-router-dom";

export default function ProtectedRoute({role}) {
    const {token, role: userRole} = useAuthStore()
    if(!token || role && userRole != role )
        return <Navigate to = "/login" replace />
    return <Outlet />
}