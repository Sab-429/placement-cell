import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ArrowLeft, Users, Download, Search,
  ChevronDown, Mail, FileText, Eye,
  GraduationCap, Briefcase, Star
} from 'lucide-react'
import Navbar from '@/components/Navbar'
import StatusBadge from '@/components/StatusBadge'
import client from '@/api/client'

const STATUS_OPTIONS = [
  { value: 'shortlisted', label: 'Shortlist', color: 'text-blue-600', bg: 'hover:bg-blue-50' },
  { value: 'selected', label: 'Select', color: 'text-green-600', bg: 'hover:bg-green-50' },
  { value: 'rejected', label: 'Reject', color: 'text-red-600', bg: 'hover:bg-red-50' },
  { value: 'applied', label: 'Reset', color: 'text-gray-600', bg: 'hover:bg-gray-50' },
]

const FILTER_TABS = ['all', 'applied', 'shortlisted', 'selected', 'rejected']

// Helper — reads both uppercase and lowercase versions of a field
const field = (obj, key) => obj?.[key] ?? obj?.[key[0].toUpperCase() + key.slice(1)]

// Normalize one application object so all fields are lowercase
const normalize = (app) => {
  const s = app.student ?? app.Student ?? {}
  const student = {
    id: field(s, 'id') ?? field(s, 'ID'),
    name: field(s, 'name'),
    email: field(s, 'email'),
    branch: field(s, 'branch'),
    cgpa: field(s, 'cgpa'),
    passing_year: field(s, 'passing_year'),
    about: field(s, 'about'),
    domains: field(s, 'domains') ?? [],
    resume_ready: field(s, 'resume_ready') ?? false,
    resume_file_name: field(s, 'resume_file_name'),
    work_experience: field(s, 'work_experience') ?? [],
    projects: field(s, 'projects') ?? [],
    education: field(s, 'education') ?? [],
  }
  return {
    ...app,
    id: field(app, 'id') ?? field(app, 'ID'),
    status: field(app, 'status') ?? 'applied',
    applied_at: field(app, 'applied_at') ?? field(app, 'created_at'),
    student,
  }
}

export default function ListingApplicants() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [listing, setListing] = useState(null)
  const [apps, setApps] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null)
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    Promise.all([
      client.get(`/listings/${id}`),
      client.get(`/recruiter/listings/${id}/applications`),
    ]).then(([l, a]) => {
      setListing(l.data)
      const raw = a.data ?? []
      console.log('raw applications[0]:', JSON.stringify(raw[0], null, 2))
      setApps(raw.map(normalize))
    }).catch(err => {
      console.error(err)
      toast.error('Failed to load applicants')
    }).finally(() => setLoading(false))
  }, [id])

  const updateStatus = async (appId, newStatus) => {
    setUpdating(appId)
    try {
      await client.put(`/recruiter/applications/${appId}/status`, { status: newStatus })
      setApps(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a))
      toast.success(`Marked as ${newStatus} — student notified by email`)
    } catch (err) {
      console.error('updateStatus error:', err.response?.data)
      toast.error(err.response?.data?.error || 'Failed to update status')
    } finally {
      setUpdating(null)
    }
  }

  const visible = apps.filter(a => {
    const s = a.student
    const matchSearch = !search ||
      s.name?.toLowerCase().includes(search.toLowerCase()) ||
      s.email?.toLowerCase().includes(search.toLowerCase()) ||
      s.branch?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || a.status === filter
    return matchSearch && matchFilter
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
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

        {/* Header */}
        <div className="flex items-start gap-3">
          <button
            onClick={() => navigate('/recruiter/listings')}
            className="mt-1 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold">Applicants</h1>
            <p className="text-gray-500 text-sm mt-0.5">
              {listing?.title ?? listing?.Title} · {apps.length} total
            </p>
          </div>
        </div>

        {/* Filter tabs */}
        <div className="grid grid-cols-5 gap-3">
          {FILTER_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`p-3 rounded-xl border text-left transition-all ${filter === tab
                ? 'border-gray-900 bg-gray-900 text-white'
                : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
            >
              <p className="text-xl font-bold">{counts[tab]}</p>
              <p className={`text-xs capitalize mt-0.5 ${filter === tab ? 'text-gray-300' : 'text-gray-500'
                }`}>{tab}</p>
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email or branch..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full border border-gray-200 rounded-xl pl-10 pr-4 py-2.5 text-sm
                       outline-none focus:border-gray-400 bg-white"
          />
        </div>

        {/* List */}
        {visible.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 bg-white
                          rounded-2xl border border-gray-200 text-gray-400">
            <Users className="w-16 h-16 mb-4 opacity-30" />
            <p className="font-medium text-lg">No applicants found</p>
            <p className="text-sm mt-1">
              {filter !== 'all' ? 'Try a different filter' : 'No one has applied yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {visible.map(app => {
              const s = app.student
              const isExp = expanded === app.id
              const hasResume = s.resume_ready
              const resumeUrl = `/files/resumes/resume_${s.id}.pdf`

              return (
                <div key={app.id}
                  className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:border-gray-300 transition-all">

                  {/* ── Main row ── */}
                  <div className="flex items-center gap-4 p-5">

                    {/* Avatar */}
                    <div className="w-11 h-11 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 font-bold text-sm shrink-0">
                      {s.name?.[0]?.toUpperCase() ?? 'S'}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900">{s.name ?? '—'}</p>
                        <StatusBadge status={app.status} />
                        {hasResume && (
                          <span className="text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-0.5 rounded-full">
                            Resume ✓
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-xs text-gray-400 flex-wrap">
                        <span>{s.email}</span>
                        {s.branch && <><span>·</span><span>{s.branch}</span></>}
                        {s.cgpa > 0 && <><span>·</span><span>CGPA {s.cgpa}</span></>}
                        {s.passing_year && <><span>·</span><span>Class of {s.passing_year}</span></>}
                        <span>·</span>
                        <span>
                          Applied {app.applied_at
                            ? new Date(app.applied_at).toLocaleDateString('en-IN', {
                              day: 'numeric', month: 'short'
                            })
                            : '—'}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                      {/* Status buttons — shows only the ones different from current */}
                      {STATUS_OPTIONS.filter(o => o.value !== app.status).map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => updateStatus(app.id, opt.value)}
                          disabled={updating === app.id}
                          className={`text-xs font-medium px-3 py-1.5 rounded-lg border
                                      border-gray-200 transition-colors whitespace-nowrap
                                      ${opt.color} ${opt.bg}
                                      disabled:opacity-40 disabled:cursor-not-allowed`}
                        >
                          {updating === app.id ? '...' : opt.label}
                        </button>
                      ))}

                      {/* Resume download */}
                      {hasResume ? (
                        <a
                          href={resumeUrl}
                          download={`${s.name ?? 'resume'}.pdf`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1.5 text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors whitespace-nowrap"
                          title="Download resume"
                        >
                          <Download className="w-3.5 h-3.5" />
                          Resume
                        </a>
                      ) : (
                        <span className="text-xs text-gray-300 px-2">No resume</span>
                      )}

                      {/* Expand toggle */}
                      <button
                        onClick={() => setExpanded(isExp ? null : app.id)}
                        className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors text-gray-500"
                        title={isExp ? 'Collapse' : 'View full profile'}
                      >
                        <ChevronDown className={`w-4 h-4 transition-transform ${isExp ? 'rotate-180' : ''
                          }`} />
                      </button>
                    </div>
                  </div>

                  {/* ── Expanded profile ── */}
                  {
                    isExp && (
                      <div className="border-t border-gray-100 bg-gray-50/40">

                        {/* Resume preview banner */}
                        {hasResume && (
                          <div className="flex items-center justify-between px-5 py-3 bg-blue-50 border-b border-blue-100">
                            <div className="flex items-center gap-2 text-sm text-blue-800">
                              <FileText className="w-4 h-4" />
                              <span>Resume available — {s.resume_file_name}</span>
                            </div>
                            <div className="flex gap-2">
                              <a
                                href={resumeUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center gap-1.5 text-xs font-medium  bg-white text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                View in browser
                              </a>
                              <a
                                href={resumeUrl}
                                download={`${s.name}.pdf`}
                                className="flex items-center gap-1.5 text-xs font-medium bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700"
                              >
                                <Download className="w-3.5 h-3.5" />
                                Download PDF
                              </a>
                            </div>
                          </div>
                        )}

                        {/* Profile grid */}
                        <div className="grid sm:grid-cols-3 gap-5 p-5">

                          {/* Academic */}
                          <div>
                            <p className="flex items-center gap-1.5 text-xs text-gray-400
                                        uppercase tracking-wide mb-3">
                              <GraduationCap className="w-3.5 h-3.5" /> Academic
                            </p>
                            <div className="space-y-2">
                              {[
                                ['Branch', s.branch || '—'],
                                ['CGPA', s.cgpa || '—'],
                                ['Passing year', s.passing_year || '—'],
                              ].map(([label, value]) => (
                                <div key={label} className="flex justify-between text-sm">
                                  <span className="text-gray-400">{label}</span>
                                  <span className="font-medium text-gray-800">{value}</span>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* About */}
                          <div>
                            <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">
                              About
                            </p>
                            <p className="text-sm text-gray-600 leading-relaxed">
                              {s.about || 'No description provided.'}
                            </p>
                          </div>

                          {/* Skills */}
                          <div>
                            <p className="flex items-center gap-1.5 text-xs text-gray-400
                                        uppercase tracking-wide mb-3">
                              <Star className="w-3.5 h-3.5" /> Skills
                            </p>
                            {Array.isArray(s.domains) && s.domains.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {s.domains.map(d => (
                                  <span key={d}
                                    className="text-xs bg-white border border-gray-200
                                             px-2.5 py-1 rounded-full text-gray-700">
                                    {d}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-400">No skills listed</p>
                            )}
                          </div>
                        </div>

                        {/* Work experience */}
                        {Array.isArray(s.work_experience) && s.work_experience.length > 0 && (
                          <div className="px-5 pb-4">
                            <p className="flex items-center gap-1.5 text-xs text-gray-400
                                        uppercase tracking-wide mb-3">
                              <Briefcase className="w-3.5 h-3.5" /> Work Experience
                            </p>
                            <div className="space-y-2">
                              {s.work_experience.map((exp, i) => (
                                <div key={i}
                                  className="bg-white rounded-lg border border-gray-100 px-4 py-3">
                                  <div className="flex items-start justify-between">
                                    <p className="font-medium text-sm text-gray-900">
                                      {exp.title ?? exp.Title ?? '—'}
                                    </p>
                                    <p className="text-xs text-gray-400">
                                      {exp.time ?? exp.Time ?? ''}
                                    </p>
                                  </div>
                                  {(exp.description ?? exp.Description) && (
                                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                      {exp.description ?? exp.Description}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Projects */}
                        {Array.isArray(s.projects) && s.projects.length > 0 && (
                          <div className="px-5 pb-4">
                            <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">
                              Projects
                            </p>
                            <div className="space-y-2">
                              {s.projects.map((p, i) => (
                                <div key={i}
                                  className="bg-white rounded-lg border border-gray-100 px-4 py-3">
                                  <div className="flex items-start justify-between">
                                    <p className="font-medium text-sm text-gray-900">
                                      {p.title ?? '—'}
                                    </p>
                                    <p className="text-xs text-gray-400">{p.time ?? ''}</p>
                                  </div>
                                  {p.description && (
                                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                                      {p.description}
                                    </p>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Quick actions */}
                        <div className="flex gap-2 px-5 py-4 border-t border-gray-100">
                          <a
                            href={`mailto:${s.email}`}
                            className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-white transition-colors"
                          >
                            <Mail className="w-3.5 h-3.5" />
                            Email {s.name?.split(' ')[0]}
                          </a>
                          {hasResume && (
                            <a
                              href={resumeUrl}
                              download={`${s.name}.pdf`}
                              className="flex items-center gap-1.5 text-xs text-blue-600  hover:text-blue-800 border border-blue-200 rounded-lg px-3 py-1.5 hover:bg-blue-50 transition-colors"
                            >
                              <Download className="w-3.5 h-3.5" />
                              Download resume
                            </a>
                          )}
                        </div>

                      </div >
                    )
                  }
                </div >
              )
            })}
          </div >
        )}
      </div >
    </div >
  )
}