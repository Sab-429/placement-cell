import client from "@/api/client"
import Navbar from "@/components/Navbar"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import useAuthStore from "@/store/authStore"
import { zodResolver } from "@hookform/resolvers/zod"
import { Award, Badge, FileText, GraduationCap, Plus, Save, Trash2, Upload, User } from "lucide-react"
import { Label } from "radix-ui"
import { useEffect, useState } from "react"
import { useForm } from 'react-hook-form'
import { toast } from "sonner"
import z from "zod"
const schema = z.object({
    name: z.string().min(2),
    branch: z.string().min(1),
    cgpa: z.coerce.number().min(0).max(10),
    passing_year: z.coerce.number().min(2020).max(2035),
    about: z.string().optional(),
})

export default function StudentProfile() {
    const { userId } = useAuthStore()
    const [profile, setProfile] = useState(null)
    const [domains, setDomains] = useState([])
    const [domainInput, setDomainInput] = useState('')
    const [pfpPreview, setPfpPreview] = useState(null)
    const [saving, setSaving] = useState(false)

    const { register, handleSubmit, reset, formState: { errors } } = useForm({
        resolver: zodResolver(schema)
    })

    useEffect(() => {
        client.get(`/student/students/${userId}`).then(({ data }) => {
            setProfile(data)
            setDomains(data.domains ?? [])
            reset({
                name: data.name ?? '',
                branch: data.branch ?? '',
                cgpa: data.cgpa ?? '',
                passing_year: data.passing_year ?? '',
                about: data.about ?? '',
            })
        })
    }, [reset, userId])

    const onSubmit = async (data) => {
        setSaving(true)
        try {
            await client.put(`/student/students/${userId}`, { ...data, domains })
            toast.success('Profile updated successfully')
        } catch (error) {
            toast.error('Failed to update profile',error)
        } finally {
            setSaving(false)
        }
    }
    const addDomain = () => {
        const d = domainInput.trim()
        if (d && !domains.includes(d)) {
            setDomains([...domains, d])
            setDomainInput('')
        }
    }

    const removeDomain = (d) => setDomains(domains.filter(x => x !== d))

    const handlePFP = async (e) => {
        const file = e.target.files[0]
        if (!file) return
        setPfpPreview(URL.createObjectURL(file))
        const fd = new FormData()
        fd.append('pfp', file)
        try {
            await client.post(`/student/students/${userId}/pfp`, fd)
            toast.success('Profile photo updated!')
        } catch (error) {
            toast.error('Failed to upload photo',error)
        }
    }
    const handleResume = async (e) => {
        const file = e.target.files[0]
        if (!file) return
        if (!file.name.endsWith('.pdf')) { toast.error('Only PDF files allowed'); return }
        const fd = new FormData()
        fd.append('resume', file)
        try {
          await client.post(`/student/students/${userId}/resume`, fd)
          toast.success('Resume uploaded!')
        } catch {
          toast.error('Failed to upload resume')
        }
      }
    const handleGenerate = async () => {
        try {
            await client.post(`/student/students/${userId}/resume/generate`)
            toast.success('Resume generation queued! Check back in a moment.')
        } catch (error) {
            toast.error('Failed to queue resume generation',error)
        }
    }

    return (
        <div className="min-h-screen bg-muted/30">
            <Navbar />
            <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

                <div>
                    <h1 className="text-2xl font-bold">My Profile</h1>
                    <p className="text-muted-foreground mt-1">Keep your profile updated to get the best matches</p>
                </div>

                {/* Profile photo */}
                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <User className="w-4 h-4" /> Profile Photo
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-5">
                            <div className="relative">
                                {pfpPreview || profile?.pfp_file_name ? (
                                    <img
                                        src={pfpPreview || `/files/pfps/${profile.pfp_file_name}`}
                                        alt="Profile"
                                        className="w-20 h-20 rounded-full object-cover border-2 border-border"
                                    />
                                ) : (
                                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center border-2 border-dashed border-border">
                                        <User className="w-8 h-8 text-primary/40" />
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="cursor-pointer">
                                    <Button variant="outline" size="sm" className="gap-2" asChild>
                                        <span>
                                            <Upload className="w-4 h-4" />
                                            Upload photo
                                        </span>
                                    </Button>
                                    <input type="file" accept="image/*" className="hidden" onChange={handlePFP} />
                                </label>
                                <p className="text-xs text-muted-foreground mt-2">JPG or PNG, max 5MB</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Basic info form */}
                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <GraduationCap className="w-4 h-4" /> Academic Information
                        </CardTitle>
                        <CardDescription>Your basic profile details</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                            <div className="grid sm:grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <Label>Full Name</Label>
                                    <Input placeholder="Rahul Kumar" {...register('name')} />
                                    {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Branch</Label>
                                    <Input placeholder="Computer Science" {...register('branch')} />
                                    {errors.branch && <p className="text-xs text-destructive">{errors.branch.message}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <Label>CGPA</Label>
                                    <Input type="number" step="0.01" min="0" max="10" placeholder="8.5" {...register('cgpa')} />
                                    {errors.cgpa && <p className="text-xs text-destructive">{errors.cgpa.message}</p>}
                                </div>
                                <div className="space-y-1.5">
                                    <Label>Passing Year</Label>
                                    <Input type="number" placeholder="2025" {...register('passing_year')} />
                                    {errors.passing_year && <p className="text-xs text-destructive">{errors.passing_year.message}</p>}
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <Label>About</Label>
                                <textarea
                                    rows={4}
                                    placeholder="Tell recruiters about yourself..."
                                    {...register('about')}
                                    className="w-full border border-input rounded-lg px-3 py-2.5 text-sm outline-none
                               focus:border-ring focus:ring-2 focus:ring-ring/20 resize-none bg-background"
                                />
                            </div>

                            {/* Domains */}
                            <div className="space-y-2">
                                <Label>Skills & Domains</Label>
                                <div className="flex gap-2">
                                    <Input
                                        placeholder="e.g. React, Go, Machine Learning"
                                        value={domainInput}
                                        onChange={e => setDomainInput(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addDomain())}
                                    />
                                    <Button type="button" variant="outline" onClick={addDomain}>
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                                {domains.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {domains.map(d => (
                                            <Badge key={d} variant="secondary" className="gap-1.5 pl-3">
                                                {d}
                                                <button type="button" onClick={() => removeDomain(d)}
                                                    className="hover:text-destructive transition-colors">
                                                    <Trash2 className="w-3 h-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <Button type="submit" disabled={saving} className="gap-2">
                                <Save className="w-4 h-4" />
                                {saving ? 'Saving...' : 'Save changes'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Resume section */}
                <Card className="border-0 shadow-sm">
                    <CardHeader>
                        <CardTitle className="text-base flex items-center gap-2">
                            <FileText className="w-4 h-4" /> Resume
                        </CardTitle>
                        <CardDescription>Upload your own or generate one from your profile</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex flex-wrap gap-3">
                            <label className="cursor-pointer">
                                <Button variant="outline" className="gap-2" asChild>
                                    <span><Upload className="w-4 h-4" /> Upload PDF</span>
                                </Button>
                                <input type="file" accept=".pdf" className="hidden" onChange={handleResume} />
                            </label>

                            <Button variant="outline" className="gap-2" onClick={handleGenerate}>
                                <Award className="w-4 h-4" />
                                Generate from profile
                            </Button>

                            {profile?.resume_ready && (
                                <a href={`/files/resumes/${profile.resume_file_name}`} download>
                                    <Button className="gap-2">
                                        <FileText className="w-4 h-4" /> Download resume
                                    </Button>
                                </a>
                            )}
                        </div>

                        {profile?.resume_ready ? (
                            <div className="flex items-center gap-2 text-sm text-green-600 bg-green-50 px-4 py-3 rounded-lg">
                                <Award className="w-4 h-4" />
                                Resume is ready — {profile.resume_file_name}
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-3 rounded-lg">
                                <FileText className="w-4 h-4" />
                                No resume uploaded yet
                            </div>
                        )}
                    </CardContent>
                </Card>

            </div>
        </div>
    )
}