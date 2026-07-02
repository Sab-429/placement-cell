import client from "@/api/client"
import Navbar from "@/components/Navbar"
import StatusBadge from "@/components/StatusBadge"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { useParams } from "react-router-dom"


const STATUS_OPTIONS = ['applied', 'shortlisted', 'selected', 'rejected']
export default function ListingApplicants() {
    const { id } = useParams()
    const [apps, setApps] = useState([])
    const [title, setTitle] = useState('')

    useEffect(() => {
        client.get(`/listings/${id}`).then(({data}) => setTitle(data.title))
        client.get(`/listings/${id}/applications`).then(({data}) => setApps(data ?? []))
    }, [id])

    const updateStatus = async (appId, status) => {
        await client.put(`/applications/${appId}/status`, {status})
        setApps((as) => as.map((a) => a.id === appId ? {...a, status} : a))
    }

    return (
        <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 py-8">
          <h1 className="text-xl font-bold mb-1">Applicants</h1>
          <p className="text-gray-500 text-sm mb-6">{title}</p>
  
          {apps.length === 0 ? (
            <p className="text-center text-gray-400 py-16">No applications yet</p>
          ) : (
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500">
                  <tr>{['Student', 'Branch', 'CGPA', 'Applied', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-6 py-3 font-medium">{h}</th>
                  ))}</tr>
                </thead>
                <tbody>
                  {apps.map((app) => (
                    <tr key={app.id} className="border-t border-gray-100 hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <p className="font-medium">{app.student?.name}</p>
                        <p className="text-xs text-gray-400">{app.student?.email}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-500">{app.student?.branch}</td>
                      <td className="px-6 py-4 text-gray-500">{app.student?.cgpa}</td>
                      <td className="px-6 py-4 text-gray-400 text-xs">
                        {new Date(app.applied_at).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4"><StatusBadge status={app.status} /></td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 flex-wrap">
                          {STATUS_OPTIONS.filter(s => s !== app.status).map(s => (
                            <Button key={s} variant="secondary"
                              className="text-xs py-1 px-2.5"
                              onClick={() => updateStatus(app.id, s)}>
                              {s}
                            </Button>
                          ))}
                          {app.student?.resume_ready && (
                            <a
                              href={`files/resumes/resume_${app.student.id}.pdf`}
                              download
                              className="text-xs text-brand-600 hover:underline self-center ml-1"
                            >
                              Resume
                            </a>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    )
}