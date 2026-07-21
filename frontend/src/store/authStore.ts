import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { Session, User } from '@supabase/supabase-js'

interface AuthState {
  session: Session | null
  user: User | null
  isInitialized: boolean
  isDemoMode: boolean
  activeGoalId: number | null
  userName: string
  setSession: (session: Session | null) => void
  setDemoMode: (isDemo: boolean) => void
  setActiveGoalId: (goalId: number | null) => void
  setUserName: (name: string) => void
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
      userName: 'Mentor Client',
      setSession: (session) => {
        const metadataName = session?.user?.user_metadata?.full_name || session?.user?.user_metadata?.name || session?.user?.email?.split('@')[0] || 'Mentor Client'
        set({ 
          session, 
          user: session?.user || null, 
          isInitialized: true,
          isDemoMode: false,
          userName: metadataName
        })
      },
      setDemoMode: (isDemo) => set({ 
        isDemoMode: isDemo, 
        session: null, 
        user: null, 
        isInitialized: true 
      }),
      setActiveGoalId: (goalId) => set({ activeGoalId: goalId }),
      setUserName: (name: string) => set({ userName: name }),
      clearSession: () => set({ session: null, user: null, isDemoMode: false, activeGoalId: null, userName: 'Mentor Client' })
    }),
    {
      name: 'mymentor-auth-storage',
      storage: createJSONStorage(() => localStorage)
    }
  )
)
