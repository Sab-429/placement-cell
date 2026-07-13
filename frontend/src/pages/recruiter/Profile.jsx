
import { useForm } from  'react-hook-form'
import useAuthStore from '@/store/authStore'
import { useEffect, useState } from 'react'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import client from '@/api/client'
import { toast } from 'sonner'
import Navbar from '@/components/Navbar'
import { Award, Briefcase, Building2, Camera, Check, Globe, Mail, MapPin, Phone, Save, TrendingUp, Upload, Users } from 'lucide-react'

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
  }, [userId])

  const onSubmit = async (data) => {
    setSaving(true)
    try {
      await client.put(`/recruiter/recruiters/${userId}`, data)
      const updated = { ...profile, ...data }
      setProfile(updated)
      toast.success('Profile updated successfully!')
    } catch (err) {
      toast.error('Failed to update profile!',err)
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
      console.log(error)
      toast.error('Failed to upload logo',error)
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

  return(
    <div className="min-h-screen bg-gray-50">
    <Navbar />
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

      {/* Hero banner */}
      <div className="bg-gray-900 rounded-2xl p-6 text-white">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">

          {/* Logo */}
          <div className="relative">
            {logoSrc ? (
              <img src={logoSrc} alt="logo"
                className="w-20 h-20 rounded-2xl object-contain bg-white p-2 border border-white/20" />
            ) : (
              <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center
                              justify-center text-3xl font-bold border border-white/20">
                {profile?.name?.[0]?.toUpperCase() ?? 'C'}
              </div>
            )}
            <label className="absolute -bottom-2 -right-2 w-7 h-7 bg-white rounded-full
                              flex items-center justify-center cursor-pointer shadow-md
                              hover:scale-110 transition-transform">
              <Camera className="w-3.5 h-3.5 text-gray-900" />
              <input type="file" accept="image/*" className="hidden" onChange={handleLogo} />
            </label>
          </div>

          {/* Info */}
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{profile?.name || 'Company Name'}</h1>
            <div className="flex flex-wrap items-center gap-3 mt-1.5 text-white/70 text-sm">
              {profile?.domain && <span>{profile.domain}</span>}
              {profile?.num_employees > 0 && (
                <><span>·</span><span>{profile.num_employees} employees</span></>
              )}
            </div>
            {profile?.about && (
              <p className="text-white/60 text-sm mt-2 line-clamp-2">{profile.about}</p>
            )}
          </div>

          {/* Stats */}
          <div className="flex gap-4 sm:gap-6">
            {[
              { label: 'Listings', value: stats.total, icon: Briefcase  },
              { label: 'Active',   value: stats.open,  icon: TrendingUp },
              { label: 'Applied',  value: stats.apps,  icon: Users      },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="text-center">
                <p className="text-2xl font-bold">{value}</p>
                <p className="text-xs text-white/60 mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">

        {/* Left — form */}
        <div className="lg:col-span-2 space-y-5">

          {/* Basic info */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-semibold text-gray-900 mb-5 flex items-center gap-2">
              <Building2 className="w-4 h-4" /> Company Information
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Company Name *
                  </label>
                  <input
                    {...register('name')}
                    placeholder="Tech Corp Pvt Ltd"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                               outline-none focus:border-gray-400"
                  />
                  {errors.name && (
                    <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Industry / Domain *
                  </label>
                  <input
                    {...register('domain')}
                    placeholder="Technology"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                               outline-none focus:border-gray-400"
                  />
                  {errors.domain && (
                    <p className="text-xs text-red-500 mt-1">{errors.domain.message}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Number of Employees *
                  </label>
                  <input
                    type="number"
                    {...register('num_employees')}
                    placeholder="500"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                               outline-none focus:border-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    {...register('location')}
                    placeholder="Bangalore, India"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                               outline-none focus:border-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Website
                  </label>
                  <input
                    {...register('website')}
                    placeholder="https://company.com"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                               outline-none focus:border-gray-400"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contact Phone
                  </label>
                  <input
                    {...register('phone')}
                    placeholder="+91 98765 43210"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                               outline-none focus:border-gray-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  About the Company
                </label>
                <textarea
                  {...register('about')}
                  rows={4}
                  placeholder="Tell students about your company culture, mission, and what makes you a great place to work..."
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                             outline-none focus:border-gray-400 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5
                           rounded-lg text-sm font-medium hover:bg-gray-800
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </form>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">

          {/* Logo upload card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="font-semibold text-sm text-gray-900 mb-4">Company Logo</h3>
            <div className="flex flex-col items-center gap-3">
              {logoSrc ? (
                <img src={logoSrc} alt="logo"
                  className="w-24 h-24 rounded-2xl object-contain border border-gray-100 p-2" />
              ) : (
                <div className="w-24 h-24 rounded-2xl bg-gray-100 flex items-center
                                justify-center border-2 border-dashed border-gray-300">
                  <Building2 className="w-10 h-10 text-gray-300" />
                </div>
              )}
              <label className="w-full cursor-pointer">
                <div className="flex items-center justify-center gap-2 border border-gray-200
                                rounded-lg px-4 py-2.5 text-sm text-gray-600 hover:bg-gray-50
                                transition-colors">
                  <Upload className="w-4 h-4" />
                  Upload logo
                </div>
                <input type="file" accept="image/*" className="hidden" onChange={handleLogo} />
              </label>
              <p className="text-xs text-gray-400">PNG or JPG, recommended 200×200px</p>
            </div>
          </div>

          {/* Profile tips */}
          <div className="bg-blue-50 rounded-2xl border border-blue-100 p-5">
            <h3 className="font-semibold text-sm text-blue-900 mb-3 flex items-center gap-2">
              <Award className="w-4 h-4" /> Profile Tips
            </h3>
            <ul className="space-y-2.5">
              {[
                'Add your company logo to stand out',
                'Write a compelling About section',
                'Keep contact info up to date',
                'Add location to attract local talent',
              ].map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-blue-800">
                  <Check className="w-3.5 h-3.5 mt-0.5 text-blue-500 flex-shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          {/* Contact info display */}
          <div className="bg-white rounded-2xl border border-gray-200 p-5">
            <h3 className="font-semibold text-sm text-gray-900 mb-4">Contact Info</h3>
            <div className="space-y-3">
              {[
                { icon: Mail,    value: profile?.email,    label: 'Email'    },
                { icon: Phone,   value: profile?.phone,    label: 'Phone'    },
                { icon: MapPin,  value: profile?.location, label: 'Location' },
                { icon: Globe,   value: profile?.website,  label: 'Website'  },
              ].map(({ icon: Icon, value, label }) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-gray-50 rounded-lg flex items-center
                                  justify-center flex-shrink-0">
                    <Icon className="w-3.5 h-3.5 text-gray-400" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-400">{label}</p>
                    <p className="text-sm text-gray-700 truncate">
                      {value || <span className="text-gray-300 italic">Not set</span>}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  </div>
)
}

