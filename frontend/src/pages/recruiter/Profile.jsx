import useAuthStore from "@/store/authStore";
import { useState } from "react";

export default function RecruiterProfile() {
    const { userId } = useAuthStore()
    const [profile, setProfile] = useState(null)
    const [logoPreview, setLogoPreview] = useState(null)
    const [savings,setSavings] = useState(false)

    
}