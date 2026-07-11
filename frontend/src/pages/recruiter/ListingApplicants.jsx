import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  ArrowLeft, Users, Download, Search,
  ChevronDown, Mail
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

export default function ListingApplicants() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [listing, setListing] = useState(null)
  const [apps, setApps] = useState([])
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [updating, setUpdating] = useState(null) // appId being updated
  const [expanded, setExpanded] = useState(null)

  useEffect(() => {
    Promise.all([
      client.get(`/listings/${id}`),
      client.get(`/recruiter/listings/${id}/applications`),
    ]).then(([l, a]) => {
      setListing(l.data)
      setApps(a.data ?? [])
    }).catch(() => toast.error('Failed to load applicants'))
      .finally(() => setLoading(false))
  }, [id])

  const updateStatus = async (appId, status) => {
    setUpdating(appId)
    try {
      await client.put(`/recruiter/applications/${appId}/status`, { status })
      setApps(as => as.map(a => a.id === appId ? { ...a, status } : a))
      toast.success(`Status updated to ${status} — student notified by email`)
    } catch {
      toast.error('Failed to update status')
    } finally {
      setUpdating(null)
    }
  }

  const visible = apps.filter(a => {
    const matchSearch = !search ||
      a.student?.name?.toLowerCase().includes(search.toLowerCase()) ||
      a.student?.email?.toLowerCase().includes(search.toLowerCase()) ||
      a.student?.branch?.toLowerCase().includes(search.toLowerCase())
    const matchFilter = filter === 'all' || a.status === filter
    return matchSearch && matchFilter
  })

  const counts = FILTER_TABS.reduce((acc, tab) => ({
    ...acc,
    [tab]: tab === 'all' ? apps.length : apps.filter(a => a.status === tab).length
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
              {listing?.title} · {apps.length} total applications
            </p>
          </div>
        </div>

        {/* Stats tabs */}
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

        {/* Applicants list */}
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
            {visible.map(app => (
              <div key={app.id}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden
                           hover:border-gray-300 transition-all">

                {/* Main row */}
                <div className="flex items-center gap-4 p-5">

                  {/* Avatar */}
                  <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center
                                  justify-center text-primary font-bold text-sm shrink-0">
                    {app.student?.name?.[0]?.toUpperCase() ?? 'S'}
                  </div>

                  {/* Student info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-gray-900">{app.student?.name}</p>
                      <StatusBadge status={app.status} />
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-sm text-gray-500 flex-wrap">
                      <span>{app.student?.email}</span>
                      {app.student?.branch && <><span>·</span><span>{app.student.branch}</span></>}
                      {app.student?.cgpa > 0 && <><span>·</span><span>CGPA {app.student.cgpa}</span></>}
                      <span>·</span>
                      <span>Applied {new Date(app.applied_at || app.CreatedAt).toLocaleDateString('en-IN', {
                        day: 'numeric', month: 'short'
                      })}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 shrink-0">

                    {/* Status update buttons */}
                    <div className="flex items-center gap-1.5">
                      {STATUS_OPTIONS.filter(s => s.value !== app.status).map(opt => (
                        <button
                          key={opt.value}
                          onClick={() => updateStatus(app.id, opt.value)}
                          disabled={updating === app.id}
                          className={`text-xs font-medium px-3 py-1.5 rounded-lg border
                                      border-gray-200 transition-colors
                                      ${opt.color} ${opt.bg}
                                      disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          {updating === app.id ? '...' : opt.label}
                        </button>
                      ))}
                    </div>

                    {app.student?.resume_ready && (
                    <a
                      href = {`/files/resumes/resume_${app.student.id}.pdf`}
                      download
                      target="_blank"
                      rel="noreferrer"
                      className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50
                      transition-colors text-gray-500 hover:text-gray-900"
                      title="Download resume"
                    >
                    <Download className="w-4 h-4" />
                  </a>
                    )}

                  <button
                    onClick={() => setExpanded(expanded === app.id ? null : app.id)}
                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50
                                 transition-colors text-gray-500"
                  >
                    <ChevronDown className={`w-4 h-4 transition-transform ${expanded === app.id ? 'rotate-180' : ''
                      }`} />
                  </button>
                </div>
              </div>

                { expanded === app.id && (
                <div className="border-t border-gray-100 px-5 py-4 bg-gray-50/50">
                  <div className="grid sm:grid-cols-3 gap-4 text-sm">

                    {/* Academic */}
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
                        Academic
                      </p>
                      <div className="space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Branch</span>
                          <span className="font-medium">{app.student?.branch || '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">CGPA</span>
                          <span className="font-medium">{app.student?.cgpa || '—'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Passing year</span>
                          <span className="font-medium">{app.student?.passing_year || '—'}</span>
                        </div>
                      </div>
                    </div>

                    {/* About */}
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
                        About
                      </p>
                      <p className="text-gray-600 text-sm leading-relaxed">
                        {app.student?.about || 'No description provided.'}
                      </p>
                    </div>

                    {/* Skills */}
                    <div>
                      <p className="text-xs text-gray-400 uppercase tracking-wide mb-2">
                        Skills
                      </p>
                      {app.student?.domains?.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {app.student.domains.map(d => (
                            <span key={d}
                              className="text-xs bg-white border border-gray-200
                                           px-2 py-0.5 rounded-full text-gray-700">
                              {d}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-400 text-sm">No skills listed</p>
                      )}
                    </div>

                  </div>

                  {/* Quick actions */}
                  <div className="flex gap-2 mt-4 pt-3 border-t border-gray-100">
                    <a
                    href={`mailto:${app.student?.email}`}
                    className="flex items-center gap-1.5 text-xs text-gray-500
                    hover:text-gray-900 border border-gray-200 rounded-lg
                    px-3 py-1.5 hover:bg-white transition-colors"
                      >
                    <Mail className="w-3.5 h-3.5" />
                    Send email
                  </a>
                  {app.student?.resume_ready && (
                  <a
                  href = {`/files/resumes/resume_${app.student.id}.pdf`}
                  download target="_blank" rel="noreferrer"
                  className="flex items-center gap-1.5 text-xs text-gray-500
                  hover:text-gray-900 border border-gray-200 rounded-lg
                  px-3 py-1.5 hover:bg-white transition-colors"
                  >
                  <Download className="w-3.5 h-3.5" />
                  Download resume
                </a>
              )}
          </div>
                  </div>
                )}

    </div>
  ))
}
          </div >
        )}

      </div >
    </div >
  )
}