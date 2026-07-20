import React from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Sidebar } from './components/Sidebar'
import { Dashboard } from './pages/Dashboard'
import { Roadmap } from './pages/Roadmap'
import { Today } from './pages/Today'
import { Progress } from './pages/Progress'
import { PDFs } from './pages/PDFs'
import { Resources } from './pages/Resources'
import { Settings } from './pages/Settings'
import { GoalSetup } from './pages/GoalSetup'
import { useActiveGoal } from './hooks/useApi'

// Initialize TanStack Query Client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: false
    }
  }
})

const AppContent: React.FC = () => {
  const { data: activeGoal, isLoading } = useActiveGoal()

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[#09090b]">
        <div className="w-10 h-10 rounded-full border-2 border-dashed border-purple-500 animate-spin" />
      </div>
    )
  }

  // Onboarding enforcement: If no active goal exists, force wizard setup
  if (!activeGoal) {
    return <GoalSetup />
  }

  return (
    <div className="min-h-screen bg-[#09090b] flex">
      {/* Sidebar navigation */}
      <Sidebar goal={activeGoal} />
      
      {/* Main content area */}
      <main className="flex-1 min-h-screen pl-80 p-8 overflow-y-auto">
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
