import React, { Suspense, lazy } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Sidebar } from './components/Sidebar'
import { useActiveGoal, useBackupDatabase } from './hooks/useApi'

// Lazy loaded pages
const Dashboard = lazy(() => import('./pages/Dashboard').then(module => ({ default: module.Dashboard })))
const Roadmap = lazy(() => import('./pages/Roadmap').then(module => ({ default: module.Roadmap })))
const Today = lazy(() => import('./pages/Today').then(module => ({ default: module.Today })))
const Progress = lazy(() => import('./pages/Progress').then(module => ({ default: module.Progress })))
const PDFs = lazy(() => import('./pages/PDFs').then(module => ({ default: module.PDFs })))
const Resources = lazy(() => import('./pages/Resources').then(module => ({ default: module.Resources })))
const Settings = lazy(() => import('./pages/Settings').then(module => ({ default: module.Settings })))
const GoalSetup = lazy(() => import('./pages/GoalSetup').then(module => ({ default: module.GoalSetup })))

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

const AppContent: React.FC = () => {
  const { data: activeGoal, isLoading } = useActiveGoal()
  const backupMutation = useBackupDatabase()

  React.useEffect(() => {
    // 10 minutes = 600,000 ms
    const intervalId = setInterval(() => {
      backupMutation.mutate(undefined, {
        onSuccess: () => console.log('Silent auto-backup completed.'),
        onError: (err) => console.error('Silent auto-backup failed:', err)
      })
    }, 600000)

    return () => clearInterval(intervalId)
  }, [backupMutation])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#09090b]">
        <div className="w-10 h-10 rounded-full border-2 border-dashed border-purple-500 animate-spin" />
      </div>
    )
  }

  // Onboarding enforcement: If no active goal exists, force wizard setup
  if (!activeGoal) {
    return (
      <Suspense fallback={<FallbackLoader />}>
        <GoalSetup />
      </Suspense>
    )
  }

  return (
    <div className="min-h-screen bg-[#09090b] flex">
      {/* Sidebar navigation */}
      <Sidebar goal={activeGoal} />
      
      {/* Main content area */}
      <main className="flex-1 min-h-screen pl-80 p-8 overflow-y-auto">
        <Suspense fallback={<FallbackLoader />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/roadmap" element={<Roadmap />} />
            <Route path="/today" element={<Today />} />
            <Route path="/progress" element={<Progress />} />
            <Route path="/pdfs" element={<PDFs />} />
            <Route path="/resources" element={<Resources />} />
            <Route path="/settings" element={<Settings />} />
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
    </div>
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
