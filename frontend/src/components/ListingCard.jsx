import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Clock, Users, IndianRupee } from 'lucide-react'

export default function ListingCard({ listing }) {
  const navigate = useNavigate()
  const id = listing?.id ?? listing?.ID

  const {
     title, type, job_type,
    salary_min, salary_max,
    experience_years, applications_num, recruiter,
  } = listing

  return (
    <Card
      onClick={() => navigate(`/student/listings/${id}`)}
      className="cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-200 group"
    >
      <CardContent className="p-5">

        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-base group-hover:text-primary transition-colors truncate">
              {title}
            </h3>
            <p className="text-sm text-muted-foreground mt-0.5">{recruiter?.name}</p>
          </div>
          {recruiter?.logo_file_name ? (
            <img
              src={`/files/logos/${recruiter.logo_file_name}`}
              alt={recruiter.name}
              className="w-11 h-11 rounded-xl object-contain border bg-white shrink-0 p-1"
            />
          ) : (
            <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <span className="text-primary font-bold text-sm">
                {recruiter?.name?.[0] ?? 'C'}
              </span>
            </div>
          )}
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mt-3">
          <Badge variant="secondary" className="gap-1">
            <MapPin className="w-3 h-3" />{type}
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Clock className="w-3 h-3" />{job_type}
          </Badge>
          <Badge variant="outline">
            {experience_years === 0 ? 'Fresher' : `${experience_years}+ yrs`}
          </Badge>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t">
          <div className="flex items-center gap-1 text-sm font-semibold text-foreground">
            <IndianRupee className="w-3.5 h-3.5" />
            {salary_min}–{salary_max}
            <span className="font-normal text-muted-foreground ml-0.5">LPA</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Users className="w-3.5 h-3.5" />
            {applications_num} applied
          </div>
        </div>

      </CardContent>
    </Card>
  )
}