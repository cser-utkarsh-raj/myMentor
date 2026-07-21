import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type AccentColor = 'purple' | 'cyan' | 'emerald' | 'blue'

interface UIState {
  accentColor: AccentColor
  goalThemes: Record<string, AccentColor>
  setAccentColor: (color: AccentColor) => void
  setGoalTheme: (goalId: string | number, color: AccentColor) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      accentColor: 'purple',
      goalThemes: {},
      setAccentColor: (color: AccentColor) => set({ accentColor: color }),
      setGoalTheme: (goalId, color) => set((state) => ({
        goalThemes: { ...state.goalThemes, [String(goalId)]: color },
        accentColor: color
      }))
    }),
    {
      name: 'mymentor-ui-storage',
      storage: createJSONStorage(() => localStorage)
    }
  )
)
