import React, { Suspense, lazy, useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Menu, RefreshCw, AlertTriangle } from 'lucide-react'
import { Sidebar } from './components/Sidebar'
import { CommandPalette } from './components/CommandPalette'
import { useActiveGoal, useBackupDatabase } from './hooks/useApi'
import { useAuthStore } from './store/authStore'
import { useUIStore } from './store/uiStore'
import { getColorClasses } from './lib/theme'
import { supabase } from './lib/supabase'
import { Landing } from './pages/Landing'

const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })))
const Roadmap = lazy(() => import('./pages/Roadmap').then(m => ({ default: m.Roadmap })))
const Today = lazy(() => import('./pages/Today').then(m => ({ default: m.Today })))
const Progress = lazy(() => import('./pages/Progress').then(m => ({ default: m.Progress })))
const PDFs = lazy(() => import('./pages/PDFs').then(m => ({ default: m.PDFs })))
const Resources = lazy(() => import('./pages/Resources').then(m => ({ default: m.Resources })))
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })))
const Sensei = lazy(() => import('./pages/Sensei').then(m => ({ default: m.Sensei })))
const GoalSetup = lazy(() => import('./pages/GoalSetup').then(m => ({ default: m.GoalSetup })))
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })))
const Signup = lazy(() => import('./pages/Signup').then(m => ({ default: m.Signup })))

const queryClient = new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false, staleTime: 60000, gcTime: 300000, retry: 1 } } })

const FallbackLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
    <div className="relative flex items-center justify-center w-28 h-28">
      <div className="w-24 h-24 rounded-full border-4 border-dashed border-purple-500/40 animate-spin" style={{ animationDuration: '8s' }} />
      <div className="absolute w-20 h-20 rounded-full border-4 border-t-cyan-400 border-b-rose-500 border-l-transparent border-r-transparent animate-spin" style={{ animationDuration: '1.8s' }} />
      <div className="absolute inset-0 m-auto w-12 h-12 rounded-2xl bg-zinc-950 border-2 border-black flex items-center justify-center p-2"><img src="/mymentor-logo.svg" alt="Loading" className="w-full h-full object-contain" /></div>
    </div>
  </div>
)

const GoalLoadError = ({ retry }: { retry: () => void }) => (
  <div className="min-h-[70vh] flex items-center justify-center p-6">
    <div className="max-w-md w-full rounded-3xl border border-red-500/20 bg-zinc-950/80 p-8 text-center shadow-2xl">
      <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-4" />
      <h2 className="text-xl font-bold text-white">Your workspace couldn't be loaded</h2>
      <p className="text-sm text-zinc-500 mt-2 leading-relaxed">Your session is still intact. This is a connection problem, not a missing learning goal. Retry without being sent back to onboarding.</p>
      <button onClick={retry} className="mt-6 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white text-black font-bold text-sm"><RefreshCw className="w-4 h-4" /> Retry</button>
    </div>
  </div>
)

const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate()
  const { data: activeGoal, isLoading, isError, refetch } = useActiveGoal()
  const backupMutation = useBackupDatabase()
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const { isSidebarCollapsed, toggleSidebar } = useUIStore()

  useEffect(() => {
    const { isDemoMode } = useAuthStore.getState()
    if (isDemoMode) return
    const intervalId = setInterval(() => backupMutation.mutate(), 600000)
    return () => clearInterval(intervalId)
  }, [])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setIsCommandPaletteOpen(v => !v) }
      else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') { e.preventDefault(); toggleSidebar() }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleSidebar])

  if (isLoading) return <FallbackLoader />
  if (isError) return <GoalLoadError retry={() => refetch()} />
  if (!activeGoal) return <Navigate to="/setup" replace />

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col md:flex-row">
      <header className="md:hidden flex items-center justify-between px-5 py-3 border-b-2 border-black bg-zinc-950/90 backdrop-blur-xl shrink-0 z-30 sticky top-0 shadow-[0_4px_0px_#000]">
        <button type="button" onClick={toggleSidebar} className="p-2 rounded-xl bg-zinc-900 border-2 border-black text-zinc-300 shadow-[2px_2px_0px_#000]"><Menu className="w-5 h-5" /></button>
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/app')}><img src="/mymentor-logo.svg" alt="myMentor Logo" className="w-7 h-7" /><span className="text-lg font-black text-white">myMentor</span></div>
        <div className="w-8 h-8 rounded-xl bg-zinc-900 border-2 border-black flex items-center justify-center text-xs font-black text-white">{activeGoal.title?.[0]?.toUpperCase() || 'M'}</div>
      </header>
      {!isSidebarCollapsed && <div onClick={toggleSidebar} className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40" />}
      <Sidebar goal={activeGoal} />
      <main className={`flex-1 min-h-screen ${isSidebarCollapsed ? 'md:pl-20' : 'md:pl-64'} p-8 max-md:p-4 overflow-y-auto transition-all duration-300`}><Suspense fallback={<FallbackLoader />}>{children}</Suspense></main>
      <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} />
    </div>
  )
}

const HomeRoute = () => {
  const { isInitialized, session, isDemoMode } = useAuthStore()
  const { data: activeGoal, isLoading, isError, refetch } = useActiveGoal()
  if (!isInitialized) return <FallbackLoader />
  if (!session && !isDemoMode) return <Landing />
  if (isLoading) return <FallbackLoader />
  if (isError) return <GoalLoadError retry={() => refetch()} />
  return <Navigate to={activeGoal ? '/app' : '/setup'} replace />
}

const SetupRoute = () => {
  const { isInitialized, session, isDemoMode } = useAuthStore()
  const { data: activeGoal, isLoading, isError, refetch } = useActiveGoal()
  if (!isInitialized) return <FallbackLoader />
  if (!session && !isDemoMode) return <Navigate to="/login" replace />
  if (isLoading) return <FallbackLoader />
  if (isError) return <GoalLoadError retry={() => refetch()} />
  if (activeGoal) return <Navigate to="/app" replace />
  return <Suspense fallback={<FallbackLoader />}><GoalSetup /></Suspense>
}

const AppContent: React.FC = () => {
  const { session, isDemoMode, isInitialized, setSession } = useAuthStore()
  const { accentColor } = useUIStore()

  useEffect(() => {
    const current = getColorClasses(accentColor)
    document.documentElement.style.setProperty('--accent-color', current.primary)
    document.documentElement.style.setProperty('--accent-rgb', current.primaryRgb)
    document.documentElement.style.setProperty('--theme-secondary', current.secondary)
    document.documentElement.style.setProperty('--theme-secondary-rgb', current.secondaryRgb)
    document.documentElement.style.setProperty('--theme-tertiary', current.tertiary)
    document.documentElement.style.setProperty('--theme-tertiary-rgb', current.tertiaryRgb)
  }, [accentColor])

  useEffect(() => {
    if (isDemoMode) return
    let mounted = true
    supabase.auth.getSession().then(({ data: { session: nextSession } }) => { if (mounted) setSession(nextSession) })
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => { if (mounted) setSession(nextSession) })
    return () => { mounted = false; subscription.unsubscribe() }
  }, [isDemoMode, setSession])

  if (!isInitialized && !isDemoMode) return <FallbackLoader />
  const isAuthenticated = session !== null || isDemoMode

  return (
    <Routes>
      <Route path="/" element={<HomeRoute />} />
      <Route path="/login" element={isAuthenticated ? <Navigate to="/app" replace /> : <Suspense fallback={<FallbackLoader />}><Login /></Suspense>} />
      <Route path="/signup" element={isAuthenticated ? <Navigate to="/app" replace /> : <Suspense fallback={<FallbackLoader />}><Signup /></Suspense>} />
      <Route path="/setup" element={<SetupRoute />} />
      <Route path="/app/*" element={isAuthenticated ? <ProtectedLayout><Routes><Route path="/" element={<Dashboard />} /><Route path="/roadmap" element={<Roadmap />} /><Route path="/today" element={<Today />} /><Route path="/progress" element={<Progress />} /><Route path="/pdfs" element={<PDFs />} /><Route path="/resources" element={<Resources />} /><Route path="/sensei" element={<Sensei />} /><Route path="/settings" element={<Settings />} /></Routes></ProtectedLayout> : <Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() { return <QueryClientProvider client={queryClient}><Router><AppContent /></Router></QueryClientProvider> }
export default App
