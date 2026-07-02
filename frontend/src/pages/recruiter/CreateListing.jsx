import client from "@/api/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const DEFAULT = {
    title: '', type: 'on-site', job_type: 'full-time',
    description: '', salary_min: '', salary_max: '',
    experience_years: 0, vacancies: 1,
    skills: '',   
    expires_at: '',
}
export default function CreateListing() {
    const [form, setForm] = useState(DEFAULT)
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const set = (k)  => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)

        try {
            await client.post('/listings', {
                ...form,
                salary_min: Number(form.salary_min),
                salary_max: Number(form.salary_max),
                experience_years: Number(form.experience_years),
                vacancies: Number(form.vacancies),
                skills: form.skills.split(',').map(s => s.trim()).filter(Boolean),
            })
            navigate('/recruiter/listings')
        } catch (err) {
            setError(err.response?.data?.message || 'Something went wrong')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-2xl mx-auto px-4 py-8">
          <h1 className="text-xl font-bold mb-6">Create new listing</h1>
  
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
  
            <Input label="Job title"    value={form.title}       onChange={set('title')}       required />
            <Input label="Description (supports multiline)" value={form.description} onChange={set('description')} />
  
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Location type</label>
                <select value={form.type} onChange={set('type')}
                  className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none">
                  <option value="on-site">On-site</option>
                  <option value="remote">Remote</option>
                </select>
              </div>
  
              <div className="flex flex-col gap-1">
                <label className="text-sm font-medium text-gray-700">Job type</label>
                <select value={form.job_type} onChange={set('job_type')}
                  className="border border-gray-200 rounded-lg px-3 py-2.5 text-sm outline-none">
                  <option value="full-time">Full-time</option>
                  <option value="internship">Internship</option>
                </select>
              </div>
            </div>
  
            <div className="grid grid-cols-2 gap-4">
              <Input label="Min salary (LPA)" type="number" value={form.salary_min} onChange={set('salary_min')} required />
              <Input label="Max salary (LPA)" type="number" value={form.salary_max} onChange={set('salary_max')} required />
            </div>
  
            <div className="grid grid-cols-2 gap-4">
              <Input label="Experience needed (years)" type="number" value={form.experience_years} onChange={set('experience_years')} />
              <Input label="Vacancies"                 type="number" value={form.vacancies}        onChange={set('vacancies')} />
            </div>
  
            <Input label="Skills (comma-separated)" placeholder="React, Go, PostgreSQL" value={form.skills} onChange={set('skills')} />
            <Input label="Listing expires on" type="datetime-local" value={form.expires_at} onChange={set('expires_at')} />
  
            {error && <p className="text-sm text-red-500">{error}</p>}
  
            <Button type="submit" loading={loading}>Publish listing</Button>
          </form>
        </div>
      </div>
    )
}