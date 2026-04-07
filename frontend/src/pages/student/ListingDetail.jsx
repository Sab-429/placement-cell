import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import {
  MapPin, Clock, IndianRupee, Users,
  Briefcase, Calendar, ArrowLeft, Send
} from 'lucide-react'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button }      from '@/components/ui/button'
import { Badge }       from '@/components/ui/badge'
import { Separator }   from '@/components/ui/separator'
import StatusBadge     from '@/components/StatusBadge'
import Navbar          from '@/components/Navbar'

import client from '../../api/client'

export default function ListingDetail() {
  const { id }     = useParams()
  const navigate   = useNavigate()
  const [listing,   setListing]   = useState(null)
  const [appStatus, setAppStatus] = useState(null)
  const [applying,  setApplying]  = useState(false)
  const [loading,   setLoading]   = useState(true)

  useEffect(() => {
    Promise.all([
      client.get(`/listings/${id}`),
      client.get(`/student/listings/${id}/status`).catch(() => null),
    ]).then(([l, s]) => {
      setListing(l.data)
      if (s) setAppStatus(s.data.status)
    }).finally(() => setLoading(false))
  }, [id])

  const handleApply = async () => {
    setApplying(true)
    try {
      await client.post(`/student/listings/${id}/apply`)
      setAppStatus('applied')
      toast.success('Application submitted successfully!')
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to apply')
    } finally {
      setApplying(false)
    }
  }

  if (loading) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    </div>
  )

  if (!listing) return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
        <Briefcase className="w-16 h-16 mb-4 opacity-30" />
        <p className="font-medium text-lg">Listing not found</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate('/student/listings')}>
          Back to listings
        </Button>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

        {/* Back button */}
        <Button variant="ghost" size="sm" className="gap-2 -ml-2"
          onClick={() => navigate('/student/listings')}>
          <ArrowLeft className="w-4 h-4" /> Back to listings
        </Button>

        {/* Header card */}
        <Card className="border-0 shadow-sm">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-start gap-4 flex-1 min-w-0">
                {/* Company logo or initial */}
                {listing.recruiter?.logo_file_name ? (
                  <img
                    src={`/files/logos/${listing.recruiter.logo_file_name}`}
                    alt="logo"
                    className="w-16 h-16 rounded-2xl object-contain border bg-white p-1.5 flex-shrink-0"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-primary font-bold text-2xl">
                      {listing.recruiter?.name?.[0] ?? 'C'}
                    </span>
                  </div>
                )}

                <div className="min-w-0">
                  <h1 className="text-2xl font-bold truncate">{listing.title}</h1>
                  <p className="text-muted-foreground mt-1">{listing.recruiter?.name}</p>

                  {/* Meta pills */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Badge variant="secondary" className="gap-1">
                      <MapPin className="w-3 h-3" />{listing.type}
                    </Badge>
                    <Badge variant="secondary" className="gap-1">
                      <Clock className="w-3 h-3" />{listing.job_type}
                    </Badge>
                    <Badge variant="outline">
                      {listing.experience_years === 0 ? 'Fresher' : `${listing.experience_years}+ yrs exp`}
                    </Badge>
                    <Badge variant="outline" className="gap-1">
                      <Users className="w-3 h-3" />{listing.applications_num} applied
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <Separator className="my-5" />

            {/* Salary + CTA */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-1 text-2xl font-bold">
                <IndianRupee className="w-5 h-5 text-muted-foreground" />
                {listing.salary_min}–{listing.salary_max}
                <span className="text-base font-normal text-muted-foreground ml-1">LPA</span>
              </div>

              <div className="flex items-center gap-3">
                {appStatus ? (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">Your status:</span>
                    <StatusBadge status={appStatus} />
                  </div>
                ) : (
                  <Button onClick={handleApply} disabled={applying} className="gap-2 px-6">
                    <Send className="w-4 h-4" />
                    {applying ? 'Applying...' : 'Apply now'}
                  </Button>
                )}
              </div>
            </div>

            {/* Expires */}
            {listing.expires_at && (
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-3">
                <Calendar className="w-3 h-3" />
                Closes on {new Date(listing.expires_at).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'long', year: 'numeric'
                })}
              </p>
            )}
          </CardContent>
        </Card>

        <div className="grid md:grid-cols-3 gap-6">

          {/* Description */}
          <div className="md:col-span-2 space-y-4">
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">Job Description</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-line leading-relaxed">
                  {listing.description || 'No description provided.'}
                </p>
              </CardContent>
            </Card>

            {/* Skills */}
            {listing.skills?.length > 0 && (
              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Required Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {listing.skills.map(s => (
                      <Badge key={s} variant="secondary" className="px-3 py-1">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div>
            <Card className="border-0 shadow-sm">
              <CardHeader>
                <CardTitle className="text-base">About the Company</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Company</p>
                  <p className="font-medium">{listing.recruiter?.name}</p>
                </div>
                {listing.recruiter?.domain && (
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Industry</p>
                    <p className="font-medium">{listing.recruiter.domain}</p>
                  </div>
                )}
                {listing.recruiter?.num_employees > 0 && (
                  <div>
                    <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Size</p>
                    <p className="font-medium">{listing.recruiter.num_employees} employees</p>
                  </div>
                )}
                <Separator />
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Vacancies</p>
                  <p className="font-medium">{listing.vacancies} positions</p>
                </div>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
    </div>
  )
}