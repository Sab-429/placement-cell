import useAuthStore from "@/store/authStore";
import { useLocation, useNavigate } from "react-router-dom";

export default function Navbar() {
    const {role ,  logout} = useAuthStore()
    const navigate = useNavigate()
    const { pathname } = useLocation()
    const links = 
}