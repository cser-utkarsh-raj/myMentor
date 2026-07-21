import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type AccentColor = 'purple' | 'cyan' | 'emerald' | 'blue'
export type SenseiPersonality = 'Deadpool' | 'Homelander' | 'Thor' | 'Messi' | 'Taylor Swift' | 'Ryan Gosling'

interface UIState {
  accentColor: AccentColor
  goalThemes: Record<string, AccentColor>
  isSidebarCollapsed: boolean
  senseiPersonality: SenseiPersonality
  setAccentColor: (color: AccentColor) => void
  setGoalTheme: (goalId: string | number, color: AccentColor) => void
  setSenseiPersonality: (personality: SenseiPersonality) => void
  toggleSidebar: () => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      accentColor: 'purple',
      goalThemes: {},
      isSidebarCollapsed: false,
      senseiPersonality: 'Deadpool',
      setAccentColor: (color: AccentColor) => set({ accentColor: color }),
      setGoalTheme: (goalId, color) => set((state) => ({
        goalThemes: { ...state.goalThemes, [String(goalId)]: color },
        accentColor: color
      })),
      setSenseiPersonality: (personality: SenseiPersonality) => set({ senseiPersonality: personality }),
      toggleSidebar: () => set((state) => ({ isSidebarCollapsed: !state.isSidebarCollapsed }))
    }),
    {
      name: 'mymentor-ui-storage',
      storage: createJSONStorage(() => localStorage)
    }
  )
)
