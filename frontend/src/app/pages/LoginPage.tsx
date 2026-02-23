import { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Leaf, Mail, Lock, Eye, EyeOff, ArrowRight, Cpu, Shield, Zap, BarChart3, AlertTriangle } from 'lucide-react';
import { authService } from '../services/authService';

export function LoginPage() {
  const [email, setEmail] = useState('admin@ecowaste.ai');
  const [password, setPassword] = useState('••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const user = await authService.login(email, password);
      if (user.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/driver');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    { icon: Cpu, text: 'AI-optimized collection routes' },
    { icon: Shield, text: 'Real-time fill-level monitoring' },
    { icon: Zap, text: 'Smart overfill alerts' },
    { icon: BarChart3, text: 'CO₂ savings analytics' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-[44%] bg-gradient-to-br from-slate-900 via-slate-800 to-green-950 flex-col p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-green-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-green-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-8 w-64 h-64 bg-emerald-400/5 rounded-full blur-2xl" />

        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '40px 40px',
          }}
        />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center shadow-lg shadow-green-500/30">
              <Leaf className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <div>
              <span className="text-white font-bold text-lg tracking-tight">EcoWaste</span>
              <span className="text-green-400 font-bold text-lg tracking-tight"> AI</span>
            </div>
          </div>

          <h2 className="text-white text-4xl font-bold leading-tight mb-4">
            Smart Waste
            <br />
            <span className="text-green-400">Management</span>
            <br />
            Platform
          </h2>
          <p className="text-slate-400 text-base leading-relaxed mb-12 max-w-sm">
            AI-powered waste collection optimization that reduces costs, saves time, and cuts carbon emissions.
          </p>

          {/* Features */}
          <div className="space-y-4">
            {features.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-green-400" />
                </div>
                <span className="text-slate-300 text-sm">{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Row */}
        <div className="relative z-10 mt-auto grid grid-cols-3 gap-4">
          {[
            { value: '247', label: 'Containers' },
            { value: '84%', label: 'Efficiency' },
            { value: '124kg', label: 'CO₂ Saved' },
          ].map((stat) => (
            <div key={stat.label} className="bg-white/5 rounded-xl p-4 border border-white/10 backdrop-blur-sm">
              <div className="text-white font-bold text-xl">{stat.value}</div>
              <div className="text-slate-400 text-xs mt-0.5">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center bg-slate-50 px-6 py-12">
        <div className="w-full max-w-[420px]">
          {/* Mobile Logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-9 h-9 bg-green-600 rounded-lg flex items-center justify-center">
              <Leaf className="w-4.5 h-4.5 text-white" strokeWidth={2.5} />
            </div>
            <span className="text-slate-900 font-bold text-lg">EcoWaste <span className="text-green-600">AI</span></span>
          </div>

          {/* Header */}
          <div className="mb-8">
            <h1 className="text-slate-900 font-bold text-3xl mb-2">Welcome back</h1>
            <p className="text-slate-500 text-sm">Sign in to your dashboard to continue</p>
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl shadow-lg shadow-slate-200/70 border border-slate-100 p-8">
            {error && (
              <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm font-medium flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                {error}
              </div>
            )}
            <form onSubmit={handleLogin} className="space-y-5">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-all placeholder:text-slate-400"
                    placeholder="you@company.com"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-sm font-medium text-slate-700">
                    Password
                  </label>
                  <a href="#" className="text-xs text-green-600 hover:text-green-700 font-medium">
                    Forgot password?
                  </a>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-11 py-2.5 border border-slate-200 rounded-lg text-sm text-slate-800 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-green-500/30 focus:border-green-500 transition-all placeholder:text-slate-400"
                    placeholder="Your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Remember Me */}
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setRememberMe(!rememberMe)}
                  className={`w-4.5 h-4.5 rounded border-2 flex items-center justify-center transition-all ${rememberMe ? 'bg-green-600 border-green-600' : 'border-slate-300'
                    }`}
                >
                  {rememberMe && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </button>
                <span className="text-sm text-slate-600">Keep me signed in</span>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white py-3 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-md shadow-green-600/25 hover:shadow-lg hover:shadow-green-600/30 mt-2"
              >
                {isLoading ? (
                  <>
                    <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>

          <p className="mt-8 text-center text-slate-500 font-medium tracking-tight">
            Don't have an account?{' '}
            <Link to="/register" className="text-green-600 hover:text-green-700 font-bold transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
