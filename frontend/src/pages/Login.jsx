import client from "@/api/client";
import useAuthStore from "@/store/authStore";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import z from "zod";
import { Button }   from '@/components/ui/button'
import { Input }    from '@/components/ui/input'
import { Label }    from '@/components/ui/label'
import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Briefcase, GraduationCap, Users, ShieldCheck, Eye, EyeOff } from 'lucide-react'

const schema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
})

const ROLES = [
    { id: 'student', label: 'Student', icon: GraduationCap, desc: 'Find jobs & internships' },
    { id: 'recruiter', label: 'Recruiter', icon: Users, desc: 'Post & manage listings' },
    { id: 'admin', label: 'Admin', icon: ShieldCheck, desc: 'Manage the platform' },
]
export default function Login() {
    const [role, setRole] = useState('student')
    const [showPass, setShowPass] = useState(false)
    const { login } = useAuthStore()
    const navigate = useNavigate()

    const { register, handlesubmit, formState: { errors, isSubmitting } } = useForm({
        resolver: zodResolver(schema),
    })

    const onSubmit = async (data) => {
        try {
            const res = await client.post(`/auth/${role}/login`, data)
            login(res.data.token, res.data.role, res.data.user_id)
            toast.success(`Welcome back!`)
            navigate(`/${res.data.role}/dashboard`, { replace: true })
        } catch (err) {
            toast.error(err.response?.data?.error || 'Login failed')
        }
    }
    return (
        <div className="min-h-screen flex">

            {/* Left panel */}
            <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-between p-12 text-primary-foreground">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-foreground/20 rounded-xl flex items-center justify-center">
                        <Briefcase className="w-5 h-5" />
                    </div>
                    <span className="font-bold text-xl">PlacementPortal</span>
                </div>

                <div>
                    <h1 className="text-4xl font-bold leading-tight mb-4">
                        Your career journey starts here
                    </h1>
                    <p className="text-primary-foreground/70 text-lg">
                        Connect students with top recruiters. Streamline placements and internships for your college.
                    </p>

                    <div className="mt-10 grid grid-cols-3 gap-4">
                        {[
                            { value: '500+', label: 'Companies' },
                            { value: '10k+', label: 'Students' },
                            { value: '2k+', label: 'Placed' },
                        ].map(({ value, label }) => (
                            <div key={label} className="bg-primary-foreground/10 rounded-2xl p-4 text-center">
                                <p className="text-2xl font-bold">{value}</p>
                                <p className="text-sm text-primary-foreground/70">{label}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <p className="text-primary-foreground/50 text-sm">
                    © 2025 PlacementPortal. All rights reserved.
                </p>
            </div>

            {/* Right panel */}
            <div className="flex-1 flex items-center justify-center p-6 bg-muted/30">
                <div className="w-full max-w-md">

                    {/* Mobile brand */}
                    <div className="lg:hidden flex items-center gap-2 mb-8 justify-center">
                        <div className="w-9 h-9 bg-primary rounded-xl flex items-center justify-center">
                            <Briefcase className="w-4 h-4 text-primary-foreground" />
                        </div>
                        <span className="font-bold text-xl">PlacementPortal</span>
                    </div>

                    <Card className="shadow-lg border-0">
                        <CardHeader className="pb-4">
                            <CardTitle className="text-2xl">Sign in</CardTitle>
                            <CardDescription>Choose your role to continue</CardDescription>
                        </CardHeader>

                        <CardContent className="space-y-5">

                            {/* Role selector */}
                            <div className="grid grid-cols-3 gap-2">
                                {ROLES.map(({ id, label, icon: Icon, desc }) => (
                                    <button
                                        key={id}
                                        type="button"
                                        onClick={() => setRole(id)}
                                        className={cn(
                                            'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center',
                                            role === id
                                                ? 'border-primary bg-primary/5 text-primary'
                                                : 'border-border hover:border-primary/40 text-muted-foreground hover:text-foreground'
                                        )}
                                    >
                                        <Icon className="w-5 h-5" />
                                        <span className="text-xs font-semibold">{label}</span>
                                        <span className="text-[10px] leading-tight hidden sm:block">{desc}</span>
                                    </button>
                                ))}
                            </div>

                            {/* Form */}
                            <form onSubmit={handlesubmit(onSubmit)} className="space-y-4">
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
                                            placeholder="••••••••"
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
                                    {isSubmitting ? 'Signing in...' : 'Sign in'}
                                </Button>
                            </form>

                            {role !== 'admin' && (
                                <p className="text-center text-sm text-muted-foreground">
                                    Don&apos;t have an account?{' '}
                                    <Link to="/register" className="text-primary font-medium hover:underline">
                                        Register
                                    </Link>
                                </p>
                            )}

                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}