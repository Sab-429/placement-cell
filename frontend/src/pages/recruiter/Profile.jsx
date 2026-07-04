import client from "@/api/client";
import useAuthStore from "@/store/authStore";
import { useEffect, useState } from "react";
import { domain } from "zod/v4/core/regexes.cjs";

export default function RecruiterProfile() {
    const { userId } = useAuthStore()
    const [form, setForm] = useState({})
    const [saved, setSaved] = useState(false)
    const [loading, setLoading] = useState(false)

    useEffect(() => {
        client.get(`/recruiters/${userId}`)
        .then(({data}) => setForm(data))
    }, [userId])

    const handleSave = async (e) => {
        e.preventDefault()
        setLoading(true)
        await client.put(`/recruiters/${userId}`, {
            name: form.name, 
            about: form.about,
            domain: form.domain,
            num_employees: ,

        })
    }
    


    
}