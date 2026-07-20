import { create } from 'zustand'

export type AccentColor = 'purple' | 'cyan' | 'emerald'

interface UIState {
  accentColor: AccentColor
  setAccentColor: (color: AccentColor) => void
  
  // Pomodoro Timer State
  timerMode: number // 25, 45, 60, 90 minutes
  timerSecondsRemaining: number
  timerIsRunning: boolean
  setTimerMode: (minutes: number) => void
  startTimer: () => void
  pauseTimer: () => void
  resetTimer: () => void
  tickTimer: () => void
}

export const useUIStore = create<UIState>((set, get) => {
  // Load saved accent color from LocalStorage
  const savedAccent = localStorage.getItem('mymentor_accent') as AccentColor || 'purple'
  
  return {
    accentColor: savedAccent,
    setAccentColor: (color: AccentColor) => {
      localStorage.setItem('mymentor_accent', color)
      set({ accentColor: color })
    },
    
    // Timer initial states
    timerMode: 25,
    timerSecondsRemaining: 25 * 60,
    timerIsRunning: false,
    
    setTimerMode: (minutes: number) => {
      set({
        timerMode: minutes,
        timerSecondsRemaining: minutes * 60,
        timerIsRunning: false
      })
    },
    
    startTimer: () => set({ timerIsRunning: true }),
    pauseTimer: () => set({ timerIsRunning: false }),
    
    resetTimer: () => {
      const mode = get().timerMode
      set({
        timerSecondsRemaining: mode * 60,
        timerIsRunning: false
      })
    },
    
    tickTimer: () => set((state) => {
      if (state.timerSecondsRemaining <= 1) {
        return {
          timerSecondsRemaining: 0,
          timerIsRunning: false
        }
      }
      return {
        timerSecondsRemaining: state.timerSecondsRemaining - 1
      }
    })
  }
})
