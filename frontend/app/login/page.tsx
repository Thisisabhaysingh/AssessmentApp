'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result: any = await api.login(email, password)
      const role = result.data.user.role
      
      // Redirect based on role
      if (role === 'trainer') router.push('/trainer')
      else if (role === 'manager') router.push('/manager')
      else if (role === 'school_ops_manager') router.push('/school-ops-manager')
      else if (role === 'admin') router.push('/admin')
    } catch (err: any) {
      setError(err.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#4B0082] to-[#00BFFF] dark:from-slate-900 dark:via-indigo-950 dark:to-purple-950 relative overflow-hidden">
    
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20"></div>

      {/* Glassmorphic Card */}
      <div className="relative bg-white/10 dark:bg-slate-800/20 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl shadow-2xl p-8 w-full max-w-md mx-4 before:absolute before:inset-0 before:rounded-3xl before:p-[1px] before:bg-gradient-to-br before:from-white/40 before:via-white/20 before:to-transparent before:-z-10">
        {/* Inner Glow */}
        <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none"></div>
        
        <div className="relative z-10">
          <div className="text-center mb-8">
            <div className="inline-block p-3 bg-white/20 dark:bg-white/10 backdrop-blur-sm rounded-full mb-4">
              <div className="w-12 h-12 bg-gradient-to-br from-primary to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-white text-2xl font-bold">A</span>
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-2 text-white drop-shadow-lg">Automation Assessment</h1>
            <p className="text-white/80 text-sm">Sign in to your account</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-white/90">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full px-4 py-3 bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-lg text-slate-700 placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all"
                required
                suppressHydrationWarning
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-white/90">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all"
                required
                suppressHydrationWarning
              />
            </div>

            <div className="flex items-center justify-end">
              <Link
                href="/forgot-password"
                className="text-sm text-white/90 hover:text-white underline underline-offset-2 transition-colors"
              >
                Forgot Password?
              </Link>
            </div>

            {error && (
              <div className="p-3 bg-red-500/20 backdrop-blur-sm border border-red-300/30 rounded-lg text-sm text-white">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-primary to-pink-500 text-white rounded-lg font-semibold hover:shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
              suppressHydrationWarning
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
