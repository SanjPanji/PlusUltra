import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import {
    Mail, Lock, User as UserIcon, Shield, Truck,
    ArrowRight, AlertTriangle, CheckCircle2, Leaf
} from 'lucide-react';
import { authService } from '../services/authService';

export function RegisterPage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');
    const [fullName, setFullName] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<'driver' | 'admin'>('driver');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            await authService.register(email, fullName, password, role);
            setIsSuccess(true);
            setTimeout(() => navigate('/'), 2000);
        } catch (err: any) {
            setError(err.message || 'Registration failed. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-inter">
                <div className="max-w-md w-full bg-white rounded-3xl shadow-xl p-10 text-center border border-slate-100">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="w-10 h-10 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-2">Account Created!</h2>
                    <p className="text-slate-500 mb-8">Redirecting you to the login page...</p>
                    <div className="w-12 h-1 bg-green-500 rounded-full mx-auto animate-pulse" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col lg:flex-row font-inter overflow-hidden">
            {/* Left Decoration - Branding */}
            <div className="hidden lg:flex lg:w-1/2 bg-slate-900 relative items-center justify-center p-12 overflow-hidden">
                {/* Abstract background shapes */}
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-green-500/10 rounded-full -mr-96 -mt-96 blur-3xl animate-pulse" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/10 rounded-full -ml-48 -mb-48 blur-3xl" />

                <div className="relative z-10 max-w-lg">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="bg-green-500 p-2.5 rounded-xl shadow-lg shadow-green-500/20">
                            <Leaf className="w-8 h-8 text-white" />
                        </div>
                        <span className="text-white text-3xl font-black tracking-tighter">PlusUltra</span>
                    </div>

                    <h1 className="text-5xl font-bold text-white leading-tight mb-6">
                        Join the future of <span className="text-green-400">waste management.</span>
                    </h1>
                    <p className="text-slate-400 text-lg mb-10 leading-relaxed">
                        Register today to access AI-powered route optimization, real-time analytics, and contribute to a greener planet.
                    </p>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                            <div className="text-green-400 font-bold text-2xl mb-1">99.8%</div>
                            <div className="text-slate-400 text-sm">System Uptime</div>
                        </div>
                        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                            <div className="text-green-400 font-bold text-2xl mb-1">-24%</div>
                            <div className="text-slate-400 text-sm">CO₂ Emissions</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Section - Form */}
            <div className="flex-1 flex items-center justify-center p-6 lg:p-12 relative overflow-y-auto">
                <div className="max-w-md w-full">
                    <div className="mb-10 text-center lg:text-left">
                        <h2 className="text-3xl font-bold text-slate-900 mb-2">Create Account</h2>
                        <p className="text-slate-500 font-medium">Please enter your details to sign up</p>
                    </div>

                    <form onSubmit={handleRegister} className="space-y-5">
                        {error && (
                            <div className="bg-red-50 border border-red-100 p-4 rounded-xl flex items-center gap-3 animate-shake">
                                <AlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
                                <p className="text-sm text-red-600 font-medium">{error}</p>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700 ml-1">Full Name</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <UserIcon className="h-5 w-5 text-slate-400 group-focus-within:text-green-500 transition-colors" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="block w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-900 text-sm focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all placeholder:text-slate-400 shadow-sm"
                                    placeholder="John Doe"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700 ml-1">Email Address</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-slate-400 group-focus-within:text-green-500 transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-900 text-sm focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all placeholder:text-slate-400 shadow-sm"
                                    placeholder="name@company.com"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700 ml-1">Password</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-400 group-focus-within:text-green-500 transition-colors" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-slate-900 text-sm focus:outline-none focus:ring-4 focus:ring-green-500/10 focus:border-green-500 transition-all placeholder:text-slate-400 shadow-sm"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-sm font-semibold text-slate-700 ml-1">I am a...</label>
                            <div className="grid grid-cols-2 gap-4">
                                <button
                                    type="button"
                                    onClick={() => setRole('driver')}
                                    className={`flex items-center justify-center gap-2 p-3.5 rounded-2xl border transition-all text-sm font-semibold ${role === 'driver'
                                        ? 'bg-green-50 border-green-500 text-green-700 shadow-sm'
                                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                                        }`}
                                >
                                    <Truck className={`w-4 h-4 ${role === 'driver' ? 'text-green-600' : ''}`} />
                                    Driver
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setRole('admin')}
                                    className={`flex items-center justify-center gap-2 p-3.5 rounded-2xl border transition-all text-sm font-semibold ${role === 'admin'
                                        ? 'bg-green-50 border-green-500 text-green-700 shadow-sm'
                                        : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                                        }`}
                                >
                                    <Shield className={`w-4 h-4 ${role === 'admin' ? 'text-green-600' : ''}`} />
                                    Admin
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-4 rounded-2xl shadow-xl shadow-slate-900/20 transition-all flex items-center justify-center gap-2 disabled:opacity-70 group mt-4"
                        >
                            {isLoading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Create Account
                                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <p className="mt-8 text-center text-slate-500 font-medium">
                        Already have an account?{' '}
                        <Link to="/" className="text-green-600 hover:text-green-700 font-bold transition-colors">
                            Sign In
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
