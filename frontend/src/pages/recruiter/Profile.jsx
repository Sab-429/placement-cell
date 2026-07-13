
import { useForm } from  'react-hook-form'
import useAuthStore from '@/store/authStore'
import { useEffect, useState } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import client from '@/api/client'
import { toast } from 'sonner'
import Navbar from '@/components/Navbar'

const schema = z.object({
  name: z.string().min(2, 'company name required'),
  domain: z.string().min(1, 'Domain required'),
  num_employees: z.coerce.number().min(1),
  about: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  website:       z.string().optional(),
  location:      z.string().optional(),
  founded_year:  z.coerce.number().optional(),
  phone:         z.string().optional(),
})

export default function RecruiterProfile() {
  const { userId } = useAuthStore()
  const [profile, setProfile] = useState(null)
  const [logoPreview, setLogoPreview] = useState(null)
  const [saving, setSaving] = useState(null)
  const [stats, setStats] = useState({ total: 0, open: 0, apps: 0 })
  const [loading, setLoading] = useState(true)

  const { register, handleSubmit, reset, formState: {errors}} = useForm({
    resolver: zodResolver(schema)
  })

  useEffect(() => {
    Promise.all([
      client.get(`/recruiter/recruiters/${userId}`),
      client.get(`/listings?company_id=${userId}`),
    ]).then(([p , l]) => {
      const prof = p.data
      const listings = l.data ?? []
      setProfile(prof)
      setStats({
        total: listings.length,
        open:  listings.filter(x => x.is_open).length,
        apps:  listings.reduce((s, x) => s + (x.applications_num ?? 0), 0),
      })
      reset({
        name:          prof.name          ?? '',
        domain:        prof.domain        ?? '',
        num_employees: prof.num_employees ?? '',
        about:         prof.about         ?? '',
        email:         prof.email         ?? '',
        website:       prof.website       ?? '',
        location:      prof.location      ?? '',
        phone:         prof.phone         ?? '',
      })
    }).finally(() => setLoading(false))
  }), [userId]

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      await client.put(`/recruiter/recruiters/${userId}`, data)
      const updated = { ...profile, ...data }
      setProfile(updated)
      toast.success('Profile updated successfully!')
    } catch (error) {
      toast.error('Failed to update profile!')
    } finally {
      setSaving(false)
    }
  }

  const handleLogo = async (e) => {
    const file = e.target.files[0]
    if(!file) return 
    setLogoPreview(URL.createObjectURL(file))
    const fd = new FormData()
    fd.append('logo', file)
    try {
      await client.post(`/recruiter/recruiters/${userId}/logo`, fd)
      toast.success('Logo updated')
    } catch (error) {
      toast.error('Failed to upload logo')
      setLogoPreview(null)
    }
  }

  const logoSrc = logoPreview ||
    (profile?.logo_file_name ? `/files/logos/${profile.logo_file_name}` : null)

  if (loading) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    </div>
  )

  
}

