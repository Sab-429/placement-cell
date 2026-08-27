import client from "@/api/client";
import useAuthStore from "@/store/authStore";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from '@/components/ui/button'
import StatusBadge from '@/components/StatusBadge'
import { Link } from "react-router-dom";
import { Card, CardContent } from '@/components/ui/card'
import { Briefcase, CheckCircle, XCircle, Clock, Star, ArrowRight, Download, RefreshCw, Bell } from 'lucide-react'
import Navbar from '@/components/Navbar'

export default function StudentDashboard() {
   const { userId } = useAuthStore()
   const [profile, setProfile] = useState(null)
   const [apps, setApps] = useState([])
   const [loading, setLoading] = useState(true)
   const [lastSync, setLastSync] = useState(null)
   const [syncing, setSyncing] = useState(false)

   // ── Fetch all dashboard data ─────────────────────────────────────────
   const fetchData = useCallback(async (silent = false) => {
      if (!userId) return
      if (!silent) setLoading(true)
      else setSyncing(true)

      try {
         const [p, a] = await Promise.all([
            client.get(`/student/students/${userId}`),
            client.get('/student/applications'),
         ])

         setProfile(p.data)

         // Normalize field names — handle both uppercase and lowercase
         const rawApps = a.data ?? []
         const normalized = rawApps.map(app => ({
            ...app,
            id: app.id ?? app.ID,
            status: app.status ?? app.Status ?? 'applied',
            listing: app.listing ?? app.Listing
               ? {
                  ...(app.listing ?? app.Listing),
                  title: (app.listing ?? app.Listing)?.title
                     ?? (app.listing ?? app.Listing)?.Title,
                  recruiter: (app.listing ?? app.Listing)?.recruiter
                     ?? (app.listing ?? app.Listing)?.Recruiter,
               }
               : null,
         }))

         setApps(normalized)
         setLastSync(new Date())
      } catch (err) {
         if (!silent) toast.error('Failed to load dashboard')
         console.error('Dashboard fetch error:', err)
      } finally {
         setLoading(false)
         setSyncing(false)
      }
   }, [userId])

   // ── Initial load ─────────────────────────────────────────────────────
   useEffect(() => {
      fetchData(false)
   }, [fetchData])

   useEffect(() => {
      let active = true
      
      const run = async () => {
        if(active) await fetchData(false)
      }

      run()
      return () => {active = false}
    }, [userId])


   const handleGenerate = async () => {
      try {
         await client.post(`/student/students/${userId}/resume/generate`)
         toast.success('Resume generation queued! Check back in a minute.')
      } catch (err) {
         toast.error('Failed to queue resume generation', err)
      }
   }
   const stats = [
      { label: 'Applied', value: apps.length, icon: Briefcase, color: 'text-blue-600', bg: 'bg-blue-50' },
      { label: 'Shortlisted', value: apps.filter(a => a.Status === 'shortlisted').length, icon: Star, color: 'text-yellow-600', bg: 'bg-yellow-50' },
      { label: 'Selected', value: apps.filter(a => a.Status === 'selected').length, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
      { label: 'Rejected', value: apps.filter(a => a.Status === 'rejected').length, icon: XCircle, color: 'text-red-600', bg: 'bg-red-50' },
   ]

   const handleManualRefresh = () => {
      fetchData(false)
      toast.success('Dashboard refreshed')
    }

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
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">

        {/* Banner */}
        <div className="bg-gray-900 rounded-2xl p-6 md:p-8 text-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">
                Welcome back, {profile?.name?.split(' ')[0] ?? 'Student'} 👋
              </h1>
              <p className="text-white/60 mt-1 text-sm">
                {[
                  profile?.branch,
                  profile?.cgpa > 0 && `CGPA ${profile.cgpa}`,
                  profile?.passing_year && `Class of ${profile.passing_year}`,
                ].filter(Boolean).join(' · ')}
              </p>
              <div className="flex items-center gap-4 mt-3">
                <div className="flex items-center gap-1.5 text-xs text-white/50">
                  <Bell className="w-3.5 h-3.5" />
                  Email alerts when status changes
                </div>
                {lastSync && (
                  <div className="flex items-center gap-1.5 text-xs text-white/40">
                    <Clock className="w-3 h-3" />
                    Synced {lastSync.toLocaleTimeString()}
                    {syncing && (
                      <RefreshCw className="w-3 h-3 animate-spin ml-1" />
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 flex-wrap">
              {profile?.resume_ready && (
                <a href={`/files/gen_resumes/${profile.resume_file_name}`} download>
                  <button className="flex items-center gap-2 bg-white text-gray-900
                                     px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-100">
                    <Download className="w-4 h-4" /> Resume
                  </button>
                </a>
              )}
              <button
                onClick={handleGenerate}
                className="flex items-center gap-2 bg-white/10 border border-white/20
                           text-white px-4 py-2 rounded-lg text-sm font-medium
                           hover:bg-white/20 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                {profile?.resume_ready ? 'Regenerate' : 'Generate Resume'}
              </button>
              <button
                onClick={handleManualRefresh}
                title="Refresh now"
                className="flex items-center gap-2 bg-white/10 border border-white/20
                           text-white px-3 py-2 rounded-lg text-sm hover:bg-white/20"
              >
                <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Stats — recomputed via useMemo when apps changes */}
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

        {/* Applications list */}
        <Card className="border-0 shadow-sm">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h2 className="font-semibold">My Applications</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Auto-refreshes every 30s · {apps.length} total
              </p>
            </div>
            <Link
              to="/student/listings"
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
            >
              Browse more <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {apps.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <Briefcase className="w-12 h-12 mb-3 opacity-30" />
              <p className="font-medium">No applications yet</p>
              <Link to="/student/listings" className="mt-4">
                <Button className="bg-gray-900 text-white px-4 py-2 rounded-lg text-sm">
                  Browse listings
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {apps.map(app => (
                <div
                  key={app.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {app.listing?.title ?? '—'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {app.listing?.recruiter?.name
                        ?? app.listing?.Recruiter?.name
                        ?? '—'}
                    </p>
                  </div>
                  <StatusBadge status={app.status} />
                </div>
              ))}
            </div>
          )}
        </Card>

      </div>
    </div>
  )
}