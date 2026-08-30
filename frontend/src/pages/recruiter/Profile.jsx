import { useEffect, useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  Award, Briefcase, Building2, Camera,
  Check, Globe, Mail, MapPin, Phone,
  Save, TrendingUp, Upload, Users
} from 'lucide-react'

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card'
import { Button }   from '@/components/ui/button'
import { Input }    from '@/components/ui/input'
import { Label }    from '@/components/ui/label'
import { Badge }    from '@/components/ui/badge'
import Navbar       from '@/components/Navbar'
import client       from '@/api/client'
import useAuthStore from '@/store/authStore'

const schema = z.object({
  name:          z.string().min(2, 'Company name is required'),
  email:         z.string().email('invalid email address'),
  domain:        z.string().min(1, 'Domain is required'),
  num_employees: z.coerce.number().min(1, 'Must be at least 1'),
  about:         z.string().optional(),
  website:       z.string().optional(),
  location:      z.string().optional(),
  phone:         z.string().optional(),
})

const inputCls = `w-full border border-input rounded-lg px-3 py-2.5 text-sm
                  outline-none focus:border-ring bg-background transition-colors`
const labelCls = `block text-sm font-medium text-foreground mb-1.5`

export default function RecruiterProfile() {
  const { userId } = useAuthStore()
  const cacheKey   = `recruiter_profile_${userId}`

  // ── Read cache immediately — no blank flash on refresh ────────
  const getCached = () => {
    try {
      const raw = localStorage.getItem(cacheKey)
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  }

  const cached = getCached()

  const [profile,     setProfile]     = useState(cached)
  const [logoPreview, setLogoPreview] = useState(null)
  const [saving,      setSaving]      = useState(false)
  const [loading,     setLoading]     = useState(!cached)
  const [stats,       setStats]       = useState(
    cached?._stats ?? { total: 0, open: 0, apps: 0 }
  )

  const abortRef = useRef(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    // Pre-fill from cache so form is never blank on refresh
    defaultValues: {
      name:          cached?.name          ?? '',
      email:         cached?.email         ?? '',
      domain:        cached?.domain        ?? '',
      num_employees: cached?.num_employees ?? '',
      about:         cached?.about         ?? '',
      website:       cached?.website       ?? '',
      location:      cached?.location      ?? '',
      phone:         cached?.phone         ?? '',
    },
  })

  // ── Fetch fresh data from API ─────────────────────────────────
  useEffect(() => {
    if (!userId) return

    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()

    const load = async () => {
      try {
        setLoading(true)
        const [p, l] = await Promise.all([
          client.get(`/recruiter/recruiters/${userId}`,
            { signal: abortRef.current.signal }),
          client.get(`/listings?company_id=${userId}`,
            { signal: abortRef.current.signal }),
        ])

        const prof     = p.data
        const listings = l.data ?? []

        const computedStats = {
          total: listings.length,
          open:  listings.filter(x => x.is_open).length,
          apps:  listings.reduce((s, x) => s + (x.applications_num ?? 0), 0),
        }

        // Save to localStorage — includes stats so they survive refresh
        const toCache = { ...prof, _stats: computedStats }
        localStorage.setItem(cacheKey, JSON.stringify(toCache))

        setProfile(prof)
        setStats(computedStats)

        // Fill form with fresh server data
        reset({
          name:          prof.name          ?? '',
          email:         prof.email         ?? '',
          domain:        prof.domain        ?? '',
          num_employees: prof.num_employees ?? '',
          about:         prof.about         ?? '',
          website:       prof.website       ?? '',
          location:      prof.location      ?? '',
          phone:         prof.phone         ?? '',
        })
      } catch (err) {
        if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
          toast.error('Failed to load profile')
        }
      } finally {
        setLoading(false)
      }
    }

    load()
    return () => { if (abortRef.current) abortRef.current.abort() }
  }, [cacheKey, reset, userId])

  // ── Save profile ──────────────────────────────────────────────
  const onSubmit = async (data) => {
    setSaving(true)
    try {
      await client.put(`/recruiter/recruiters/${userId}`, data)

      // Update cache with new values
      const updated = { ...profile, ...data, _stats: stats }
      localStorage.setItem(cacheKey, JSON.stringify(updated))
      setProfile({ ...profile, ...data })

      toast.success('Profile updated successfully!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  // ── Logo upload ───────────────────────────────────────────────
  const handleLogo = async (e) => {
    const file = e.target.files[0]
    if (!file) return

    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    if (!allowed.includes(file.type)) {
      toast.error('Only JPG, PNG or WebP allowed')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Max 5MB')
      return
    }

    // Instant preview
    setLogoPreview(URL.createObjectURL(file))

    const fd = new FormData()
    fd.append('logo', file)
    try {
      const { data } = await client.post(
        `/recruiter/recruiters/${userId}/logo`, fd
      )
      // data should contain the saved filename
      const filename = data?.logo_file_name
        ?? `logo_${userId}${file.name.slice(file.name.lastIndexOf('.'))}`

      const updated = { ...profile, logo_file_name: filename, _stats: stats }
      localStorage.setItem(cacheKey, JSON.stringify(updated))
      setProfile(prev => ({ ...prev, logo_file_name: filename }))
      toast.success('Logo updated!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to upload logo')
      setLogoPreview(null)
    }
  }

  const logoSrc = logoPreview
    ?? (profile?.logo_file_name
      ? `/files/logos/${profile.logo_file_name}`
      : null)

  if (loading) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

        {/* ── Hero banner ── */}
        <div className="bg-gray-900 rounded-2xl p-6 text-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">

            {/* Logo with upload button */}
            <div className="relative">
              {logoSrc ? (
                <img
                  src={logoSrc}
                  alt="Company logo"
                  className="w-20 h-20 rounded-2xl object-contain bg-white p-2
                             border border-white/20"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center
                                justify-center text-3xl font-bold border border-white/20">
                  {profile?.name?.[0]?.toUpperCase() ?? 'C'}
                </div>
              )}
              <label
                className="absolute -bottom-2 -right-2 w-7 h-7 bg-white rounded-full
                            flex items-center justify-center cursor-pointer shadow-md
                            hover:scale-110 transition-transform"
                title="Change logo"
              >
                <Camera className="w-3.5 h-3.5 text-gray-900" />
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={handleLogo}
                />
              </label>
            </div>

            {/* Company info */}
            <div className="flex-1">
              <h1 className="text-2xl font-bold">
                {profile?.name || 'Company Name'}
                {profile?.email || 'Company Email'}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-1.5 text-white/70 text-sm">
                {profile?.domain && <span>{profile.domain}</span>}
                {profile?.num_employees > 0 && (
                  <>
                    <span>·</span>
                    <span>{profile.num_employees} employees</span>
                  </>
                )}
                {profile?.location && (
                  <>
                    <span>·</span>
                    <span>{profile.location}</span>
                  </>
                )}
              </div>
              {profile?.about && (
                <p className="text-white/50 text-sm mt-2 line-clamp-2">
                  {profile.about}
                </p>
              )}
            </div>

            {/* Stats */}
            <div className="flex gap-6">
              {[
                { label: 'Listings', value: stats.total, icon: Briefcase  },
                { label: 'Active',   value: stats.open,  icon: TrendingUp },
                { label: 'Applied',  value: stats.apps,  icon: Users      },
              ].map(({ label, value }) => (
                <div key={label} className="text-center">
                  <p className="text-2xl font-bold">{value}</p>
                  <p className="text-xs text-white/60 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">

          {/* ── Left — main form ── */}
          <div className="lg:col-span-2 space-y-5">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Building2 className="w-4 h-4" /> Company Information
                </CardTitle>
                <CardDescription>
                  This information is visible to students browsing your listings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">

                  <div className="grid sm:grid-cols-2 gap-4">

                    <div>
                      <Label htmlFor="name" className={labelCls}>
                        Company Name *
                      </Label>
                      <Input
                        id="name"
                        {...register('name')}
                        placeholder="Tech Corp Pvt Ltd"
                        className={errors.name ? 'border-destructive' : ''}
                      />
                      {errors.name && (
                        <p className="text-xs text-destructive mt-1">
                          {errors.name.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="email" className='{labelCls}'>
                        Comapany Email *
                      </label>
                      <Input
                        id="email"
                        {...register('email')}
                        placeholder="Email"
                        className={errors.email ? 'border-destructive' : ''}
                      />
                      {errors.email && (
                        <p className="text-xs text-destructive mt-1">
                        {errors.name.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="domain" className={labelCls}>
                        Industry / Domain *
                      </Label>
                      <Input
                        id="domain"
                        {...register('domain')}
                        placeholder="Technology, Finance, Healthcare..."
                        className={errors.domain ? 'border-destructive' : ''}
                      />
                      {errors.domain && (
                        <p className="text-xs text-destructive mt-1">
                          {errors.domain.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="num_employees" className={labelCls}>
                        Number of Employees *
                      </Label>
                      <Input
                        id="num_employees"
                        type="number"
                        min="1"
                        {...register('num_employees')}
                        placeholder="500"
                        className={errors.num_employees ? 'border-destructive' : ''}
                      />
                      {errors.num_employees && (
                        <p className="text-xs text-destructive mt-1">
                          {errors.num_employees.message}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="location" className={labelCls}>
                        Location
                      </Label>
                      <Input
                        id="location"
                        {...register('location')}
                        placeholder="Bangalore, India"
                      />
                    </div>

                    <div>
                      <Label htmlFor="website" className={labelCls}>
                        Website
                      </Label>
                      <Input
                        id="website"
                        {...register('website')}
                        placeholder="https://company.com"
                      />
                    </div>

                    <div>
                      <Label htmlFor="phone" className={labelCls}>
                        Contact Phone
                      </Label>
                      <Input
                        id="phone"
                        {...register('phone')}
                        placeholder="+91 98765 43210"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="about" className={labelCls}>
                      About the Company
                    </Label>
                    <textarea
                      id="about"
                      {...register('about')}
                      rows={4}
                      placeholder="Tell students about your company culture, mission, and what makes you a great place to work..."
                      className={`${inputCls} resize-none`}
                    />
                  </div>

                  <Button
                    type="submit"
                    disabled={saving}
                    className="gap-2"
                  >
                    <Save className="w-4 h-4" />
                    {saving ? 'Saving...' : 'Save changes'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* ── Right sidebar ── */}
          <div className="space-y-5">

            {/* Logo upload */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Company Logo</CardTitle>
                <CardDescription className="text-xs">
                  Shown on listings and your profile
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col items-center gap-3">
                  {logoSrc ? (
                    <img
                      src={logoSrc}
                      alt="logo"
                      className="w-24 h-24 rounded-2xl object-contain border border-border p-2"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-muted flex items-center
                                    justify-center border-2 border-dashed border-border">
                      <Building2 className="w-10 h-10 text-muted-foreground/40" />
                    </div>
                  )}
                  <label className="w-full cursor-pointer">
                    <div className="flex items-center justify-center gap-2 border border-input
                                    rounded-lg px-4 py-2.5 text-sm text-muted-foreground
                                    hover:bg-accent transition-colors">
                      <Upload className="w-4 h-4" />
                      {logoSrc ? 'Change logo' : 'Upload logo'}
                    </div>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={handleLogo}
                    />
                  </label>
                </div>
              </CardContent>
            </Card>

            {/* Profile tips */}
            <Card className="border-blue-100 bg-blue-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm text-blue-900 flex items-center gap-2">
                  <Award className="w-4 h-4" /> Profile Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2.5">
                  {[
                    'Add your company logo to stand out',
                    'Write a compelling About section',
                    'Keep contact info up to date',
                    'Add location to attract local talent',
                    'List your company size to set expectations',
                  ].map((tip, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-blue-800">
                      <Check className="w-3.5 h-3.5 mt-0.5 text-blue-500 shrink-0" />
                      {tip}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Contact info display */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Contact Info</CardTitle>
                <CardDescription className="text-xs">
                  Shown to shortlisted students
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[
                    { icon: Mail,   value: profile?.email,    label: 'Email'    },
                    { icon: Phone,  value: profile?.phone,    label: 'Phone'    },
                    { icon: MapPin, value: profile?.location, label: 'Location' },
                    { icon: Globe,  value: profile?.website,  label: 'Website'  },
                  ].map(({ icon: Icon, value, label }) => (
                    <div key={label} className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-muted rounded-lg flex items-center
                                      justify-center shrink-0">
                        <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">{label}</p>
                        {value ? (
                          <p className="text-sm text-foreground truncate">{value}</p>
                        ) : (
                          <p className="text-sm text-muted-foreground/50 italic">Not set</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Profile completeness */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Profile Completeness</CardTitle>
              </CardHeader>
              <CardContent>
                {(() => {
                  const fields = [
                    { label: 'Company name',  done: !!profile?.name },
                    { label: 'Domain',        done: !!profile?.domain },
                    { label: 'About',         done: !!profile?.about },
                    { label: 'Logo',          done: !!profile?.logo_file_name },
                    { label: 'Location',      done: !!profile?.location },
                    { label: 'Website',       done: !!profile?.website },
                    { label: 'Phone',         done: !!profile?.phone },
                  ]
                  const done  = fields.filter(f => f.done).length
                  const total = fields.length
                  const pct   = Math.round((done / total) * 100)

                  return (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs text-muted-foreground">
                          {done}/{total} completed
                        </span>
                        <Badge variant={pct === 100 ? 'default' : 'secondary'}>
                          {pct}%
                        </Badge>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 mb-4">
                        <div
                          className="bg-primary h-2 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="space-y-1.5">
                        {fields.map(f => (
                          <div key={f.label}
                            className="flex items-center gap-2 text-xs">
                            <span className={f.done
                              ? 'text-green-500'
                              : 'text-muted-foreground/40'}>
                              {f.done ? '✓' : '○'}
                            </span>
                            <span className={f.done
                              ? 'text-foreground'
                              : 'text-muted-foreground'}>
                              {f.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </>
                  )
                })()}
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  )
}