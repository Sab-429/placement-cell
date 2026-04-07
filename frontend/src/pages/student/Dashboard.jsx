import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import {
  Briefcase, FileText, TrendingUp,
  CheckCircle, XCircle, Clock, Star,
  ArrowRight, Download, RefreshCw
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button }      from '@/components/ui/button'
import { Badge }       from '@/components/ui/badge'
import { Separator }   from '@/components/ui/separator'
import StatusBadge     from '@/components/StatusBadge'
import Navbar          from '@/components/Navbar'

import client      from '../../api/client'
import useAuthStore from '../../store/authStore'

export default function StudentDashboard() {
  const {userId} = useAuthStore()
  const [profile, setProfile] = useState(null)
  const [apps,setApps] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      client.get(`/student/students/${userId}`),
      client.get('/student/applicatons'),
    ]).then(([p, a]) => {
      setProfile(p.data)
      setApps(a.data ?? [])
    }).finally(() => setLoading(false))
  }, [userId])

  const handleGenerate = async () => {
    try {
      await client.post(`/student/students/${userId}/resume/generate`)
      toast.success('Resume generation queued! Check back in a minute.')
    } catch (error) {
      toast.error('Failed to queue resume generation')
    }
  }
  const stats = [
    { label: 'Applied',     value: apps.length,                                           icon: Briefcase,    color: 'text-blue-600',   bg: 'bg-blue-50'   },
    { label: 'Shortlisted', value: apps.filter(a => a.status === 'shortlisted').length,   icon: Star,         color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: 'Selected',    value: apps.filter(a => a.status === 'selected').length,      icon: CheckCircle,  color: 'text-green-600',  bg: 'bg-green-50'  },
    { label: 'Rejected',    value: apps.filter(a => a.status === 'rejected').length,      icon: XCircle,      color: 'text-red-600',    bg: 'bg-red-50'    },
  ]

  if(loading) return (
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

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">

        <div className="bg-primary rounded-2xl p-6 md:p-8 text-primary-foreground">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                Welcome back, {profile?.name?.split(' ')[0] ?? 'Student'} 👋
              </h1>
              <p className="text-primary-foreground/70 mt-1">
                {profile?.branch} · CGPA {profile?.cgpa} · Class of {profile?.passing_year}
              </p>
            </div>
            <div className="flex gap-3 flex-wrap">
              {profile?.resume_ready ? (
                <a href={`/files/resumes/${profile.resume_file_name}`} download>
                  <Button variant="secondary" size="sm" className="gap-2">
                    <Download className="w-4 h-4" />
                    Download Resume
                  </Button>
                </a>
              ) : null}
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerate}
                className="gap-2 bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20"
              >
                <RefreshCw className="w-4 h-4" />
                {profile?.resume_ready ? 'Regenerate' : 'Generate Resume'}
              </Button>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label} className="border-0 shadow-sm">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="text-3xl font-bold mt-1">{value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">

          <div className="lg:col-span-2">
            <Card className="border-0 shadow-sm">
              <CardHeader className="flex flex-row items-center justify-between pb-3">
                <div>
                  <CardTitle className="text-base">Recent Applications</CardTitle>
                  <CardDescription>Track your application statuses</CardDescription>
                </div>
                <Link to="/student/listings">
                  <Button variant="ghost" size="sm" className="gap-1 text-primary">
                    Browse more <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </CardHeader>
              <CardContent className="p-0">
                {apps.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                    <Briefcase className="w-12 h-12 mb-3 opacity-30" />
                    <p className="font-medium">No applications yet</p>
                    <p className="text-sm mt-1">Start browsing listings</p>
                    <Link to="/student/listings" className="mt-4">
                      <Button size="sm">Browse Listings</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="divide-y">
                    {apps.slice(0, 6).map((app) => (
                      <div key={app.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{app.listing?.title}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {app.listing?.recruiter?.name}
                          </p>
                        </div>
                        <StatusBadge status={app.status} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Profile completion */}
          <div>
            <Card className="border-0 shadow-sm">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Profile Completion</CardTitle>
                <CardDescription>Complete your profile to stand out</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: 'Basic info',       done: !!profile?.name && !!profile?.branch },
                  { label: 'Profile photo',    done: !!profile?.pfp_file_name             },
                  { label: 'About section',    done: !!profile?.about                     },
                  { label: 'Resume uploaded',  done: !!profile?.resume_ready              },
                  { label: 'Domains/Skills',   done: (profile?.domains?.length ?? 0) > 0  },
                  { label: 'Work experience',  done: !!profile?.work_experience?.length   },
                ].map(({ label, done }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0
                      ${done ? 'bg-green-100' : 'bg-muted'}`}>
                      {done
                        ? <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                        : <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                      }
                    </div>
                    <span className={`text-sm ${done ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {label}
                    </span>
                  </div>
                ))}
                <Separator className="my-2" />
                <Link to="/student/profile">
                  <Button size="sm" variant="outline" className="w-full">
                    Complete Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  )
}