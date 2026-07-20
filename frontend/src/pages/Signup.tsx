import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap, Mail, Lock, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuthStore } from '../store/authStore'

export const Signup: React.FC = () => {
  const navigate = useNavigate()
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      setLoading(false)
      return
    }
    
    try {
      const { data, error } = await supabase.auth.signUp({ 
        email, 
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/app`
        }
      })
      if (error) throw error
      
      if (data?.user && !data.session) {
        setSuccessMessage('A verification link has been sent to your email. Please check your inbox (and spam folder) and confirm your email to complete registration.')
        return
      }
      
      navigate('/setup')
    } catch (err: any) {
      if (
        import.meta.env.VITE_SUPABASE_URL === undefined ||
        import.meta.env.VITE_SUPABASE_URL.includes('placeholder') ||
        err.message?.includes('fetch') ||
        err.message?.includes('NetworkError')
      ) {
        console.warn('Supabase offline/unconfigured, falling back to local session')
        useAuthStore.getState().setSession({
          access_token: 'local-demo-token',
          token_type: 'bearer',
          expires_in: 3600,
          refresh_token: 'dummy',
          user: {
            id: 'local-dev-user-uuid',
            email: email || 'dev@mymentor.app',
            aud: 'authenticated',
            role: 'authenticated',
            created_at: new Date().toISOString(),
            app_metadata: {},
            user_metadata: {}
          }
        } as any)
        navigate('/setup')
        return
      }
      setError(err.message || 'Failed to sign up')
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignup = async () => {
    setLoading(true)
    setError(null)
    
    // Check if we are using the placeholder URL
    if (import.meta.env.VITE_SUPABASE_URL === undefined || import.meta.env.VITE_SUPABASE_URL.includes('placeholder')) {
      alert("Google Signup is disabled in local development mode without Supabase credentials. Use email/password.")
      setLoading(false)
      return
    }

    try {
      const { error } = await supabase.auth.signInWithOAuth({ provider: 'google' })
      if (error) throw error
    } catch (err: any) {
      setError(err.message || 'Failed to initialize Google signup')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#000000] flex items-center justify-center p-6 relative overflow-hidden font-sans">
      
      {/* Background glow */}
      <div 
        className="absolute w-[600px] h-[600px] rounded-full blur-[120px] -z-10 pointer-events-none opacity-20"
        style={{
          background: `radial-gradient(circle, #a855f7 0%, transparent 70%)`,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md glass-panel p-8 rounded-3xl border border-white/10 flex flex-col gap-6"
      >
        {successMessage ? (
          <div className="flex flex-col items-center gap-4 text-center py-4">
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <CheckCircle className="w-12 h-12" />
            </div>
            <h2 className="text-xl font-bold text-white">Verification Email Sent</h2>
            <p className="text-xs text-zinc-400 leading-relaxed">
              {successMessage}
            </p>
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="mt-2 w-full py-2.5 rounded-xl bg-white text-black font-bold text-sm hover:bg-zinc-200 transition-colors cursor-pointer"
            >
              Go to Login
            </button>
          </div>
        ) : (
          <>
            <div className="flex flex-col items-center gap-4 text-center">
              <div className="p-3 rounded-2xl bg-zinc-900 border border-white/5 shadow-2xl">
                <Zap className="w-8 h-8 text-purple-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight">Create your account</h1>
                <p className="text-sm text-zinc-400 mt-1">Join myMentor and start executing your goals</p>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <form onSubmit={handleSignup} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full bg-zinc-900/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-zinc-900/50 border border-white/10 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-white text-black py-2.5 rounded-xl font-bold text-sm hover:bg-zinc-200 transition-colors disabled:opacity-50 mt-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sign Up'}
              </button>
            </form>

            <div className="relative flex items-center py-2">
              <div className="flex-grow border-t border-white/10"></div>
              <span className="flex-shrink-0 mx-4 text-xs font-semibold text-zinc-500 uppercase">Or continue with</span>
              <div className="flex-grow border-t border-white/10"></div>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignup}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-zinc-900 border border-white/10 text-white py-2.5 rounded-xl font-bold text-sm hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </button>

            <p className="text-center text-xs text-zinc-500 font-medium">
              Already have an account? <span className="text-white hover:underline cursor-pointer" onClick={() => navigate('/login')}>Log in</span>
            </p>
          </>
        )}
      </motion.div>
    </div>
  )
}
