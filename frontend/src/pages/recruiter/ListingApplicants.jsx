import { useEffect, useState, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ArrowLeft, Users, Download, Search,
  ChevronDown, FileText, Eye,
  GraduationCap, Briefcase, Star
} from 'lucide-react'

import { Button }   from '@/components/ui/button'
import { Input }    from '@/components/ui/input'
import { Badge }    from '@/components/ui/badge'
import {
  Card,
  CardContent,
} from '@/components/ui/card'

import Navbar      from '@/components/Navbar'
import StatusBadge from '@/components/StatusBadge'
import client      from '@/api/client'
import useAuthStore from '@/store/authStore'

const STATUS_OPTIONS = [
  { value: 'shortlisted', label: 'Shortlist', variant: 'outline', cls: 'text-blue-600  border-blue-200  hover:bg-blue-50'  },
  { value: 'selected',    label: 'Select',    variant: 'outline', cls: 'text-green-600 border-green-200 hover:bg-green-50' },
  { value: 'rejected',    label: 'Reject',    variant: 'outline', cls: 'text-red-600   border-red-200   hover:bg-red-50'   },
  { value: 'applied',     label: 'Reset',     variant: 'outline', cls: 'text-gray-600  border-gray-200  hover:bg-gray-50'  },
]

const FILTER_TABS = ['all', 'applied', 'shortlisted', 'selected', 'rejected']

// ── Normalize field names — handles both Go uppercase and lowercase ──
const fv = (obj, key) =>
  obj?.[key] ?? obj?.[key[0].toUpperCase() + key.slice(1)]

const normalize = (app) => {
  const s = app.student ?? app.Student ?? {}
  return {
    ...app,
    id:         fv(app, 'id') ?? fv(app, 'ID'),
    status:     fv(app, 'status')     ?? 'applied',
    applied_at: fv(app, 'applied_at') ?? fv(app, 'created_at'),
    student: {
      id:               fv(s, 'id')               ?? fv(s, 'ID') ?? null,
      name:             fv(s, 'name')             ?? '',
      email:            fv(s, 'email')            ?? '',
      branch:           fv(s, 'branch')           ?? '',
      cgpa:             fv(s, 'cgpa')             ?? 0,
      passing_year:     fv(s, 'passing_year')     ?? '',
      about:            fv(s, 'about')            ?? '',
      domains:          fv(s, 'domains')          ?? [],
      resume_ready:     fv(s, 'resume_ready')     ?? false,
      resume_file_name: fv(s, 'resume_file_name') ?? '',
      resume_source:    fv(s, 'resume_source')    ?? '',
      work_experience:  fv(s, 'work_experience')  ?? [],
      projects:         fv(s, 'projects')         ?? [],
      education:        fv(s, 'education')        ?? [],
      certificates:     fv(s, 'certificates')     ?? [],
    },
  }
}

// ── Fetch resume with fresh token — fixes "access denied after sometime" ──
// Always reads token fresh from localStorage so expired/rotated tokens are caught
async function fetchResumeBlob(studentId, role) {
  const token = localStorage.getItem('token')
  if (!token) throw new Error('Not authenticated')

  // Use recruiter route if recruiter, student route if student
  const url = role === 'recruiter'
    ? `/api/recruiter/students/${studentId}/resume/download`
    : `/api/student/students/${studentId}/resume/download`

  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.error || `Request failed (${res.status})`)
  }

  return res.blob()
}

// ── Download resume as file ──────────────────────────────────────
async function downloadResume(studentId, filename, role) {
  if (!studentId) { toast.error('Student ID missing'); return }
  const tid = toast.loading('Preparing download...')
  try {
    const blob = await fetchResumeBlob(studentId, role)
    const url  = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href     = url
    link.download = filename || `resume_${studentId}.pdf`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
    toast.success('Download started!', { id: tid })
  } catch (err) {
    toast.error(err.message || 'Download failed', { id: tid })
    console.error('downloadResume:', err)
  }
}

// ── View resume in new browser tab ───────────────────────────────
async function viewResume(studentId, role) {
  if (!studentId) { toast.error('Student ID missing'); return }
  const tid = toast.loading('Opening resume...')
  try {
    const blob    = await fetchResumeBlob(studentId, role)
    const pdfBlob = new Blob([blob], { type: 'application/pdf' })
    const url     = URL.createObjectURL(pdfBlob)
    const tab     = window.open(url, '_blank')
    if (!tab) {
      toast.error('Popup blocked — allow popups for this site', { id: tid })
      return
    }
    toast.dismiss(tid)
    setTimeout(() => URL.revokeObjectURL(url), 60000)
  } catch (err) {
    toast.error(err.message || 'Failed to open resume', { id: tid })
    console.error('viewResume:', err)
  }
}

export default function ListingApplicants() {
  const { id }       = useParams()
  const navigate     = useNavigate()
  const { role }     = useAuthStore()   // ← get current user role

  const [listing,  setListing]  = useState(null)
  const [apps,     setApps]     = useState([])
  const [search,   setSearch]   = useState('')
  const [filter,   setFilter]   = useState('all')
  const [loading,  setLoading]  = useState(true)
  const [updating, setUpdating] = useState(null)
  const [expanded, setExpanded] = useState(null)

  const abortRef = useRef(null)

  // ── Load applicants ────────────────────────────────────────────
  useEffect(() => {
    if (!id) return

    if (abortRef.current) abortRef.current.abort()
    abortRef.current = new AbortController()

    const load = async () => {
      try {
        setLoading(true)
        const [l, a] = await Promise.all([
          client.get(`/listings/${id}`,
            { signal: abortRef.current.signal }),
          client.get(`/recruiter/listings/${id}/applications`,
            { signal: abortRef.current.signal }),
        ])
        setListing(l.data)
        const normalized = (a.data ?? []).map(normalize)
        setApps(normalized)
      } catch (err) {
        if (err.name !== 'CanceledError' && err.code !== 'ERR_CANCELED') {
          toast.error('Failed to load applicants')
        }
      } finally {
        setLoading(false)
      }
    }

    load()
    return () => { if (abortRef.current) abortRef.current.abort() }
  }, [id])

  // ── Update application status ──────────────────────────────────
  const updateStatus = useCallback(async (appId, newStatus) => {
    setUpdating(appId)
    try {
      await client.put(`/recruiter/applications/${appId}/status`, {
        status: newStatus,
      })
      setApps(prev =>
        prev.map(a => a.id === appId ? { ...a, status: newStatus } : a)
      )
      toast.success(`Marked as ${newStatus} — student notified`)
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update status')
    } finally {
      setUpdating(null)
    }
  }, [])

  const visible = apps.filter(a => {
    const s = a.student
    const matchSearch = !search ||
      s.name?.toLowerCase().includes(search.toLowerCase())  ||
      s.email?.toLowerCase().includes(search.toLowerCase()) ||
      s.branch?.toLowerCase().includes(search.toLowerCase())
    return matchSearch && (filter === 'all' || a.status === filter)
  })

  const counts = FILTER_TABS.reduce((acc, tab) => ({
    ...acc,
    [tab]: tab === 'all'
      ? apps.length
      : apps.filter(a => a.status === tab).length,
  }), {})

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
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

        {/* ── Header ── */}
        <div className="flex items-start gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/recruiter/listings')}
            className="mt-1"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Applicants</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {listing?.title ?? listing?.Title} · {apps.length} total
            </p>
          </div>
        </div>

        {/* ── Filter tabs ── */}
        <div className="grid grid-cols-5 gap-3">
          {FILTER_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`p-3 rounded-xl border text-left transition-all ${
                filter === tab
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'bg-card border-border hover:border-primary/50'
              }`}
            >
              <p className="text-xl font-bold">{counts[tab]}</p>
              <p className={`text-xs capitalize mt-0.5 ${
                filter === tab ? 'text-primary-foreground/70' : 'text-muted-foreground'
              }`}>{tab}</p>
            </button>
          ))}
        </div>

        {/* ── Search ── */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email or branch..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* ── Empty state ── */}
        {visible.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-24 text-muted-foreground">
              <Users className="w-16 h-16 mb-4 opacity-30" />
              <p className="font-medium text-lg">No applicants found</p>
              <p className="text-sm mt-1">
                {filter !== 'all' ? 'Try a different filter' : 'No one has applied yet'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {visible.map(app => {
              const s         = app.student
              const isExp     = expanded === app.id
              const hasResume = s.resume_ready && !!s.id
              const studentId = s.id
              const filename  = s.resume_file_name || `resume_${studentId}.pdf`

              // Badge label for resume source
              const resumeSourceLabel = s.resume_source === 'uploaded'
                ? '⬆ Uploaded'
                : s.resume_source === 'generated'
                  ? '⚡ Generated'
                  : null

              return (
                <Card
                  key={app.id}
                  className="overflow-hidden hover:shadow-sm transition-shadow"
                >
                  {/* ── Main row ── */}
                  <CardContent className="flex items-center gap-4 p-5">

                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center
                                    justify-center text-primary font-bold text-sm shrink-0">
                      {(s.name || s.email || 'S')[0].toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-foreground">
                          {s.name || 'Unknown Student'}
                        </p>
                        <StatusBadge status={app.status} />
                        {hasResume && (
                          <Badge variant="outline"
                            className="text-green-700 border-green-200 bg-green-50 text-xs">
                            Resume ✓
                            {resumeSourceLabel && (
                              <span className="ml-1 text-green-500">{resumeSourceLabel}</span>
                            )}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs
                                      text-muted-foreground flex-wrap">
                        <span>{s.email || '—'}</span>
                        {s.branch       && <><span>·</span><span>{s.branch}</span></>}
                        {s.cgpa > 0     && <><span>·</span><span>CGPA {s.cgpa}</span></>}
                        {s.passing_year && <><span>·</span><span>Class of {s.passing_year}</span></>}
                        <span>·</span>
                        <span>Applied {app.applied_at
                          ? new Date(app.applied_at).toLocaleDateString('en-IN', {
                              day: 'numeric', month: 'short',
                            })
                          : '—'}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">

                      {/* Status buttons */}
                      {STATUS_OPTIONS.filter(o => o.value !== app.status).map(opt => (
                        <Button
                          key={opt.value}
                          variant="outline"
                          size="sm"
                          onClick={() => updateStatus(app.id, opt.value)}
                          disabled={updating === app.id}
                          className={`text-xs whitespace-nowrap ${opt.cls}`}
                        >
                          {updating === app.id ? '...' : opt.label}
                        </Button>
                      ))}

                      {/* Resume download */}
                      {hasResume ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadResume(studentId, filename, role)}
                          className="text-xs text-blue-700 border-blue-200 hover:bg-blue-50
                                     whitespace-nowrap"
                        >
                          <Download className="w-3.5 h-3.5 mr-1" />
                          Resume
                        </Button>
                      ) : (
                        <span className="text-xs text-muted-foreground px-2">No resume</span>
                      )}

                      {/* Expand toggle */}
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setExpanded(isExp ? null : app.id)}
                        className="text-muted-foreground"
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform ${
                          isExp ? 'rotate-180' : ''
                        }`} />
                      </Button>
                    </div>
                  </CardContent>

                  {/* ── Expanded profile ── */}
                  {isExp && (
                    <div className="border-t bg-muted/20">

                      {/* Resume banner */}
                      {hasResume && (
                        <div className="flex items-center justify-between px-5 py-3
                                        bg-blue-50 border-b border-blue-100">
                          <div className="flex items-center gap-2 text-sm text-blue-800">
                            <FileText className="w-4 h-4" />
                            <span className="truncate max-w-xs">{filename}</span>
                            {resumeSourceLabel && (
                              <Badge variant="outline"
                                className="text-blue-600 border-blue-200 text-xs">
                                {resumeSourceLabel}
                              </Badge>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => viewResume(studentId, role)}
                              className="text-xs text-blue-700 border-blue-200 hover:bg-white bg-white"
                            >
                              <Eye className="w-3.5 h-3.5 mr-1" />
                              View in browser
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => downloadResume(studentId, filename, role)}
                              className="text-xs bg-blue-600 hover:bg-blue-700"
                            >
                              <Download className="w-3.5 h-3.5 mr-1" />
                              Download PDF
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Profile grid */}
                      <div className="grid sm:grid-cols-3 gap-5 p-5">

                        {/* Academic */}
                        <div>
                          <p className="flex items-center gap-1.5 text-xs text-muted-foreground
                                        uppercase tracking-wide mb-3">
                            <GraduationCap className="w-3.5 h-3.5" /> Academic
                          </p>
                          <div className="space-y-2">
                            {[
                              ['Branch',       s.branch       || '—'],
                              ['CGPA',         s.cgpa         || '—'],
                              ['Passing year', s.passing_year || '—'],
                            ].map(([label, value]) => (
                              <div key={label} className="flex justify-between text-sm">
                                <span className="text-muted-foreground">{label}</span>
                                <span className="font-medium">{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* About */}
                        <div>
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">
                            About
                          </p>
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {s.about || 'No description provided.'}
                          </p>
                        </div>

                        {/* Skills */}
                        <div>
                          <p className="flex items-center gap-1.5 text-xs text-muted-foreground
                                        uppercase tracking-wide mb-3">
                            <Star className="w-3.5 h-3.5" /> Skills
                          </p>
                          {Array.isArray(s.domains) && s.domains.length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {s.domains.map((d, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {d}
                                </Badge>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">No skills listed</p>
                          )}
                        </div>
                      </div>

                      {/* Work experience */}
                      {Array.isArray(s.work_experience) && s.work_experience.length > 0 && (
                        <div className="px-5 pb-4">
                          <p className="flex items-center gap-1.5 text-xs text-muted-foreground
                                        uppercase tracking-wide mb-3">
                            <Briefcase className="w-3.5 h-3.5" /> Work Experience
                          </p>
                          <div className="space-y-2">
                            {s.work_experience.map((exp, i) => (
                              <Card key={i} className="shadow-none">
                                <CardContent className="px-4 py-3">
                                  <div className="flex items-start justify-between">
                                    <p className="font-medium text-sm">{exp.title ?? '—'}</p>
                                    <p className="text-xs text-muted-foreground">{exp.time ?? ''}</p>
                                  </div>
                                  {exp.company     && <p className="text-xs text-muted-foreground mt-0.5">{exp.company}</p>}
                                  {exp.description && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{exp.description}</p>}
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Projects */}
                      {Array.isArray(s.projects) && s.projects.length > 0 && (
                        <div className="px-5 pb-4">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">
                            Projects
                          </p>
                          <div className="space-y-2">
                            {s.projects.map((p, i) => (
                              <Card key={i} className="shadow-none">
                                <CardContent className="px-4 py-3">
                                  <div className="flex items-start justify-between">
                                    <p className="font-medium text-sm">{p.title ?? '—'}</p>
                                    <p className="text-xs text-muted-foreground">{p.time ?? ''}</p>
                                  </div>
                                  {p.tech        && <p className="text-xs text-blue-600 mt-0.5">{p.tech}</p>}
                                  {p.description && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{p.description}</p>}
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Certificates */}
                      {Array.isArray(s.certificates) && s.certificates.length > 0 && (
                        <div className="px-5 pb-4">
                          <p className="text-xs text-muted-foreground uppercase tracking-wide mb-3">
                            Certificates
                          </p>
                          <div className="space-y-2">
                            {s.certificates.map((cert, i) => (
                              <Card key={i} className="shadow-none">
                                <CardContent className="px-4 py-3">
                                  <div className="flex items-start justify-between">
                                    <p className="font-medium text-sm">{cert.title ?? '—'}</p>
                                    <p className="text-xs text-muted-foreground">{cert.date ?? ''}</p>
                                  </div>
                                  {cert.issuer      && <p className="text-xs text-muted-foreground mt-0.5">{cert.issuer}</p>}
                                  {cert.description && <p className="text-xs text-muted-foreground mt-1">{cert.description}</p>}
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}

                    </div>
                  )}
                </Card>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}