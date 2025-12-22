'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { api } from '@/lib/api'
import { Mail, ArrowLeft, Lock, CheckCircle } from 'lucide-react'

export default function ForgotPassword() {
  const router = useRouter()
  const [step, setStep] = useState<'email' | 'otp' | 'reset' | 'success'>('email')
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSendOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await api.forgotPassword(email)
      setStep('otp')
    } catch (err: any) {
      setError(err.message || 'Failed to send OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      await api.verifyOTP(email, otp)
      setStep('reset')
    } catch (err: any) {
      setError(err.message || 'Invalid OTP')
    } finally {
      setLoading(false)
    }
  }

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      await api.resetPassword(email, otp, newPassword)
      setStep('success')
      setTimeout(() => router.push('/login'), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#4B0082] to-[#00BFFF] dark:from-slate-900 dark:via-indigo-950 dark:to-purple-950 relative overflow-hidden p-4">
      
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS13aWR0aD0iMC41IiBvcGFjaXR5PSIwLjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=')] opacity-20"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Glassmorphic Card */}
        <div className="relative bg-white/10 dark:bg-slate-800/20 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl shadow-2xl p-8 before:absolute before:inset-0 before:rounded-3xl before:p-[1px] before:bg-gradient-to-br before:from-white/40 before:via-white/20 before:to-transparent before:-z-10">
          {/* Inner Glow */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-white/10 via-transparent to-transparent pointer-events-none"></div>
          
          <div className="relative z-10">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="inline-block p-3 bg-white/20 dark:bg-white/10 backdrop-blur-sm rounded-full mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-primary to-pink-500 rounded-full flex items-center justify-center">
                  <Lock className="w-8 h-8 text-white" />
                </div>
              </div>
              <h1 className="text-3xl font-bold text-white drop-shadow-lg mb-2">
                {step === 'email' && 'Forgot Password'}
                {step === 'otp' && 'Verify OTP'}
                {step === 'reset' && 'Reset Password'}
                {step === 'success' && 'Success!'}
              </h1>
              <p className="text-sm text-white/80">
                {step === 'email' && 'Enter your email to receive OTP'}
                {step === 'otp' && 'Enter the 6-digit code sent to your email'}
                {step === 'reset' && 'Create a new password'}
                {step === 'success' && 'Password reset successfully'}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/20 backdrop-blur-sm border border-red-300/30 rounded-lg text-white text-sm">
                {error}
              </div>
            )}

            {/* Step 1: Email */}
            {step === 'email' && (
              <form onSubmit={handleSendOTP} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all"
                      placeholder="Enter your email"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-primary to-pink-500 text-white rounded-lg font-semibold hover:shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {loading ? 'Sending...' : 'Send OTP'}
                </button>
              </form>
            )}

            {/* Step 2: OTP */}
            {step === 'otp' && (
              <form onSubmit={handleVerifyOTP} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Enter OTP
                  </label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    className="w-full px-4 py-3 bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-lg text-white text-center text-2xl tracking-widest focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all"
                    placeholder="000000"
                    maxLength={6}
                    required
                  />
                  <p className="text-xs text-white/70 mt-2 text-center">
                    OTP sent to {email}
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="w-full py-3 bg-gradient-to-r from-primary to-pink-500 text-white rounded-lg font-semibold hover:shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>

                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="w-full py-2 text-sm text-white/90 hover:text-white underline underline-offset-2 transition-colors"
                >
                  Resend OTP
                </button>
              </form>
            )}

            {/* Step 3: Reset Password */}
            {step === 'reset' && (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    New Password
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all"
                    placeholder="Enter new password"
                    required
                    minLength={6}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-white/90 mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 bg-white/20 dark:bg-white/10 backdrop-blur-sm border border-white/30 dark:border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-white/50 focus:border-transparent transition-all"
                    placeholder="Confirm new password"
                    required
                    minLength={6}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-gradient-to-r from-primary to-pink-500 text-white rounded-lg font-semibold hover:shadow-lg hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </button>
              </form>
            )}

            {/* Step 4: Success */}
            {step === 'success' && (
              <div className="text-center py-8">
                <div className="w-20 h-20 bg-green-500/20 backdrop-blur-sm border border-green-400/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-12 h-12 text-green-400" />
                </div>
                <p className="text-white text-lg font-semibold mb-2">
                  Your password has been reset successfully!
                </p>
                <p className="text-sm text-white/70">
                  Redirecting to login page...
                </p>
              </div>
            )}

            {/* Back to Login */}
            {step !== 'success' && (
              <div className="mt-6 text-center">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 text-sm text-white/90 hover:text-white underline underline-offset-2 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Login
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
