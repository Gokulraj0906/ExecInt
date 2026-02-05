'use client';

import React, { useState } from 'react';
import { Mail, Lock, User, Building2, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, ArrowRight, Shield, Users, Zap, ChevronDown } from 'lucide-react';
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
    color: 'from-purple-500 to-pink-500',
    requiresGmail: true,
  },
  {
    value: 'SUPERVISOR',
    label: 'Supervisor',
    icon: <Users className="w-5 h-5" />,
    description: 'Team management',
    color: 'from-blue-500 to-cyan-500',
    requiresGmail: true,
  },
  {
    value: 'OPERATOR',
    label: 'Operator',
    icon: <Zap className="w-5 h-5" />,
    description: 'Basic operations',
    color: 'from-green-500 to-emerald-500',
    requiresGmail: false,
  },
];

const AuthPage: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
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

  const selectedRole = ROLE_OPTIONS.find(r => r.value === formData.role);

  return (
    <div className="min-h-screen w-full flex bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl animate-float"></div>
        <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 left-1/3 w-72 h-72 bg-cyan-300/15 rounded-full blur-3xl animate-float" style={{ animationDelay: '4s' }}></div>
      </div>

      {/* Left Side - Branding & Features (Hidden on Mobile) */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative z-10">
        {/* Logo */}
        <div className="flex items-center gap-3 animate-fadeInDown">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-xl transform hover:scale-110 transition-transform duration-300">
            <Building2 className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">AuthFlow</h2>
            <p className="text-xs text-slate-500">Enterprise Management</p>
          </div>
        </div>

        {/* Features */}
        <div className="space-y-8">
          <div className="animate-fadeInDown" style={{ animationDelay: '100ms' }}>
            <h3 className="text-4xl font-bold text-slate-900 mb-4 leading-tight">
              Secure Enterprise Authentication
            </h3>
            <p className="text-slate-600 text-lg leading-relaxed">
              Professional role-based access control with enterprise-grade security for your organization.
            </p>
          </div>

          {/* Role Feature Cards */}
          <div className="space-y-3 pt-4">
            {ROLE_OPTIONS.map((role, idx) => (
              <div
                key={role.value}
                className="group p-4 rounded-xl bg-white/60 backdrop-blur-lg border border-slate-200/50 hover:border-slate-300/80 hover:shadow-lg transition-all duration-300 animate-fadeInUp cursor-pointer transform hover:translate-x-2"
                style={{ animationDelay: `${200 + idx * 80}ms` }}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${role.color} text-white group-hover:shadow-lg transition-shadow duration-300`}>
                    {role.icon}
                  </div>
                  <div className="flex-1">
                    <p className="text-slate-900 font-semibold text-sm">{role.label}</p>
                    <p className="text-slate-500 text-xs">{role.description}</p>
                    {role.requiresGmail && (
                      <p className="text-blue-600 text-xs mt-2 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Requires @gmail.com
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="animate-fadeInUp">
          <p className="text-slate-500 text-xs">
            © 2024 AuthFlow. Enterprise authentication system.
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-4 lg:p-12 relative z-10">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="lg:hidden mb-8 text-center animate-fadeInDown">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-xl">
                <Building2 className="w-6 h-6 text-white" />
              </div>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-1">
              {isSignUp ? 'Create Account' : 'Welcome'}
            </h1>
            <p className="text-slate-600 text-sm">
              {isSignUp ? 'Join us and manage your organization' : 'Sign in to continue'}
            </p>
          </div>

          {/* Desktop Header */}
          <div className="hidden lg:block mb-8 animate-fadeInDown">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">
              {isSignUp ? 'Create Account' : 'Sign In'}
            </h1>
            <p className="text-slate-600 text-sm">
              {isSignUp
                ? 'Join us and manage your organization'
                : 'Sign in to your account to continue'}
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 flex items-center gap-3 animate-slideDown shadow-lg">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-green-100 animate-pulse">
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <div className="flex-1">
                <p className="text-green-900 font-semibold text-sm">
                  {isSignUp ? 'Account created successfully!' : 'Logged in successfully!'}
                </p>
                <p className="text-green-700 text-xs mt-1">Redirecting to dashboard...</p>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errors.general && (
            <div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 flex items-center gap-3 animate-slideDown shadow-lg">
              <div className="flex-shrink-0">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <p className="text-red-700 text-sm flex-1">{errors.general}</p>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className={cn('space-y-5 transition-all duration-300', animateForm && 'opacity-50')}>
            {/* Role Selection */}
            <div className="space-y-2 animate-fadeInUp" style={{ animationDelay: '0ms' }}>
              <Label className="text-slate-700 text-sm font-semibold">Select Your Role</Label>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                  className={cn(
                    'w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 bg-white flex items-center justify-between group',
                    errors.role ? 'border-red-400 bg-red-50' : 'border-slate-200 hover:border-blue-400 focus:border-blue-600'
                  )}
                >
                  <div className="flex items-center gap-3">
                    {selectedRole && (
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${selectedRole.color} text-white`}>
                        {selectedRole.icon}
                      </div>
                    )}
                    <div className="text-left">
                      <p className="text-slate-900 font-medium text-sm">{selectedRole?.label}</p>
                      <p className="text-slate-500 text-xs">{selectedRole?.description}</p>
                    </div>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${showRoleDropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {showRoleDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-2 p-2 bg-white rounded-lg border border-slate-200 shadow-xl z-50 animate-slideDown">
                    {ROLE_OPTIONS.map((role) => (
                      <button
                        key={role.value}
                        type="button"
                        onClick={() => {
                          handleInputChange('role', role.value);
                          setShowRoleDropdown(false);
                        }}
                        className={cn(
                          'w-full px-4 py-3 rounded-lg transition-all duration-200 flex items-center gap-3 group',
                          formData.role === role.value
                            ? `bg-gradient-to-r ${role.color} text-white`
                            : 'text-slate-900 hover:bg-slate-100'
                        )}
                      >
                        <div className={cn(
                          'p-2 rounded-lg',
                          formData.role === role.value
                            ? 'bg-white/20'
                            : `bg-gradient-to-br ${role.color} text-white`
                        )}>
                          {role.icon}
                        </div>
                        <div className="text-left flex-1">
                          <p className="font-semibold text-sm">{role.label}</p>
                          <p className={cn('text-xs', formData.role === role.value ? 'text-white/80' : 'text-slate-500')}>
                            {role.description}
                          </p>
                        </div>
                        {role.requiresGmail && (
                          <span className={cn('text-xs px-2 py-1 rounded', formData.role === role.value ? 'bg-white/20' : 'bg-blue-100 text-blue-700')}>
                            Gmail
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {errors.role && (
                <p className="text-red-600 text-xs mt-1">{errors.role}</p>
              )}
            </div>

            {/* Name Field (Signup only) */}
            {isSignUp && (
              <div className="space-y-2 animate-fadeInUp" style={{ animationDelay: '50ms' }}>
                <Label htmlFor="name" className="text-slate-700 text-sm font-semibold">
                  Full Name
                </Label>
                <div className="relative group">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  <Input
                    id="name"
                    placeholder="John Doe"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={cn(
                      'pl-12 h-11 bg-white border-2 text-slate-900 placeholder:text-slate-400 rounded-lg transition-all duration-200 focus:shadow-lg',
                      errors.name
                        ? 'border-red-400 bg-red-50 focus:border-red-600'
                        : 'border-slate-200 hover:border-slate-300 focus:border-blue-600'
                    )}
                    disabled={isLoading}
                  />
                </div>
                {errors.name && (
                  <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" /> {errors.name}
                  </p>
                )}
              </div>
            )}

            {/* Organization Code Field */}
            <div className="space-y-2 animate-fadeInUp" style={{ animationDelay: isSignUp ? '100ms' : '50ms' }}>
              <Label htmlFor="org" className="text-slate-700 text-sm font-semibold">
                Organization Code
              </Label>
              <div className="relative group">
                <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <Input
                  id="org"
                  placeholder="e.g., DEMO"
                  value={formData.organizationCode}
                  onChange={(e) => handleInputChange('organizationCode', e.target.value)}
                  className={cn(
                    'pl-12 h-11 bg-white border-2 text-slate-900 placeholder:text-slate-400 rounded-lg transition-all duration-200 focus:shadow-lg',
                    errors.organizationCode
                      ? 'border-red-400 bg-red-50 focus:border-red-600'
                      : 'border-slate-200 hover:border-slate-300 focus:border-blue-600'
                  )}
                  disabled={isLoading}
                />
              </div>
              {errors.organizationCode && (
                <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.organizationCode}
                </p>
              )}
            </div>

            {/* Email Field */}
            <div className="space-y-2 animate-fadeInUp" style={{ animationDelay: isSignUp ? '150ms' : '100ms' }}>
              <Label htmlFor="email" className="text-slate-700 text-sm font-semibold">
                Email Address
              </Label>
              <div className="relative group">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className={cn(
                    'pl-12 h-11 bg-white border-2 text-slate-900 placeholder:text-slate-400 rounded-lg transition-all duration-200 focus:shadow-lg',
                    errors.email
                      ? 'border-red-400 bg-red-50 focus:border-red-600'
                      : 'border-slate-200 hover:border-slate-300 focus:border-blue-600'
                  )}
                  disabled={isLoading}
                />
              </div>
              {errors.email && (
                <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div className="space-y-2 animate-fadeInUp" style={{ animationDelay: isSignUp ? '200ms' : '150ms' }}>
              <Label htmlFor="password" className="text-slate-700 text-sm font-semibold">
                Password
              </Label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className={cn(
                    'pl-12 pr-12 h-11 bg-white border-2 text-slate-900 placeholder:text-slate-400 rounded-lg transition-all duration-200 focus:shadow-lg',
                    errors.password
                      ? 'border-red-400 bg-red-50 focus:border-red-600'
                      : 'border-slate-200 hover:border-slate-300 focus:border-blue-600'
                  )}
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> {errors.password}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || success}
              className={cn(
                'w-full mt-8 h-12 font-semibold rounded-lg transition-all duration-300 transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2 animate-fadeInUp shadow-lg hover:shadow-xl',
                'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white',
                (isLoading || success) && 'opacity-75 cursor-not-allowed'
              )}
              style={{ animationDelay: isSignUp ? '250ms' : '200ms' }}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>{isSignUp ? 'Creating account...' : 'Signing in...'}</span>
                </>
              ) : (
                <>
                  <span>{isSignUp ? 'Create Account' : 'Sign In'}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </Button>
          </form>

          {/* Toggle Auth Mode */}
          <div className="mt-8 pt-6 border-t border-slate-200 animate-fadeInUp">
            <p className="text-center text-slate-600 text-sm">
              {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
              <button
                onClick={toggleAuthMode}
                disabled={isLoading}
                className="text-blue-600 hover:text-blue-700 font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed relative group"
              >
                {isSignUp ? 'Sign In' : 'Sign Up'}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-blue-600 group-hover:w-full transition-all duration-300"></span>
              </button>
            </p>
          </div>

          {/* Footer */}
          <p className="text-center text-slate-500 text-xs mt-6 animate-fadeInUp" style={{ animationDelay: '300ms' }}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes fadeInDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          33% {
            transform: translateY(-20px) translateX(10px);
          }
          66% {
            transform: translateY(20px) translateX(-10px);
          }
        }

        .animate-fadeInDown {
          animation: fadeInDown 0.6s ease-out forwards;
          opacity: 0;
        }

        .animate-fadeInUp {
          animation: fadeInUp 0.6s ease-out forwards;
          opacity: 0;
        }

        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }

        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default AuthPage;