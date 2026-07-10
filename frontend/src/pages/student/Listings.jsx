import client from "@/api/client";
import { useEffect, useState } from "react";
import Navbar      from '@/components/Navbar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Search, SlidersHorizontal, X } from 'lucide-react'
import { Input }  from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge }  from '@/components/ui/badge'
import ListingCard from '@/components/ListingCard'


export default function Listings() {
    const [listings, setListings] = useState([])
    const [search, setSearch] = useState('')
    const [loading, setLoading] = useState(true)
    const [filters, setFilters] = useState({ job_type: '', type: '', order: 'latest'})

    useEffect(() => {
      const params = new URLSearchParams()
      Object.entries(filters).forEach(([k, v]) => { if (v && v !== 'all') params.set(k, v) })
    
      client.get(`/listings?${params}`)
        .then(({ data }) => {
          // Normalize uppercase ID to lowercase id
          const normalized = (data ?? []).map(l => ({
            ...l,
            id: l.id ?? l.ID,
            recruiter: l.recruiter ? { ...l.recruiter, id: l.recruiter.id ?? l.recruiter.ID } : null,
          }))
          setListings(normalized)
        })
        .finally(() => setLoading(false))
    }, [filters])

    const visible = search
    ? listings.filter(l =>
        l.title?.toLowerCase().includes(search.toLowerCase()) ||
        l.recruiter?.name?.toLowerCase().includes(search.toLowerCase()))
    : listings

    const setFilter = (k, v) => setFilters(f => ({ ...f, [k]: v }))

    const activeFilters = Object.entries(filters).filter(([, v]) => v && v !== 'all' && v !== 'latest')

    return (
        <div className="min-h-screen bg-muted/30">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 py-8">
  
          {/* Header */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Browse Listings</h1>
            <p className="text-muted-foreground mt-1">
              {visible.length} {visible.length === 1 ? 'listing' : 'listings'} found
            </p>
          </div>
  
          {/* Search + filters */}
          <div className="bg-background rounded-xl border p-4 mb-6 space-y-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by job title or company..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
  
            <div className="flex flex-wrap gap-2 items-center">
              <SlidersHorizontal className="w-4 h-4 text-muted-foreground" />
  
              <Select value={filters.job_type || 'all'} onValueChange={v => setFilter('job_type', v === 'all' ? '' : v)}>
                <SelectTrigger className="w-36 h-8 text-xs">
                  <SelectValue placeholder="Job type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="internship">Internship</SelectItem>
                  <SelectItem value="full-time">Full-time</SelectItem>
                </SelectContent>
              </Select>
  
              <Select value={filters.type || 'all'} onValueChange={v => setFilter('type', v === 'all' ? '' : v)}>
                <SelectTrigger className="w-36 h-8 text-xs">
                  <SelectValue placeholder="Location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All locations</SelectItem>
                  <SelectItem value="remote">Remote</SelectItem>
                  <SelectItem value="on-site">On-site</SelectItem>
                </SelectContent>
              </Select>
  
              <Select value={filters.order} onValueChange={v => setFilter('order', v)}>
                <SelectTrigger className="w-32 h-8 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="latest">Latest first</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                </SelectContent>
              </Select>
  
              {/* Active filter pills */}
              {activeFilters.map(([k, v]) => (
                <Badge key={k} variant="secondary" className="gap-1 h-8 px-3">
                  {v}
                  <button onClick={() => setFilter(k, '')}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
  
          {/* Grid */}
          {loading ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="h-48 bg-background rounded-xl border animate-pulse" />
              ))}
            </div>
          ) : visible.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
              <Search className="w-12 h-12 mb-3 opacity-30" />
              <p className="font-medium">No listings found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
              <Button variant="outline" className="mt-4" onClick={() => { setFilters({ job_type: '', type: '', order: 'latest' }); setSearch('') }}>
                Clear all filters
              </Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {visible.map(l => <ListingCard key={l.id} listing={l} />)}
            </div>
          )}
  
        </div>
      </div>
    )
}