import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  LayoutDashboard, Briefcase, User,
  LogOut, GraduationCap, ShieldCheck
} from 'lucide-react'
import useAuthStore from '../store/authStore'
import { cn } from '@/lib/utils'

const NAV_LINKS = {
  student: [
    { to: '/student/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/student/listings',  label: 'Listings',  icon: Briefcase },
    { to: '/student/profile',   label: 'Profile',   icon: User },
  ],
  recruiter: [
    { to: '/recruiter/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/recruiter/listings',  label: 'Listings',  icon: Briefcase },
    { to: '/recruiter/profile',   label: 'Profile',   icon: User },
  ],
  admin: [
    { to: '/admin/dashboard', label: 'Dashboard', icon: ShieldCheck },
  ],
}

const ROLE_BADGE = {
  student:   { label: 'Student',   icon: GraduationCap, class: 'bg-blue-100 text-blue-800'   },
  recruiter: { label: 'Recruiter', icon: Briefcase,     class: 'bg-purple-100 text-purple-800' },
  admin:     { label: 'Admin',     icon: ShieldCheck,   class: 'bg-red-100 text-red-800'      },
}

export default function Navbar() {
  const { role, logout } = useAuthStore()
  const navigate         = useNavigate()
  const { pathname }     = useLocation()
  const links            = NAV_LINKS[role] || []
  const roleMeta         = ROLE_BADGE[role]

  return (
    <nav className="bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">

        {/* Brand */}
        <Link to="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <Briefcase className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="hidden sm:block">PlacementPortal</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          {links.map(({ to, label, icon: Icon }) => {
            const active = pathname.startsWith(to)
            return (
              <Link key={to} to={to}>
                <Button
                  variant={active ? 'secondary' : 'ghost'}
                  size="sm"
                  className="gap-2"
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden md:block">{label}</span>
                </Button>
              </Link>
            )
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {roleMeta && (
            <Badge className={cn('hidden sm:flex gap-1 items-center', roleMeta.class)}>
              <roleMeta.icon className="w-3 h-3" />
              {roleMeta.label}
            </Badge>
          )}
          <Separator orientation="vertical" className="h-6" />
          <Button
            variant="ghost" size="sm"
            onClick={() => { logout(); navigate('/login') }}
            className="gap-2 text-muted-foreground hover:text-destructive"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:block">Sign out</span>
          </Button>
        </div>

      </div>
    </nav>
  )
}