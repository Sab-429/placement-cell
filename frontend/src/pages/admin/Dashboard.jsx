import client from "@/api/client"
import Navbar from "@/components/Navbar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Briefcase, Database, GraduationCap, ShieldCheck, Trash2, Users } from "lucide-react"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState(null)
  const [health, setHealth] = useState(null)
  const [students, setStudents] = useState([])
  const [recruiters, setRecruiters] = useState([])
  const [listings, setListings] = useState([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const [m, h, s, r, l] = await Promise.all([
        client.get("/admin/metrics"),
        client.get("/admin/health"),
        client.get("/admin/students"),
        client.get("/admin/recruiters"),
        client.get("/admin/listings"),
      ])
      setMetrics(m.data)
      setHealth(h.data)
      setStudents(s.data ?? [])
      setRecruiters(r.data ?? [])
      setListings(l.data ?? [])
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to load admin data")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  const remove = async (kind, id) => {
    try {
      if (kind === "student") await client.delete(`/admin/students/${id}`)
      if (kind === "recruiter") await client.delete(`/admin/recruiters/${id}`)
      if (kind === "listing") await client.delete(`/admin/listings/${id}`)
      toast.success("Deleted")
      await load()
    } catch (err) {
      toast.error(err.response?.data?.error || "Delete failed")
    }
  }

  const stats = [
    { label: "Students", value: metrics?.total_students ?? 0, icon: GraduationCap, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Recruiters", value: metrics?.total_recruiters ?? 0, icon: Users, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Listings", value: metrics?.total_listings ?? 0, icon: Briefcase, color: "text-amber-600", bg: "bg-amber-50" },
    { label: "Applications", value: metrics?.total_applications ?? 0, icon: ShieldCheck, color: "text-green-600", bg: "bg-green-50" },
  ]

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Admin dashboard</h1>
            <p className="text-sm text-muted-foreground mt-1">Platform health and user management</p>
          </div>
          <Badge className={health?.database === "ok" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
            <Database className="w-3 h-3 mr-1" />
            DB {health?.database ?? "unknown"}
          </Badge>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Students</CardTitle>
              <CardDescription>Remove accounts if needed</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {students.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>{s.name}</TableCell>
                      <TableCell>{s.email}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => remove("student", s.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Recruiters</CardTitle>
              <CardDescription>Companies on the platform</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {recruiters.map((r) => (
                    <TableRow key={r.id}>
                      <TableCell>{r.name}</TableCell>
                      <TableCell>{r.email}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => remove("recruiter", r.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        <Card className="border-0 shadow-sm">
          <CardHeader>
            <CardTitle className="text-base">Listings</CardTitle>
            <CardDescription>Open postings visible to students</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Company</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {listings.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell>{l.title}</TableCell>
                    <TableCell>{l.recruiter?.name ?? "—"}</TableCell>
                    <TableCell>{l.job_type}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm" onClick={() => remove("listing", l.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
