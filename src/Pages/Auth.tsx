'use client';

import React, { useState } from 'react';
import { Mail, Lock, User, Building2, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, ArrowRight, Shield, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button'; 
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

type UserRole = 'MANAGER' | 'SUPERVISOR' | 'OPERATOR';

interface FormErrors {
    email?: string;
    password?: string;
    name?: string;
    organizationCode?: string;
    role?: string;
    general?: string;
}

interface AuthFormData {
    email: string;
    password: string;
    name?: string;
    organizationCode?: string;
    role: UserRole;
}

interface RoleOption {
    value: UserRole;
    label: string;
    icon: React.ReactNode;
    description: string;
    color: string;
    requiresGmail: boolean;
}

const ROLE_OPTIONS: RoleOption[] = [
    {
        value: 'MANAGER',
        label: 'Manager',
        icon: <Shield className="w-5 h-5" />,
        description: 'Full access & control',
        color: 'from-purple-500 to-purple-700',
        requiresGmail: false,
    },
    {
        value: 'SUPERVISOR',
        label: 'Supervisor',
        icon: <Users className="w-5 h-5" />,
        description: 'Team management',
        color: 'from-purple-400 to-purple-600',
        requiresGmail: false,
    },
    {
        value: 'OPERATOR',
        label: 'Operator',
        icon: <Zap className="w-5 h-5" />,
        description: 'Basic operations',
        color: 'from-purple-300 to-purple-500',
        requiresGmail: true,
    },
];

const AuthPage: React.FC = () => {
    const [isSignUp, setIsSignUp] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [errors, setErrors] = useState<FormErrors>({});
    const [animateForm, setAnimateForm] = useState(false);

    const [formData, setFormData] = useState<AuthFormData>({
        email: '',
        password: '',
        name: '',
        organizationCode: '',
        role: 'OPERATOR',
    });

    const baseUrl = 'https://ai-execution.onrender.com';

    const validateEmail = (email: string, role: UserRole): string | undefined => {
        if (!email) {
            return 'Email is required';
        }
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            return 'Please enter a valid email';
        }

        const selectedRole = ROLE_OPTIONS.find(r => r.value === role);
        if (selectedRole?.requiresGmail && !email.endsWith('@gmail.com')) {
            return `${role} accounts must use a @gmail.com email address`;
        }

        return undefined;
    };

    const validateForm = (): boolean => {
        const newErrors: FormErrors = {};

        const emailError = validateEmail(formData.email, formData.role);
        if (emailError) {
            newErrors.email = emailError;
        }

        if (!formData.password) {
            newErrors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Password must be at least 6 characters';
        }

        if (!formData.role) {
            newErrors.role = 'Please select a role';
        }

        if (isSignUp) {
            if (!formData.name) {
                newErrors.name = 'Name is required';
            }
            if (!formData.organizationCode) {
                newErrors.organizationCode = 'Organization code is required';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleInputChange = (field: keyof AuthFormData, value: string | UserRole) => {
        setFormData(prev => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: undefined }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) return;

        setIsLoading(true);
        setSuccess(false);

        try {
            const endpoint = isSignUp ? '/api/auth/register' : '/api/auth/login';
            const payload = isSignUp
                ? {
                    email: formData.email,
                    password: formData.password,
                    name: formData.name,
                    role: formData.role,
                    organizationCode: formData.organizationCode,
                }
                : {
                    email: formData.email,
                    password: formData.password,
                    role: formData.role,
                    organizationCode: formData.organizationCode,
                };

            const response = await fetch(`${baseUrl}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (!response.ok) {
                setErrors({
                    general: data.message || 'An error occurred. Please try again.',
                });
                return;
            }

            if (data?.data?.token) {
                localStorage.setItem('token', data.data.token);
                localStorage.setItem('userRole', formData.role);
                setSuccess(true);
                setFormData({
                    email: '',
                    password: '',
                    name: '',
                    organizationCode: '',
                    role: 'OPERATOR',
                });
                setTimeout(() => {
                    window.location.href = '/dashboard';
                }, 1500);
            }
        } catch (error) {
            setErrors({
                general: error instanceof Error ? error.message : 'Network error. Please check your connection.',
            });
        } finally {
            setIsLoading(false);
        }
    };

    const toggleAuthMode = () => {
        setIsSignUp(!isSignUp);
        setAnimateForm(true);
        setErrors({});
        setFormData({
            email: '',
            password: '',
            name: '',
            organizationCode: '',
            role: 'OPERATOR',
        });
        setTimeout(() => setAnimateForm(false), 300);
    };

    return (
        <div className="min-h-screen w-full flex bg-slate-50 relative overflow-hidden">
            {/* Advanced Animated Background */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {/* Grid Pattern */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

                {/* Dynamic Gradient Blobs */}
                <div className="absolute top-0 left-0 w-[1000px] h-[1000px] bg-purple-200/20 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 animate-pulse" style={{ animationDuration: '8s' }}></div>
                <div className="absolute bottom-0 right-0 w-[800px] h-[800px] bg-orange-200/20 rounded-full blur-3xl translate-x-1/3 translate-y-1/3 animate-pulse" style={{ animationDuration: '10s', animationDelay: '1s' }}></div>
            </div>

            {/* Left Side - Branding & Features (Increased Size) */}
            <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-16 relative z-10 bg-white/40 backdrop-blur-sm border-r border-white/20">
                {/* Logo */}
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#AD03DE] to-orange-500 flex items-center justify-center shadow-xl transform hover:scale-105 transition-transform duration-300">
                        <Building2 className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 tracking-tight">EXECINT</h2>
                        <p className="text-sm font-medium text-gray-600 tracking-wide uppercase">Enterprise Intelligence</p>
                    </div>
                </div>

                {/* Features (Larger Typography) */}
                <div className="space-y-10">
                    <div className="space-y-4">
                        <h3 className="text-5xl font-extrabold text-gray-900 leading-tight">
                            Powering <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#AD03DE] to-orange-500">
                                Execution Intelligence
                            </span>
                        </h3>
                        <p className="text-lg text-gray-600 max-w-md leading-relaxed">
                            Secure, role-based access for Managers, Supervisors, and Operators.
                            Drive efficiency with real-time insights.
                        </p>
                    </div>

                    {/* Role Feature Cards (Larger) */}
                    <div className="space-y-4">
                        {ROLE_OPTIONS.map((role) => (
                            <div
                                key={role.value}
                                className="group p-6 rounded-2xl bg-white/60 border border-white/50 shadow-sm hover:shadow-lg hover:bg-white transition-all duration-300 transform hover:-translate-y-1"
                            >
                                <div className="flex items-center gap-5">
                                    <div className={`p-4 rounded-xl bg-gradient-to-br ${role.color} text-white shadow-md group-hover:scale-110 transition-transform`}>
                                        {role.icon}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-gray-900 font-bold text-lg">{role.label}</p>
                                        <p className="text-gray-500 text-sm">{role.description}</p>
                                    </div>
                                    <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-[#AD03DE] transition-colors opacity-0 group-hover:opacity-100" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Footer */}
                <div>
                    <div className="flex gap-6 text-sm text-gray-500 font-medium">
                        <span>© 2026 ExecInt</span>
                        <a href="#" className="hover:text-purple-600 transition-colors">Privacy Policy</a>
                        <a href="#" className="hover:text-purple-600 transition-colors">Terms of Service</a>
                    </div>
                </div>
            </div>

            {/* Right Side - Form */}
            <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-20 relative z-10">
                <div className="w-full max-w-[480px] bg-white/80 backdrop-blur-md p-8 rounded-3xl shadow-2xl border border-white/50">
                    {/* Mobile Header */}
                    <div className="lg:hidden mb-10 text-center">
                        <div className="flex justify-center mb-6">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#AD03DE] to-orange-500 flex items-center justify-center shadow-lg">
                                <Building2 className="w-7 h-7 text-white" />
                            </div>
                        </div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            {isSignUp ? 'Request Access' : 'Access Portal'}
                        </h1>
                        <p className="text-gray-600 text-base mt-2">
                            {isSignUp ? 'Join the platform' : 'Secure Log In'}
                        </p>
                    </div>

                    {/* Desktop Header */}
                    <div className="hidden lg:block mb-10">
                        <h1 className="text-4xl font-bold text-gray-900 mb-3 tracking-tight">
                            {isSignUp ? 'Request Access' : 'Access Intelligence Portal'}
                        </h1>
                        <p className="text-gray-600 text-base">
                            {isSignUp ? 'Create your profile to get started.' : 'Welcome back. Please enter your details.'}
                        </p>
                    </div>

                    {/* Success Message */}
                    {success && (
                        <div className="mb-8 p-4 rounded-xl bg-green-50 border border-green-200 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                            <CheckCircle2 className="w-6 h-6 text-green-600" />
                            <div className="flex-1">
                                <p className="text-green-900 font-bold text-sm">
                                    {isSignUp ? 'Account created!' : 'Authentication Successful'}
                                </p>
                                <p className="text-green-700 text-xs mt-1">Redirecting to dashboard...</p>
                            </div>
                        </div>
                    )}

                    {/* Error Message */}
                    {errors.general && (
                        <div className="mb-8 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                            <AlertCircle className="w-6 h-6 text-red-600" />
                            <p className="text-red-700 text-sm font-medium flex-1">{errors.general}</p>
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} className={cn('space-y-6', animateForm && 'opacity-50 transition-opacity duration-300')}>
                        {/* Role Selection */}
                        <div className="space-y-3">
                            <Label className="text-gray-700 text-sm font-semibold uppercase tracking-wide">Select User Role</Label>
                            <div className="grid grid-cols-3 gap-3">
                                {ROLE_OPTIONS.map((role) => (
                                    <button
                                        key={role.value}
                                        type="button"
                                        onClick={() => handleInputChange('role', role.value)}
                                        className={cn(
                                            'p-3 rounded-xl border-2 transition-all duration-200 text-center relative overflow-hidden',
                                            formData.role === role.value
                                                ? 'border-[#AD03DE] bg-purple-50/50 shadow-md scale-[1.02]'
                                                : 'border-slate-100 bg-white hover:border-purple-200 hover:shadow-sm'
                                        )}
                                    >
                                        <div className={cn(
                                            'mx-auto w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all',
                                            formData.role === role.value
                                                ? `bg-gradient-to-br ${role.color} text-white`
                                                : 'bg-gray-100 text-gray-400'
                                        )}>
                                            {role.icon}
                                        </div>
                                        <p className={cn(
                                            'text-xs font-bold',
                                            formData.role === role.value ? 'text-gray-900' : 'text-gray-500'
                                        )}>
                                            {role.label}
                                        </p>
                                    </button>
                                ))}
                            </div>
                            {errors.role && (
                                <p className="text-red-600 text-xs mt-2 flex items-center gap-1 font-medium">
                                    <AlertCircle className="w-3 h-3" /> {errors.role}
                                </p>
                            )}
                        </div>

                        {/* Name Field (Signup only) */}
                        {isSignUp && (
                            <div className="space-y-2">
                                <Label htmlFor="name" className="text-gray-700 text-sm font-semibold">
                                    Full Name
                                </Label>
                                <div className="relative group">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#AD03DE] transition-colors" />
                                    <Input
                                        id="name"
                                        placeholder="John Doe"
                                        value={formData.name}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        className={cn(
                                            'pl-12 h-12 bg-gray-50/50 border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-xl transition-all',
                                            'focus:bg-white focus:border-[#AD03DE] focus:ring-4 focus:ring-purple-100',
                                            errors.name && 'border-red-300 focus:border-red-500 focus:ring-red-100'
                                        )}
                                        disabled={isLoading}
                                    />
                                </div>
                                {errors.name && (
                                    <p className="text-red-600 text-xs mt-1 flex items-center gap-1 font-medium">
                                        <AlertCircle className="w-3 h-3" /> {errors.name}
                                    </p>
                                )}
                            </div>
                        )}

                        {/* Organization Code Field */}
                        <div className="space-y-2">
                            <Label htmlFor="org" className="text-gray-700 text-sm font-semibold">
                                Organization Code
                            </Label>
                            <div className="relative group">
                                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#AD03DE] transition-colors" />
                                <Input
                                    id="org"
                                    placeholder="e.g., DEMO"
                                    value={formData.organizationCode}
                                    onChange={(e) => handleInputChange('organizationCode', e.target.value)}
                                    className={cn(
                                        'pl-12 h-12 bg-gray-50/50 border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-xl transition-all',
                                        'focus:bg-white focus:border-[#AD03DE] focus:ring-4 focus:ring-purple-100',
                                        errors.organizationCode && 'border-red-300 focus:border-red-500 focus:ring-red-100'
                                    )}
                                    disabled={isLoading}
                                />
                            </div>
                            {errors.organizationCode && (
                                <p className="text-red-600 text-xs mt-1 flex items-center gap-1 font-medium">
                                    <AlertCircle className="w-3 h-3" /> {errors.organizationCode}
                                </p>
                            )}
                        </div>

                        {/* Email Field */}
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-gray-700 text-sm font-semibold">
                                Email Address
                            </Label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#AD03DE] transition-colors" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@company.com"
                                    value={formData.email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    className={cn(
                                        'pl-12 h-12 bg-gray-50/50 border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-xl transition-all',
                                        'focus:bg-white focus:border-[#AD03DE] focus:ring-4 focus:ring-purple-100',
                                        errors.email && 'border-red-300 focus:border-red-500 focus:ring-red-100'
                                    )}
                                    disabled={isLoading}
                                />
                            </div>
                            {errors.email && (
                                <p className="text-red-600 text-xs mt-1 flex items-center gap-1 font-medium">
                                    <AlertCircle className="w-3 h-3" /> {errors.email}
                                </p>
                            )}
                        </div>

                        {/* Password Field */}
                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-gray-700 text-sm font-semibold">
                                Password
                            </Label>
                            <div className="relative group">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-[#AD03DE] transition-colors" />
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={(e) => handleInputChange('password', e.target.value)}
                                    className={cn(
                                        'pl-12 pr-12 h-12 bg-gray-50/50 border-gray-200 text-gray-900 placeholder:text-gray-400 rounded-xl transition-all',
                                        'focus:bg-white focus:border-[#AD03DE] focus:ring-4 focus:ring-purple-100',
                                        errors.password && 'border-red-300 focus:border-red-500 focus:ring-red-100'
                                    )}
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-red-600 text-xs mt-1 flex items-center gap-1 font-medium">
                                    <AlertCircle className="w-3 h-3" /> {errors.password}
                                </p>
                            )}
                        </div>

                        {/* Submit Button */}
                        <Button
                            type="submit"
                            disabled={isLoading || success}
                            className={cn(
                                'w-full mt-4 h-12 font-bold text-base rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl hover:-translate-y-0.5',
                                'bg-gradient-to-r from-[#AD03DE] to-purple-600 hover:from-purple-700 hover:to-[#AD03DE] text-white',
                                (isLoading || success) && 'opacity-70 cursor-not-allowed hover:transform-none hover:shadow-none'
                            )}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Processing...</span>
                                </>
                            ) : (
                                <>
                                    <span>{isSignUp ? 'Create Account' : 'Access Portal'}</span>
                                    <ArrowRight className="w-5 h-5" />
                                </>
                            )}
                        </Button>
                    </form>

                    {/* Toggle Auth Mode */}
                    <div className="mt-8 text-center pt-6 border-t border-gray-100">
                        <p className="text-gray-500 text-sm">
                            {isSignUp ? 'Already a member?' : "New to ExecInt?"}{' '}
                            <button
                                onClick={toggleAuthMode}
                                disabled={isLoading}
                                className="text-[#AD03DE] hover:text-purple-700 font-bold transition-colors disabled:opacity-50 hover:underline"
                            >
                                {isSignUp ? 'Secure Login' : 'Request Access'}
                            </button>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AuthPage;