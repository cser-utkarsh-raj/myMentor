import React, { Suspense, lazy, useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Menu } from 'lucide-react'
import { Sidebar } from './components/Sidebar'
import { CommandPalette } from './components/CommandPalette'
import { useActiveGoal, useBackupDatabase } from './hooks/useApi'
import { useAuthStore } from './store/authStore'
import { useUIStore } from './store/uiStore'
import { getColorClasses } from './lib/theme'
import { supabase } from './lib/supabase' 
import { Landing } from './pages/Landing'

// Lazy loaded pages
const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })))
const Roadmap = lazy(() => import('./pages/Roadmap').then(module => ({ default: module.Roadmap })))
const Today = lazy(() => import('./pages/Today').then(module => ({ default: module.Today })))
const Progress = lazy(() => import('./pages/Progress').then(module => ({ default: module.Progress })))
const PDFs = lazy(() => import('./pages/PDFs').then(module => ({ default: module.PDFs })))
const Resources = lazy(() => import('./pages/Resources').then(module => ({ default: module.Resources })))
const Settings = lazy(() => import('./pages/Settings').then(module => ({ default: module.Settings })))
const Sensei = lazy(() => import('./pages/Sensei').then(module => ({ default: module.Sensei })))
const GoalSetup = lazy(() => import('./pages/GoalSetup').then(module => ({ default: module.GoalSetup })))
const Login = lazy(() => import('./pages/Login').then(module => ({ default: module.Login })))
const Signup = lazy(() => import('./pages/Signup').then(module => ({ default: module.Signup })))

// Initialize TanStack Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 60000,
      gcTime: 300000,
      retry: 1
    }
  }
})

const FallbackLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
    <div className="relative flex items-center justify-center">
      <div className="w-16 h-16 rounded-full border-4 border-t-cyan-400 border-b-rose-500 border-r-transparent border-l-transparent animate-spin" />
      <div className="absolute p-3 rounded-2xl bg-zinc-900 border-2 border-black shadow-[3px_3px_0px_#000] animate-pulse">
        <img src="/mymentor-logo.svg" alt="Loading" className="w-6 h-6 drop-shadow-[2px_2px_0px_#000]" />
      </div>
    </div>
  </div>
)

// Protected Layout that includes the Sidebar
const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const navigate = useNavigate()
  const { data: activeGoal, isLoading } = useActiveGoal()
  const backupMutation = useBackupDatabase()
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)

  useEffect(() => {
    const { isDemoMode } = useAuthStore.getState()
    if (isDemoMode) return // Skip backups in demo mode

    // 10 minutes = 600,000 ms silent backup
    const intervalId = setInterval(() => {
      backupMutation.mutate(undefined, {
        onSuccess: () => console.log('Silent auto-backup completed.'),
        onError: (err) => console.error('Silent auto-backup failed:', err)
      })
    }, 600000)
    return () => clearInterval(intervalId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { isSidebarCollapsed, toggleSidebar } = useUIStore()

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setIsCommandPaletteOpen(prev => !prev)
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        toggleSidebar()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [toggleSidebar])

  if (isLoading) return <FallbackLoader />

  // If no active goal is found on the backend, force them to the wizard
  if (!activeGoal) {
    return <Navigate to="/setup" replace />
  }

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col md:flex-row">
      {/* Mobile Header Bar */}
      <header className="md:hidden flex items-center justify-between px-5 py-3 border.b-2 border-black bg-zinc-950/90 backdrop-blur-xl shrink-0 z-30 sticky top-0 shadow-[0_4px_0px_#000]">
        <button
          type="button"
          onClick={toggleSidebar}
          className="p-2 rounded-xl bg-zinc-900 border-2 border-black text-zinc-300 hover:text-white transition-all cursor-pointer shadow-[2px_2px_0px_#000]"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/app')}>
          <img src="/mymentor-logo.svg" alt="myMentor Logo" className="w-7 h-7 drop-shadow-[2px_2px_0px_#000]" />
          <span className="text-lg font-black text-white tracking-tight">myMentor</span>
        </div>
        <div className="w-8 h-8 rounded-xl bg-zinc-900 border-2 border-black flex items-center justify-center text-xs font-black text-white shadow-[2px_2px_0px_#000]">
          {activeGoal?.title?.[0]?.toUpperCase() || 'M'}
        </div>
      </header>

      {/* Backdrop for mobile drawer */}
      {!isSidebarCollapsed && (
        <div 
          onClick={toggleSidebar} 
          className="md:hidden fixed inset-0 bg-black/70 backdrop-blur-sm z-40 transition-opacity duration-300"
        />
      )}

      <Sidebar goal={activeGoal} />
      <main className={`flex-1 min-h-screen ${isSidebarCollapsed ? 'md:pl-20' : 'md:pl-64'} p-8 max-md:p-4 overflow-y-auto transition-all duration-300`}>
        <Suspense fallback={<FallbackLoader />}>
          {children}
        </Suspense>
      </main>
      <CommandPalette isOpen={isCommandPaletteOpen} onClose={() => setIsCommandPaletteOpen(false)} />
    </div>
  )
}

// Global Routing
const AppContent: React.FC = () => {
  const { session, isDemoMode, setSession } = useAuthStore()
  const { accentColor } = useUIStore()
  const isAuthenticated = session !== null || isDemoMode

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
    // Check initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setSession(session)
      } else {
        const state = useAuthStore.getState()
        if (!state.isDemoMode && state.session?.access_token !== 'local-demo-token') {
          setSession(null)
        }
      }
    })

    // Listen to changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        setSession(session)
      } else {
        const state = useAuthStore.getState()
        if (!state.isDemoMode && state.session?.access_token !== 'local-demo-token') {
          setSession(null)
        }
      }
    })

    return () => subscription.unsubscribe()
  }, [setSession])

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={
        <Suspense fallback={<FallbackLoader />}>
          <Login />
        </Suspense>
      } />
      <Route path="/signup" element={
        <Suspense fallback={<FallbackLoader />}>
          <Signup />
        </Suspense>
      } />
      
      {/* Semi-Protected Onboarding */}
      <Route path="/setup" element={
        isAuthenticated ? (
          <Suspense fallback={<FallbackLoader />}>
            <GoalSetup />
          </Suspense>
        ) : (
          <Navigate to="/login" replace />
        )
      } />

      {/* Protected Application Routes */}
      <Route path="/app/*" element={
        isAuthenticated ? (
          <ProtectedLayout>
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/roadmap" element={<Roadmap />} />
              <Route path="/today" element={<Today />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/pdfs" element={<PDFs />} />
              <Route path="/resources" element={<Resources />} />
              <Route path="/sensei" element={<Sensei />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </ProtectedLayout>
        ) : (
          <Navigate to="/login" replace />
        )
      } />

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  )
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AppContent />
      </Router>
    </QueryClientProvider>
  )
}

export default App
