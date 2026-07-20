import { create } from 'zustand'

export type AccentColor = 'purple' | 'cyan' | 'emerald'

interface UIState {
  accentColor: AccentColor
  setAccentColor: (color: AccentColor) => void
}

export const useUIStore = create<UIState>((set) => {
  // Load saved accent color from LocalStorage
  const savedAccent = (localStorage.getItem('mymentor_accent') as AccentColor) || 'purple'
  
  return {
    accentColor: savedAccent,
    setAccentColor: (color: AccentColor) => {
      localStorage.setItem('mymentor_accent', color)
      set({ accentColor: color })
    }
  }
})
