import client from "@/api/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import useAuthStore from "@/store/authStore";
import { useEffect, useState } from "react";

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
            num_employees: Number(form.num_employees),
        })
        setSaved(true)
        setLoading(false)
        setTimeout(() => setSaved(false), 3000)
    }

    const set = (field) => (e) => {
        setForm((prev) => ({
            ...prev,
            [field]: e.target.value,
        }))
    }
    const handleLogo = async (e) => {
        const fd = new FormData() 
        fd.append('logo' , e.target.files[0])
        await client.post(`/recruiters/${userId}/logo`, fd)
    }
    return (
        <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <h1 className="text-xl font-bold mb-6">Company Profile</h1>
  
          {/* Logo */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 flex items-center gap-5">
            <img
              src={form.logo_file_name ? `/files/logos/${form.logo_file_name}` : '/placeholder-logo.png'}
              alt="logo"
              className="w-16 h-16 rounded-xl object-contain border border-gray-200"
            />
            <label className="cursor-pointer text-sm text-brand-600 hover:underline">
              Upload logo
              <input type="file" accept="image/*" className="hidden" onChange={handleLogo} />
            </label>
          </div>
  
          <form onSubmit={handleSave} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-4">
            <Input label="Company name"    value={form.name          ?? ''} onChange={set('name')} />
            <Input label="Domain / industry" value={form.domain       ?? ''} onChange={set('domain')} />
            <Input label="No. of employees" value={form.num_employees ?? ''} onChange={set('num_employees')} type="number" />
  
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-gray-700">About</label>
              <textarea rows={4}
                className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none
                           focus:border-brand-500 focus:ring-2 focus:ring-brand-50 resize-none"
                value={form.about ?? ''}
                onChange={set('about')}
              />
            </div>
  
            <div className="flex items-center gap-3">
              <Button type="submit" loading={loading}>Save changes</Button>
              {saved && <span className="text-sm text-green-600">Saved!</span>}
            </div>
          </form>
        </div>
      </div>
    )
}