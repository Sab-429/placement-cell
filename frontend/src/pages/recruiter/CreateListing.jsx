import client from "@/api/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Briefcase, Plus, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const DEFAULT = {
  title: '',
  type: 'on-site',
  job_type: 'full-time',
  description: '',
  salary_min: '',
  salary_max: '',
  experience_years: 0,
  vacancies: 1,
  expires_at: '',
}
export default function CreateListing() {
  const [form, setForm] = useState(DEFAULT)
  const [skills, setSkills] = useState([])
  const [skillInput, setSkillInput] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const addSkill = () => {
    const s = skillInput.trim()
    if (s && !skills.includes(s)) {
      setSkills([...skills, s])
      setSkillInput('')
    }
  }
  const removeSkill = (s) => setSkills(skills.filter(x => x !== s))
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!form.title) { setError('Job title is required'); return }
    if (!form.description) { setError('Description is required'); return }
    if (!form.salary_min) { setError('Min salary is required'); return }
    if (!form.salary_max) { setError('Max salary is required'); return }
    if (!form.expires_at) { setError('Expiry date is required'); return }
    if (Number(form.salary_max) < Number(form.salary_min)) {
      setError('Max salary must be greater than min salary')
      return
    }
    setLoading(true)
    try {
      await client.post('recruiter/listings', {
        title: form.title,
        type: form.type,
        job_type: form.job_type,
        description: form.description,
        salary_min: Number(form.salary_min),
        salary_max: Number(form.salary_max),
        experience_years: Number(form.experience_years),
        vacancies: Number(form.vacancies),
        expires_at: form.expires_at ? form.expires_at + ':00Z' : '',
        skills: skills,
      })
      toast.success('Listing published successfully!')
      navigate('/recruiter/listings')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to create listing')
      toast.error(err.response?.data?.error || 'Failed to create listing')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <Navbar />
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">

        <div className="flex items-center gap-3">
          <Button
            variant="ghost" size="sm"
            onClick={() => navigate('/recruiter/listings')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Post a Listing</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Fill in the details to attract the right candidates
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> Job Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">

      
              <div className="space-y-1.5">
                <Label htmlFor="title">Job Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g. Backend Developer, Data Analyst"
                  value={form.title}
                  onChange={set('title')}
                />
              </div>

             
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label>Location Type *</Label>
                  <select
                    value={form.type}
                    onChange={set('type')}
                    className="w-full border border-input rounded-lg px-3 py-2.5 text-sm
                               outline-none focus:border-ring focus:ring-2 focus:ring-ring/20
                               bg-background"
                  >
                    <option value="on-site">On-site</option>
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <Label>Job Type *</Label>
                  <select
                    value={form.job_type}
                    onChange={set('job_type')}
                    className="w-full border border-input rounded-lg px-3 py-2.5 text-sm
                               outline-none focus:border-ring focus:ring-2 focus:ring-ring/20
                               bg-background"
                  >
                    <option value="full-time">Full-time</option>
                    <option value="internship">Internship</option>
                    <option value="part-time">Part-time</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="description">Description *</Label>
                <textarea
                  id="description"
                  rows={5}
                  placeholder="Describe the role, responsibilities, and what you're looking for..."
                  value={form.description}
                  onChange={set('description')}
                  className="w-full border border-input rounded-lg px-3 py-2.5 text-sm
                             outline-none focus:border-ring focus:ring-2 focus:ring-ring/20
                             resize-none bg-background"
                />
              </div>

            </CardContent>
          </Card>

          {/* Compensation */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Compensation &amp; Requirements</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="salary_min">Min Salary (LPA) *</Label>
                  <Input
                    id="salary_min"
                    type="number"
                    placeholder="5"
                    min="0"
                    value={form.salary_min}
                    onChange={set('salary_min')}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="salary_max">Max Salary (LPA) *</Label>
                  <Input
                    id="salary_max"
                    type="number"
                    placeholder="12"
                    min="0"
                    value={form.salary_max}
                    onChange={set('salary_max')}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="experience_years">Experience Needed (years)</Label>
                  <Input
                    id="experience_years"
                    type="number"
                    placeholder="0 for fresher"
                    min="0"
                    value={form.experience_years}
                    onChange={set('experience_years')}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="vacancies">Number of Vacancies *</Label>
                  <Input
                    id="vacancies"
                    type="number"
                    placeholder="3"
                    min="1"
                    value={form.vacancies}
                    onChange={set('vacancies')}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="expires_at">Application Deadline *</Label>
                <Input
                  id="expires_at"
                  type="datetime-local"
                  value={form.expires_at}
                  onChange={set('expires_at')}
                />
              </div>

            </CardContent>
          </Card>

          {/* Skills */}
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle className="text-base">Required Skills</CardTitle>
              <CardDescription>Add skills candidates should have</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="e.g. React, Go, PostgreSQL"
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      addSkill()
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={addSkill}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>

              {skills.length > 0 && (
                <div className="flex flex-wrap gap-2 p-3 bg-muted/40 rounded-lg border border-dashed">
                  <p className="w-full text-xs text-muted-foreground mb-1">
                    {skills.length} skill{skills.length > 1 ? 's' : ''} added
                  </p>
                  {skills.map(s => (
                    <Badge key={s} variant="secondary" className="gap-1.5 pl-3">
                      {s}
                      <button
                        type="button"
                        onClick={() => removeSkill(s)}
                        className="hover:text-destructive transition-colors"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}

              {skills.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Press Enter or click + to add a skill
                </p>
              )}
            </CardContent>
          </Card>

          {/* Error */}
          {error && (
            <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20
                            rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="flex gap-3">
            <Button type="submit" disabled={loading} className="gap-2 flex-1 sm:flex-none">
              <Briefcase className="w-4 h-4" />
              {loading ? 'Publishing...' : 'Publish listing'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/recruiter/listings')}
            >
              Cancel
            </Button>
          </div>

        </form>
      </div>
    </div>
  )
}