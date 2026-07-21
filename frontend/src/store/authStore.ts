import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { Session, User } from '@supabase/supabase-js'

interface AuthState {
  session: Session | null
  user: User | null
  isInitialized: boolean
  isDemoMode: boolean
  activeGoalId: number | null
  setSession: (session: Session | null) => void
  setDemoMode: (isDemo: boolean) => void
  setActiveGoalId: (goalId: number | null) => void
  clearSession: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      session: null,
      user: null,
      isInitialized: false,
      isDemoMode: false,
      activeGoalId: null,
      setSession: (session) => set({ 
        session, 
        user: session?.user || null, 
        isInitialized: true,
        isDemoMode: false
      }),
      setDemoMode: (isDemo) => set({ 
        isDemoMode: isDemo, 
        session: null, 
        user: null, 
        isInitialized: true 
      }),
      setActiveGoalId: (goalId) => set({ activeGoalId: goalId }),
      clearSession: () => set({ session: null, user: null, isDemoMode: false, activeGoalId: null })
    }),
    {
      name: 'mymentor-auth-storage',
      storage: createJSONStorage(() => localStorage)
    }
  )
)
