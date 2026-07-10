import client from "@/api/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import useAuthStore from "@/store/authStore";
import { ArrowRight, Briefcase, Eye, Plus, TrendingUp, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";

export default function RecruiterDashboard() {
    const { userId } = useAuthStore()
    const [ profile, setProfile ] = useState(null)
    const [listings, setListings] = useState([])
    const [ loading, setLoading ] = useState(true)

    useEffect(() => {
        Promise.all([
            client.get(`/recruiter/recruiters/${userId}`),
            client.get(`/listings?company_id=${userId}`),
        ]).then(([p , l]) =>{
            setProfile(p.data)
            setListings(l.data ?? [])
        }).finally(() => setLoading(false))
    }, [userId])

    const totalApps = listings.reduce((s, l) => s + (l.applications_num ?? 0), 0)
    const openCount =  listings.filter(l => l.is_open).length

    const stats = [
        { label: 'Active listings',  value: openCount,       icon: Briefcase,   color: 'text-blue-600',   bg: 'bg-blue-50'   },
        { label: 'Total listings',   value: listings.length, icon: TrendingUp,  color: 'text-purple-600', bg: 'bg-purple-50' },
        { label: 'Total applicants', value: totalApps,       icon: Users,       color: 'text-green-600',  bg: 'bg-green-50'  },
      ]
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
        <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
  
          {/* Banner */}
          <div className="bg-primary rounded-2xl p-6 md:p-8 text-primary-foreground flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">{profile?.name ?? 'Company'}</h1>
              <p className="text-primary-foreground/70 mt-1">{profile?.domain} · {profile?.num_employees} employees</p>
            </div>
            <Link to="/recruiter/listings/create">
              <Button variant="secondary" className="gap-2">
                <Plus className="w-4 h-4" /> Post new listing
              </Button>
            </Link>
          </div>
  
          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stats.map(({ label, value, icon: Icon, color, bg }) => (
              <Card key={label} className="border-0 shadow-sm">
                <CardContent className="p-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{label}</p>
                    <p className="text-3xl font-bold mt-1">{value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-2xl ${bg} flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${color}`} />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
  
          {/* Listings table */}
          <Card className="border-0 shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <div>
                <CardTitle className="text-base">My Listings</CardTitle>
                <CardDescription>Manage your job postings</CardDescription>
              </div>
              <Link to="/recruiter/listings">
                <Button variant="ghost" size="sm" className="gap-1 text-primary">
                  View all <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </Link>
            </CardHeader>
            <CardContent className="p-0">
              {listings.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <Briefcase className="w-12 h-12 mb-3 opacity-30" />
                  <p className="font-medium">No listings yet</p>
                  <Link to="/recruiter/listings/create" className="mt-4">
                    <Button size="sm">Create your first listing</Button>
                  </Link>
                </div>
              ) : (
                <div className="divide-y">
                  {listings.slice(0, 5).map((l) => (
                    <div key={l.id} className="flex items-center justify-between px-6 py-4 hover:bg-muted/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{l.title}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {l.job_type} · {l.applications_num} applicants
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={l.is_open ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}>
                          {l.is_open ? 'Open' : 'Closed'}
                        </Badge>
                        <Link to={`/recruiter/listings/${l.id}/applicants`}>
                          <Button variant="ghost" size="sm" className="gap-1">
                            <Eye className="w-3.5 h-3.5" /> View
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
  
        </div>
      </div>
      )
}