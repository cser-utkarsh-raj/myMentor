import { create } from 'zustand'

interface SessionState {
  // Focus Session UI State
  isSessionActive: boolean
  activeResourceId: number | null
  
  // Timer State
  timerMode: number // minutes
  timerSecondsRemaining: number
  timerIsRunning: boolean
  
  // Actions
  startSession: (resourceId: number) => void
  endSession: () => void
  setTimerMode: (minutes: number) => void
  startTimer: () => void
  pauseTimer: () => void
  resetTimer: () => void
  tickTimer: () => void
}

export const useSessionStore = create<SessionState>((set, get) => ({
  isSessionActive: false,
  activeResourceId: null,
  
  timerMode: 25,
  timerSecondsRemaining: 25 * 60,
  timerIsRunning: false,
  
  startSession: (resourceId) => set({
    isSessionActive: true,
    activeResourceId: resourceId,
    timerIsRunning: false, // Wait for user to explicitly start
  }),
  
  endSession: () => {
    const mode = get().timerMode
    set({
      isSessionActive: false,
      activeResourceId: null,
      timerIsRunning: false,
      timerSecondsRemaining: mode * 60
    })
  },
  
  setTimerMode: (minutes) => {
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
}))
