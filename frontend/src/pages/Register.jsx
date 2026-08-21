import { Briefcase, GraduationCap, Users, Eye, EyeOff, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import client from '../api/client'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'

import { Button } from '@/components/ui/button'
import { Input }  from '@/components/ui/input'
import { Label }  from '@/components/ui/label'
import { useState } from 'react'
import { Link,useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { z } from 'zod'

const schema = z.object({
    name: z.string().min(2, 'Name must be atleats 2 characters'),
    email: z.string().email('Invalid Email address'),
    password: z.string().min(6, 'Password must be atleast 6 characters'),
    domain: z.string().optional(),
})

const ROLES = [
    {
        id: 'student', label: 'student', icon: GraduationCap,
        perks: ['Browse job listings', 'Apply to companies', 'Generate resume', 'Track applications'],
    },
    {
        id: 'recruiter', label: 'Recruiter', icon: Users,
        perks: ['Post job listings', 'view applicants', 'Manage hiring', 'Access talent pool'],
    },
]

export default function Register() {
    const [role, setRole] = useState('student')
    const [showPass, setShowPass] = useState(false)
    const navigate = useNavigate()

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(schema),
    })

    const onSubmit = async (data) => {
        try {
            if (role === 'recruiter' && (!data.domain || data.domain.trim().length < 2)) {
                toast.error('Company domain is required for recruiters')
                return
            }
            const payload = role === 'recruiter'
                ? { name: data.name, email: data.email, password: data.password, domain: data.domain.trim() }
                : { name: data.name, email: data.email, password: data.password }
            await client.post(`/auth/${role}/register`, payload)
            toast.success('Account created')
            navigate(`/login`, { replace: true })
        } catch (err) {
            toast.error(err.response?.data?.error || 'Registration failed')
        }
    }
    const selectedRole = ROLES.find(r => r.id === role)

    return (
        <div className="min-h-screen flex">
            <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-between p-12 text-primary-foreground">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-foreground/20 rounded-xl flex items-center justify-center">
                        <Briefcase className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-xl">PlacementPortal</span>
                </div>
                <div>
                    <h1 className="text-4xl font-bold leading-tight mb-4">
                        Join thousands of students & recruiters
                    </h1>
                    <p className="text-primary-foreground/70 text-lg mb-8">
                        Create your account and start your placement journey today.
                    </p>
                    <div className="space-y-3">
                        {selectedRole?.perks.map((perk) => (
                            <div key={perk} className="flex items-center gap-3">
                                <CheckCircle2 className="w-5 h-5 text-primary-foreground/70 shrink-0" />
                                <span className="text-primary-foreground/80">{perk}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <p className="text-primary-foreground/50 text-sm">
                    © 2025 PlacementPortal. All rights reserved.
                </p>
            </div>

            {/*Right panel*/}
            <div className="flex-1 flex items-center justify-center p-6 bg-muted/30">
                <div className="w-full max-w-md">

                    <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
                        <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
                            <Briefcase className="w-4 h-4 text-primary-foreground" />
                        </div>
                        <span className="font-bold text-xl">PlacementPortal</span>
                    </div>
                    <Card className="shadow-lg border-0">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-2xl">Create account</CardTitle>
                            <CardDescription>Choose your role to get started</CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-5">
                            {/* Role Selector */}

                            <div className="grid grid-cols-2 gap-3">
                                {ROLES.map(({ id, label, icon: Icon }) => (
                                    <button
                                        key={id}
                                        type="button"
                                        onClick={() => setRole(id)}
                                        className={cn(
                                            'flex items-center gap-3 p-4 rounded-xl border-2 transition-all text-left',
                                            role === id
                                                ? 'border-primary bg-primary/5'
                                                : 'border-border hover:border-primary/40'
                                        )}
                                    >
                                        <div className={cn(
                                            'w-10 h-10 rounded-lg flex items-center justify-center shrink-0',
                                            role === id ? 'bg-primary text-primary-foreground' : 'bg-muted'
                                        )}>
                                            <Icon className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className={cn('font-semibold text-sm', role === id ? 'text-primary' : '')}>
                                                {label}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {id === 'student' ? 'Job seeker' : 'Hiring'}
                                            </p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                            {/* Form */}
                            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                                <div className="space-y-1.5">
                                    <Label htmlFor="name">Full name</Label>
                                    <Input
                                        id="name"
                                        placeholder="Rahul Kumar"
                                        {...register('name')}
                                        className={errors.name ? 'border-destructive' : ''}
                                    />
                                    {errors.name && (
                                        <p className="text-xs text-destructive">{errors.name.message}</p>
                                    )}
                                </div>

                                {role === 'recruiter' && (
                                    <div className="space-y-1.5">
                                        <Label htmlFor="domain">Company domain</Label>
                                        <Input
                                            id="domain"
                                            placeholder="example.com"
                                            {...register('domain')}
                                            className={errors.domain ? 'border-destructive' : ''}
                                        />
                                        {errors.domain && (
                                            <p className="text-xs text-destructive">{errors.domain.message}</p>
                                        )}
                                    </div>
                                )}

                                <div className="space-y-1.5">
                                    <Label htmlFor="email">Email</Label>
                                    <Input
                                        id="email"
                                        type="email"
                                        placeholder="you@college.edu"
                                        {...register('email')}
                                        className={errors.email ? 'border-destructive' : ''}
                                    />
                                    {errors.email && (
                                        <p className="text-xs text-destructive">{errors.email.message}</p>
                                    )}
                                </div>

                                <div className="space-y-1.5">
                                    <Label htmlFor="password">Password</Label>
                                    <div className="relative">
                                        <Input
                                            id="password"
                                            type={showPass ? 'text' : 'password'}
                                            placeholder="Min 6 characters"
                                            {...register('password')}
                                            className={cn('pr-10', errors.password ? 'border-destructive' : '')}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPass(!showPass)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        >
                                            {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                        </button>
                                    </div>
                                    {errors.password && (
                                        <p className="text-xs text-destructive">{errors.password.message}</p>
                                    )}
                                </div>

                                <Button type="submit" className="w-full" disabled={isSubmitting}>
                                    {isSubmitting ? 'Creating account...' : 'Create account'}
                                </Button>
                            </form>

                            <p className="text-center text-sm text-muted-foreground">
                                Already have an account?{' '}
                                <Link to="/login" className="text-primary font-medium hover:underline">
                                    Sign in
                                </Link>
                            </p>

                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )

}