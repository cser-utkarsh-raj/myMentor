import React, { Suspense, lazy, useEffect, useState } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Sidebar } from './components/Sidebar'
import { CommandPalette } from './components/CommandPalette'
import { useActiveGoal, useBackupDatabase } from './hooks/useApi'
import { useAuthStore } from './store/authStore'
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
const GoalSetup = lazy(() => import('./pages/GoalSetup').then(module => ({ default: module.GoalSetup })))
const Login = lazy(() => import('./pages/Login').then(module => ({ default: module.Login })))
const Signup = lazy(() => import('./pages/Signup').then(module => ({ default: module.Signup })))

// Initialize TanStack Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false
    }
  }
})

const FallbackLoader = () => (
  <div className="flex items-center justify-center min-h-[60vh]">
    <div className="w-8 h-8 rounded-full border-2 border-dashed border-zinc-500 animate-spin" />
  </div>
)

// Protected Layout that includes the Sidebar
const ProtectedLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
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
  }, [backupMutation])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setIsCommandPaletteOpen(prev => !prev)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  if (isLoading) return <FallbackLoader />

  // If no active goal is found on the backend, force them to the wizard
  if (!activeGoal) {
    return <Navigate to="/setup" replace />
  }

  return (
    <div className="min-h-screen bg-[#09090b] flex">
      <Sidebar goal={activeGoal} />
      <main className="flex-1 min-h-screen pl-80 p-8 overflow-y-auto">
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
  const isAuthenticated = session !== null || isDemoMode

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
