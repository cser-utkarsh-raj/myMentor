import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export type AccentColor = 'purple' | 'cyan' | 'emerald'

interface UIState {
  accentColor: AccentColor
  setAccentColor: (color: AccentColor) => void
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      accentColor: 'purple',
      setAccentColor: (color: AccentColor) => set({ accentColor: color })
    }),
    {
      name: 'mymentor-ui-storage',
      storage: createJSONStorage(() => localStorage)
    }
  )
)
