import { useEffect, useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import {
  User, Upload, GraduationCap, Plus,
  Save, FileText, Award, Star, Briefcase,
  BookOpen, RefreshCw, Download, Edit3, X
} from 'lucide-react'
import Navbar       from '@/components/Navbar'
import client       from '@/api/client'
import useAuthStore from '@/store/authStore'

const schema = z.object({
  name:         z.string().min(2, 'Name must be at least 2 characters'),
  branch:       z.string().min(1, 'Branch is required'),
  cgpa:         z.coerce.number().min(0).max(10),
  passing_year: z.coerce.number().min(2020).max(2035),
  about:        z.string().optional(),
})

const inputCls = `w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm
                  outline-none focus:border-gray-400 bg-white transition-colors`
const labelCls = `block text-sm font-medium text-gray-700 mb-1.5`

// ── Helper: normalize any JSONB value to a list of dicts ──────────
function toItemList(value) {
  if (!value) return []
  let parsed = value
  if (typeof value === 'string') {
    try { parsed = JSON.parse(value) } catch { return [] }
  }
  if (Array.isArray(parsed)) {
    return parsed.filter(x => x && typeof x === 'object' && x.title)
  }
  if (typeof parsed === 'object') {
    return Object.values(parsed).filter(x => x && typeof x === 'object' && x.title)
  }
  return []
}

function toStringList(value) {
  if (!value) return []
  let parsed = value
  if (typeof value === 'string') {
    try { parsed = JSON.parse(value) } catch { return [] }
  }
  if (Array.isArray(parsed)) return parsed.filter(x => typeof x === 'string')
  if (typeof parsed === 'object') return Object.values(parsed).filter(x => typeof x === 'string')
  return []
}

// ── Reusable item entry form ───────────────────────────────────────
function ItemForm({ fields, onAdd }) {
  const empty = Object.fromEntries(fields.map(f => [f.key, '']))
  const [form, setForm] = useState(empty)
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }))

  const handleAdd = () => {
    if (!form.title?.trim()) { toast.error('Title is required'); return }
    onAdd({ ...form })
    setForm(empty)
  }

  return (
    <div className="border border-dashed border-gray-300 rounded-xl p-4
                    space-y-3 bg-gray-50/50">
      <div className="grid sm:grid-cols-2 gap-3">
        {fields.map(f => (
          <div key={f.key} className={f.full ? 'sm:col-span-2' : ''}>
            <label className={labelCls}>{f.label}{f.required ? ' *' : ''}</label>
            {f.type === 'textarea' ? (
              <textarea rows={3} value={form[f.key]} onChange={set(f.key)}
                placeholder={f.placeholder} className={`${inputCls} resize-none`} />
            ) : (
              <input type="text" value={form[f.key]} onChange={set(f.key)}
                placeholder={f.placeholder} className={inputCls} />
            )}
          </div>
        ))}
      </div>
      <button type="button" onClick={handleAdd}
        className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2
                   rounded-lg text-xs font-medium hover:bg-gray-800">
        <Plus className="w-3.5 h-3.5" /> Add
      </button>
    </div>
  )
}

function ItemList({ items, onRemove, renderItem }) {
  if (!items?.length) return (
    <div className="flex items-center justify-center py-8 bg-gray-50 rounded-xl
                    border border-dashed border-gray-200 text-gray-400 text-sm">
      Nothing added yet
    </div>
  )
  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="flex items-start justify-between gap-3 bg-white
                                border border-gray-200 rounded-xl px-4 py-3">
          <div className="flex-1 min-w-0">{renderItem(item)}</div>
          <button type="button" onClick={() => onRemove(i)}
            className="text-gray-300 hover:text-red-500 transition-colors mt-0.5 flex-shrink-0">
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  )
}

export default function StudentProfile() {
  const { userId } = useAuthStore()
  const cacheKey   = `profile_${userId}`

  const getCached = () => {
    try {
      const raw = localStorage.getItem(cacheKey)
      return raw ? JSON.parse(raw) : null
    } catch { return null }
  }

  const cached = getCached()

  const [profile,        setProfile]        = useState(cached)
  const [domains,        setDomains]        = useState(toStringList(cached?.domains))
  const [workExperience, setWorkExperience] = useState(toItemList(cached?.work_experience))
  const [projects,       setProjects]       = useState(toItemList(cached?.projects))
  const [education,      setEducation]      = useState(toItemList(cached?.education))
  const [certificates,   setCertificates]   = useState(toItemList(cached?.certificates))
  const [domainInput,    setDomainInput]    = useState('')
  const [pfpPreview,     setPfpPreview]     = useState(null)
  const [saving,         setSaving]         = useState(false)
  const [downloading,    setDownloading]    = useState(false)
  const [loading,        setLoading]        = useState(!cached)
  const [activeTab,      setActiveTab]      = useState('basic')

  const abortRef = useRef(null)

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      name:         cached?.name         ?? '',
      branch:       cached?.branch       ?? '',
      cgpa:         cached?.cgpa         ?? '',
      passing_year: cached?.passing_year ?? '',
      about:        cached?.about        ?? '',
    },
  })

  // ── Fetch profile ──────────────────────────────────────────
  useEffect(() => {
    if (!userId) return

    const cacheKey = `profile_${userId}`
    const controller = new AbortController()

    const fetchProfile = async () => {
      try {
        setLoading(true)
        const {data} = await client.get(`/student/students/${userId}`, { signal: abortRef.current.signal })

        const normalized = {
          ...data,
          id:              data.id ?? data.ID,
          domains:         toStringList(data.domains),
          work_experience: toItemList(data.work_experience),
          projects:        toItemList(data.projects),
          education:       toItemList(data.education),
          certificates:    toItemList(data.certificates),
        }
        localStorage.setItem(cacheKey, JSON.stringify(normalized))
        setProfile(normalized)
        setDomains(normalized.domains)
        setWorkExperience(normalized.work_experience)
        setProjects(normalized.projects)
        setEducation(normalized.education)
        setCertificates(normalized.certificates)
        reset({
          name:         normalized.name         ?? '',
          branch:       normalized.branch       ?? '',
          cgpa:         normalized.cgpa         ?? '',
          passing_year: normalized.passing_year ?? '',
          about:        normalized.about        ?? '',
        })

      } catch(err) {
        if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
          toast.error('Failed to load profile')
        }
      } finally {
        setLoading(false)
      }
    }
    fetchProfile()

    return () => controller.abort()

  }, [userId])

  // ── Core save function — sends everything to the backend ───
  const saveProfile = async (extra = {}) => {
    setSaving(true)
    try {
      const payload = {
        domains,
        work_experience: workExperience,
        projects,
        education,
        certificates,
        ...extra,
      }
      const { data } = await client.put(`/student/students/${userId}`, payload)

      // Update cache from server response
      const normalized = {
        ...data,
        domains:         toStringList(data.domains),
        work_experience: toItemList(data.work_experience),
        projects:        toItemList(data.projects),
        education:       toItemList(data.education),
        certificates:    toItemList(data.certificates),
      }
      localStorage.setItem(cacheKey, JSON.stringify(normalized))
      setProfile(normalized)
      toast.success('Saved!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save')
    } finally {
      setSaving(false)
    }
  }

  // ── Submit basic info form ─────────────────────────────────
  const onSubmitBasic = async (formData) => {
    await saveProfile({
      name:         formData.name,
      branch:       formData.branch,
      cgpa:         Number(formData.cgpa),
      passing_year: Number(formData.passing_year),
      about:        formData.about ?? '',
    })
  }

  // ── Download resume via fetch (sends auth token) ───────────
  const handleDownload = async () => {
    setDownloading(true)
    try {
      const token = localStorage.getItem('token')
      const res   = await fetch(`/api/student/students/${userId}/resume/download`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Download failed' }))
        toast.error(err.error || 'Download failed')
        return
      }

      // Convert response to blob and trigger browser download
      const blob     = await res.blob()
      const url      = URL.createObjectURL(blob)
      const link     = document.createElement('a')
      link.href      = url
      link.download  = profile?.resume_file_name || `resume_${userId}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
      toast.success('Download started!')
    } catch {
      toast.error('Download failed — please try again')
    } finally {
      setDownloading(false)
    }
  }

  const handlePFP = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 5 * 1024 * 1024) { toast.error('Max 5MB'); return }
    setPfpPreview(URL.createObjectURL(file))
    const fd = new FormData()
    fd.append('pfp', file)
    try {
      await client.post(`/student/students/${userId}/pfp`, fd)
      toast.success('Photo updated!')
    } catch { toast.error('Upload failed'); setPfpPreview(null) }
  }

  const handleResume = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.pdf')) { toast.error('PDF only'); return }
    const fd = new FormData()
    fd.append('resume', file)
    try {
      const { data } = await client.post(`/student/students/${userId}/resume`, fd)
      const updated = { ...profile, resume_file_name: data.resume_file_name, resume_ready: true }
      localStorage.setItem(cacheKey, JSON.stringify(updated))
      setProfile(updated)
      toast.success('Resume uploaded!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Upload failed')
    }
  }

  const handleGenerate = async () => {
    try {
      await client.post(`/student/students/${userId}/resume/generate`)
      const updated = { ...profile, resume_ready: false }
      localStorage.setItem(cacheKey, JSON.stringify(updated))
      setProfile(updated)
      toast.success('Resume queued! You will get an email when ready.')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to queue')
    }
  }

  const photoSrc = pfpPreview
    ?? (profile?.pfp_file_name ? `/files/pfps/${profile.pfp_file_name}` : null)

  const TABS = [
    { id: 'basic',    label: 'Basic',       icon: User         },
    { id: 'resume',   label: 'Resume',      icon: FileText     },
    { id: 'skills',   label: 'Skills',      icon: Star         },
    { id: 'work',     label: 'Experience',  icon: Briefcase    },
    { id: 'projects', label: 'Projects',    icon: Edit3        },
    { id: 'edu',      label: 'Education',   icon: BookOpen     },
    { id: 'certs',    label: 'Certificates',icon: Award        },
  ]

  if (loading) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-24 bg-white rounded-2xl border animate-pulse" />
        ))}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Hero */}
        <div className="bg-gray-900 rounded-2xl p-6 text-white">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="relative">
              {photoSrc ? (
                <img src={photoSrc} alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border-2 border-white/20" />
              ) : (
                <div className="w-20 h-20 rounded-full bg-white/10 flex items-center
                                justify-center border-2 border-dashed border-white/30">
                  <User className="w-8 h-8 text-white/40" />
                </div>
              )}
              <label className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full
                                flex items-center justify-center cursor-pointer shadow-md
                                hover:scale-110 transition-transform">
                <Upload className="w-3.5 h-3.5 text-gray-900" />
                <input type="file" accept="image/*" className="hidden" onChange={handlePFP} />
              </label>
            </div>
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{profile?.name || 'Your Name'}</h1>
              <p className="text-white/60 mt-1 text-sm">
                {[
                  profile?.branch,
                  profile?.cgpa > 0 && `CGPA ${profile.cgpa}`,
                  profile?.passing_year && `Class of ${profile.passing_year}`,
                ].filter(Boolean).join(' · ')}
              </p>
              <div className="flex gap-3 mt-2 text-xs text-white/40">
                <span>{workExperience.length} experience</span>
                <span>·</span>
                <span>{projects.length} projects</span>
                <span>·</span>
                <span>{domains.length} skills</span>
                <span>·</span>
                <span>{education.length} education</span>
                <span>·</span>
                <span>{certificates.length} certificates</span>
              </div>
            </div>
            <div>
              {profile?.resume_ready
                ? <span className="text-xs bg-green-500/20 text-green-300
                                   border border-green-500/30 px-3 py-1.5 rounded-full">
                    ✓ Resume ready
                  </span>
                : <span className="text-xs bg-white/10 text-white/40
                                   border border-white/20 px-3 py-1.5 rounded-full">
                    No resume yet
                  </span>
              }
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 p-1 bg-white border border-gray-200 rounded-xl overflow-x-auto">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium
                          whitespace-nowrap transition-all shrink-0 ${
                activeTab === id
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />{label}
            </button>
          ))}
        </div>

        {/* ── BASIC INFO ── */}
        {activeTab === 'basic' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h2 className="font-semibold mb-5 flex items-center gap-2">
              <GraduationCap className="w-4 h-4" /> Academic Information
            </h2>
            <form onSubmit={handleSubmit(onSubmitBasic)} className="space-y-5">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className={labelCls}>Full Name *</label>
                  <input {...register('name')} placeholder="Rahul Kumar"
                    className={`${inputCls} ${errors.name ? 'border-red-400' : ''}`} />
                  {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                </div>
                <div>
                  <label className={labelCls}>Branch *</label>
                  <input {...register('branch')} placeholder="Computer Science"
                    className={`${inputCls} ${errors.branch ? 'border-red-400' : ''}`} />
                  {errors.branch && <p className="text-xs text-red-500 mt-1">{errors.branch.message}</p>}
                </div>
                <div>
                  <label className={labelCls}>CGPA *</label>
                  <input type="number" step="0.01" min="0" max="10"
                    {...register('cgpa')} placeholder="8.5"
                    className={`${inputCls} ${errors.cgpa ? 'border-red-400' : ''}`} />
                  {errors.cgpa && <p className="text-xs text-red-500 mt-1">{errors.cgpa.message}</p>}
                </div>
                <div>
                  <label className={labelCls}>Passing Year *</label>
                  <input type="number" min="2020" max="2035"
                    {...register('passing_year')} placeholder="2025"
                    className={`${inputCls} ${errors.passing_year ? 'border-red-400' : ''}`} />
                  {errors.passing_year && <p className="text-xs text-red-500 mt-1">{errors.passing_year.message}</p>}
                </div>
              </div>
              <div>
                <label className={labelCls}>About</label>
                <textarea {...register('about')} rows={4} className={`${inputCls} resize-none`}
                  placeholder="Tell recruiters about yourself..." />
              </div>
              <button type="submit" disabled={saving}
                className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5
                           rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50">
                <Save className="w-4 h-4" />
                {saving ? 'Saving...' : 'Save changes'}
              </button>
            </form>
          </div>
        )}

        {/* ── RESUME ── */}
        {activeTab === 'resume' && (
          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="font-semibold mb-4 flex items-center gap-2">
                <FileText className="w-4 h-4" /> Resume
              </h2>

              {/* Status + download */}
              {profile?.resume_ready ? (
                <div className="flex items-center justify-between bg-green-50 border
                                border-green-200 rounded-xl px-5 py-4 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                      <Award className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-green-900 text-sm">Resume is ready</p>
                      <p className="text-xs text-green-600 mt-0.5">{profile.resume_file_name}</p>
                    </div>
                  </div>
                  {/* Uses fetch() with auth token — NOT <a href> which can't send headers */}
                  <button
                    onClick={handleDownload}
                    disabled={downloading}
                    className="flex items-center gap-2 bg-green-600 text-white px-4 py-2
                               rounded-lg text-sm font-medium hover:bg-green-700
                               disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="w-4 h-4" />
                    {downloading ? 'Downloading...' : 'Download PDF'}
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3 bg-gray-50 border border-dashed
                                border-gray-300 rounded-xl px-5 py-4 mb-4">
                  <FileText className="w-5 h-5 text-gray-400" />
                  <p className="text-sm text-gray-500">No resume yet</p>
                </div>
              )}

              {/* Actions */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="border border-dashed border-gray-300 rounded-xl p-5
                                hover:border-gray-400 transition-colors">
                  <Upload className="w-7 h-7 text-gray-400 mb-3" />
                  <p className="font-medium text-sm">Upload PDF</p>
                  <p className="text-xs text-gray-500 mt-1 mb-3">Upload your own resume</p>
                  <label className="cursor-pointer">
                    <span className="inline-flex items-center gap-2 bg-gray-900 text-white
                                     px-4 py-2 rounded-lg text-xs font-medium hover:bg-gray-800">
                      <Upload className="w-3.5 h-3.5" /> Choose PDF
                    </span>
                    <input type="file" accept=".pdf" className="hidden" onChange={handleResume} />
                  </label>
                </div>

                <div className="border border-dashed border-gray-300 rounded-xl p-5
                                hover:border-gray-400 transition-colors">
                  <RefreshCw className="w-7 h-7 text-gray-400 mb-3" />
                  <p className="font-medium text-sm">Auto-generate</p>
                  <p className="text-xs text-gray-500 mt-1 mb-3">
                    Build PDF from your profile — fills all sections
                  </p>
                  <button onClick={handleGenerate}
                    className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2
                               rounded-lg text-xs font-medium hover:bg-gray-800">
                    <RefreshCw className="w-3.5 h-3.5" />
                    {profile?.resume_ready ? 'Regenerate' : 'Generate now'}
                  </button>
                </div>
              </div>

              <p className="text-xs text-gray-400 mt-4">
                💡 Fill in Experience, Projects, Education and Certificates tabs first
                — they all appear in the generated PDF.
              </p>
            </div>
          </div>
        )}

        {/* ── SKILLS ── */}
        {activeTab === 'skills' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
            <h2 className="font-semibold flex items-center gap-2">
              <Star className="w-4 h-4" /> Skills &amp; Domains
            </h2>
            <div className="flex gap-2">
              <input type="text" value={domainInput}
                onChange={e => setDomainInput(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    const d = domainInput.trim()
                    if (!d) return
                    if (domains.includes(d)) { toast.error('Already added'); return }
                    setDomains([...domains, d])
                    setDomainInput('')
                  }
                }}
                placeholder="e.g. React, Go, Machine Learning"
                className={inputCls} />
              <button type="button"
                onClick={() => {
                  const d = domainInput.trim()
                  if (!d) return
                  if (domains.includes(d)) { toast.error('Already added'); return }
                  setDomains([...domains, d])
                  setDomainInput('')
                }}
                className="px-4 py-2.5 bg-gray-900 text-white rounded-lg hover:bg-gray-800 flex-shrink-0">
                <Plus className="w-4 h-4" />
              </button>
            </div>
            {domains.length > 0 ? (
              <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wide">
                  {domains.length} skill{domains.length !== 1 ? 's' : ''} added
                </p>
                <div className="flex flex-wrap gap-2">
                  {domains.map(d => (
                    <span key={d}
                      className="flex items-center gap-1.5 bg-white border border-gray-200
                                 text-sm px-3 py-1.5 rounded-full text-gray-700 group">
                      {d}
                      <button type="button"
                        onClick={() => setDomains(domains.filter(x => x !== d))}
                        className="text-gray-300 group-hover:text-red-500 transition-colors">
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center py-10 bg-gray-50 rounded-xl
                              border border-dashed border-gray-200 text-gray-400 text-sm">
                Add your first skill above
              </div>
            )}
            <button
              onClick={() => saveProfile()}
              disabled={saving}
              className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5
                         rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50">
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save skills'}
            </button>
          </div>
        )}

        {/* ── WORK EXPERIENCE ── */}
        {activeTab === 'work' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
            <h2 className="font-semibold flex items-center gap-2">
              <Briefcase className="w-4 h-4" /> Work Experience
            </h2>
            <ItemForm
              fields={[
                { key: 'title',       label: 'Job Title',   required: true,  placeholder: 'e.g. Software Intern' },
                { key: 'time',        label: 'Duration',    required: false, placeholder: 'e.g. Jun 2024 – Aug 2024' },
                { key: 'company',     label: 'Company',     required: false, placeholder: 'e.g. Google' },
                { key: 'description', label: 'Description', required: false,
                  placeholder: 'What did you do?', type: 'textarea', full: true },
              ]}
              onAdd={item => setWorkExperience(prev => [...prev, item])}
            />
            <ItemList
              items={workExperience}
              onRemove={i => setWorkExperience(prev => prev.filter((_, idx) => idx !== i))}
              renderItem={item => (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-sm text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-400 flex-shrink-0">{item.time}</p>
                  </div>
                  {item.company     && <p className="text-xs text-gray-500 mt-0.5">{item.company}</p>}
                  {item.description && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.description}</p>}
                </>
              )}
            />
            <button onClick={() => saveProfile()} disabled={saving}
              className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5
                         rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50">
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save experience'}
            </button>
          </div>
        )}

        {/* ── PROJECTS ── */}
        {activeTab === 'projects' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
            <h2 className="font-semibold flex items-center gap-2">
              <Edit3 className="w-4 h-4" /> Projects
            </h2>
            <ItemForm
              fields={[
                { key: 'title',       label: 'Project Name', required: true,  placeholder: 'e.g. Placement Portal' },
                { key: 'time',        label: 'Duration',     required: false, placeholder: 'e.g. Jan 2024 – Mar 2024' },
                { key: 'tech',        label: 'Tech Stack',   required: false, placeholder: 'e.g. React, Go, Postgres' },
                { key: 'description', label: 'Description',  required: false,
                  placeholder: 'What did you build?', type: 'textarea', full: true },
              ]}
              onAdd={item => setProjects(prev => [...prev, item])}
            />
            <ItemList
              items={projects}
              onRemove={i => setProjects(prev => prev.filter((_, idx) => idx !== i))}
              renderItem={item => (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-sm text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-400 flex-shrink-0">{item.time}</p>
                  </div>
                  {item.tech        && <p className="text-xs text-blue-600 mt-0.5">{item.tech}</p>}
                  {item.description && <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.description}</p>}
                </>
              )}
            />
            <button onClick={() => saveProfile()} disabled={saving}
              className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5
                         rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50">
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save projects'}
            </button>
          </div>
        )}

        {/* ── EDUCATION ── */}
        {activeTab === 'edu' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
            <h2 className="font-semibold flex items-center gap-2">
              <BookOpen className="w-4 h-4" /> Education
            </h2>
            <ItemForm
              fields={[
                { key: 'title',  label: 'Institution', required: true,  placeholder: 'e.g. IIT Bombay' },
                { key: 'time',   label: 'Year',        required: false, placeholder: 'e.g. 2021 – 2025' },
                { key: 'degree', label: 'Degree',      required: false, placeholder: 'e.g. B.Tech Computer Science' },
                { key: 'grade',  label: 'Grade/CGPA',  required: false, placeholder: 'e.g. 8.5 / 10' },
              ]}
              onAdd={item => setEducation(prev => [...prev, item])}
            />
            <ItemList
              items={education}
              onRemove={i => setEducation(prev => prev.filter((_, idx) => idx !== i))}
              renderItem={item => (
                <>
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-medium text-sm text-gray-900">{item.title}</p>
                    <p className="text-xs text-gray-400 flex-shrink-0">{item.time}</p>
                  </div>
                  {item.degree && <p className="text-xs text-gray-600 mt-0.5">{item.degree}</p>}
                  {item.grade  && <p className="text-xs text-gray-400 mt-0.5">Grade: {item.grade}</p>}
                </>
              )}
            />
            <button onClick={() => saveProfile()} disabled={saving}
              className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5
                         rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50">
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save education'}
            </button>
          </div>
        )}

        {/* ── CERTIFICATES ── */}
        {activeTab === 'certs' && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
            <h2 className="font-semibold flex items-center gap-2">
              <Award className="w-4 h-4" /> Certificates
            </h2>
            <ItemForm
              fields={[
                { key: 'title',       label: 'Certificate Name', required: true,  placeholder: 'e.g. AWS Solutions Architect' },
                { key: 'issuer',      label: 'Issuing Body',     required: false, placeholder: 'e.g. Amazon Web Services' },
                { key: 'date',        label: 'Date',             required: false, placeholder: 'e.g. March 2024' },
                { key: 'description', label: 'Description',      required: false,
                  placeholder: 'Brief description', type: 'textarea', full: true },
              ]}
              onAdd={item => setCertificates(prev => [...prev, item])}
            />
            <ItemList
              items={certificates}
              onRemove={i => setCertificates(prev => prev.filter((_, idx) => idx !== i))}
              renderItem={item => (
                <>
                  <p className="font-medium text-sm text-gray-900">{item.title}</p>
                  <div className="flex gap-3 mt-0.5">
                    {item.issuer && <p className="text-xs text-gray-500">{item.issuer}</p>}
                    {item.date   && <p className="text-xs text-gray-400">{item.date}</p>}
                  </div>
                  {item.description && <p className="text-xs text-gray-500 mt-1">{item.description}</p>}
                </>
              )}
            />
            <button onClick={() => saveProfile()} disabled={saving}
              className="flex items-center gap-2 bg-gray-900 text-white px-5 py-2.5
                         rounded-lg text-sm font-medium hover:bg-gray-800 disabled:opacity-50">
              <Save className="w-4 h-4" />
              {saving ? 'Saving...' : 'Save certificates'}
            </button>
          </div>
        )}

      </div>
    </div>
  )
}