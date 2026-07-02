import client from "@/api/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import useAuthStore from "@/store/authStore";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function MyListings() {
    const { userId } = useAuthStore()
    const [listings, setListings] = useState([])

    useEffect(() => {
        client.get(`/listings?company_id=${userId}`).then(({data}) => setListings(data ?? []))
    }, [userId])

    const toggleOpen = async (listings) => {
        await client.put(`/listings/${listings.id}`, {is_open: !listings.is_open})
        setListings((ls) => ls.map((l) => l.id === listings.id ? {...l, is_open: !l.is_open} : l))
    }

    return (
        <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl font-bold">My Listings</h1>
            <Link to="/recruiter/listings/create"
              className="text-sm bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800">
              + New listing
            </Link>
          </div>
  
          <div className="space-y-3">
            {listings.map((l) => (
              <div key={l.id}
                className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between gap-4">
                <div>
                  <p className="font-semibold">{l.title}</p>
                  <p className="text-sm text-gray-500 mt-0.5">{l.job_type} · {l.type} · {l.applications_num} applicants</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium
                    ${l.is_open ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {l.is_open ? 'Open' : 'Closed'}
                  </span>
                  <Button variant="secondary" className="text-xs py-1.5 px-3"
                    onClick={() => toggleOpen(l)}>
                    {l.is_open ? 'Close' : 'Reopen'}
                  </Button>
                  <Link to={`/recruiter/listings/${l.id}/applicants`}
                    className="text-xs text-brand-600 hover:underline">
                    Applicants
                  </Link>
                </div>
              </div>
            ))}
            {listings.length === 0 && (
              <p className="text-center text-gray-400 py-16">No listings yet</p>
            )}
          </div>
        </div>
      </div>
    )
}