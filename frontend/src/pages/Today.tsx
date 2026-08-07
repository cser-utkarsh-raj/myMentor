import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  FileEdit, 
  Clock, 
  AlertCircle
} from 'lucide-react'
import { useActiveGoal, useUpdateResource, useLogStudySession, Day, Resource } from '../hooks/useApi'
import { useUIStore } from '../store/uiStore'
import { useSessionStore } from '../store/sessionStore'
import { getColorClasses } from '../lib/theme'

export const Today: React.FC = () => {
  const { accentColor } = useUIStore()
  const theme = getColorClasses(accentColor)
  const { 
    isSessionActive, 
    activeResourceId, 
    timerMode, 
    timerSecondsRemaining, 
    timerIsRunning, 
    startSession,
    endSession,
    setTimerMode, 
    startTimer, 
    pauseTimer, 
    resetTimer, 
    tickTimer 
  } = useSessionStore()
  
  const { data: activeGoal, isLoading } = useActiveGoal()
  const updateResourceMutation = useUpdateResource()
  const logSessionMutation = useLogStudySession()

  const [activeDay, setActiveDay] = useState<Day | null>(null)
  const [selectedResource, setSelectedResource] = useState<Resource | null>(null)
  const [noteContent, setNoteContent] = useState('')
  const [savingStatus, setSavingStatus] = useState<'idle' | 'typing' | 'saving' | 'saved'>('idle')
  const [showSessionModal, setShowSessionModal] = useState(false)
  const [sessionNotes, setSessionNotes] = useState('')

  const timerIntervalRef = useRef<any>(null)
  const typingTimeoutRef = useRef<any>(null)

  useEffect(() => {
    if (activeGoal?.tracks) {
      const allDays: Day[] = []
      for (const track of activeGoal.tracks) {
        for (const ms of track.modules) {
          for (const day of ms.days) {
            allDays.push(day)
          }
        }
      }
      allDays.sort((a, b) => a.day_number - b.day_number)
      const todayDay = allDays.find(d => d.unlocked && !d.is_completed) || allDays.find(d => d.unlocked) || allDays[0]
      setActiveDay(todayDay || null)
      if (todayDay?.resources?.length && !selectedResource) {
        setSelectedResource(todayDay.resources[0])
        setNoteContent(todayDay.resources[0].notes || '')
      }
    }
  }, [activeGoal, selectedResource])

  useEffect(() => {
    if (timerIsRunning) timerIntervalRef.current = setInterval(tickTimer, 1000)
    else if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current) }
  }, [timerIsRunning, tickTimer])

  useEffect(() => {
    if (timerSecondsRemaining === 0 && timerIsRunning) {
      pauseTimer()
      setShowSessionModal(true)
    }
  }, [timerSecondsRemaining, timerIsRunning])

  const handleCompleteTimer = () => { pauseTimer(); setShowSessionModal(true) }

  const submitSession = async (completionStatus: boolean) => {
    if (activeGoal) {
      try {
        await logSessionMutation.mutateAsync({
          goal_id: activeGoal.id,
          resource_id: activeResourceId || undefined,
          duration_seconds: Math.max(60, (timerMode * 60) - timerSecondsRemaining),
          completion_status: completionStatus,
          platform: 'Internal',
          notes: sessionNotes
        })
        if (completionStatus && activeResourceId) {
          await updateResourceMutation.mutateAsync({
            resourceId: activeResourceId,
            payload: { is_completed: true, notes: sessionNotes }
          })
        }
        setShowSessionModal(false)
        setSessionNotes('')
        endSession()
      } catch (e) { console.error(e) }
    }
  }

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setNoteContent(value)
    setSavingStatus('typing')
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(async () => {
      if (selectedResource) {
        setSavingStatus('saving')
        try {
          await updateResourceMutation.mutateAsync({ resourceId: selectedResource.id, payload: { notes: value } })
          setSavingStatus('saved')
          setTimeout(() => setSavingStatus('idle'), 1500)
        } catch { setSavingStatus('idle') }
      }
    }, 1000)
  }

  const formatTime = (seconds: number) => `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toString().padStart(2, '0')}`

  if (isLoading) return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 rounded-full border-2 border-dashed border-zinc-500 animate-spin" /></div>
  if (!activeGoal || !activeDay) return <div className="flex flex-col items-center justify-center min-h-[65vh] text-center gap-4"><h2 className="text-xl font-bold text-zinc-300">No active daily missions.</h2></div>

  const resources = activeDay.resources || []
  const completedCount = resources.filter(r => r.is_completed).length
  const todayProgress = Math.round((completedCount / (resources.length || 1)) * 100)

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-6xl mx-auto py-4 h-[calc(100vh-140px)]">
      {/* Session Modal */}
      <AnimatePresence>
        {showSessionModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} className="bg-zinc-900 border border-white/10 rounded-3xl p-6 max-w-md w-full shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-2">Session Complete</h3>
              <p className="text-sm text-zinc-400 mb-6">Log your focus session progress.</p>
              <textarea value={sessionNotes} onChange={e => setSessionNotes(e.target.value)} placeholder="Session Notes..." className="w-full h-24 bg-zinc-950 border border-white/10 rounded-xl p-3 text-sm text-white outline-none mb-6" />
              <div className="flex gap-3">
                <button onClick={() => submitSession(false)} className="flex-1 py-3 rounded-xl bg-zinc-800 text-zinc-300 text-sm font-bold">Log Time Only</button>
                <button onClick={() => submitSession(true)} className={`flex-1 py-3 rounded-xl text-black text-sm font-bold ${theme.btn}`}>Mark Completed</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* LEFT COLUMN */}
      <div className="w-full lg:w-[55%] flex flex-col gap-6 overflow-y-auto pr-1">
        <div className="glass-panel p-5 rounded-3xl border border-white/5 bg-zinc-950/20 relative overflow-hidden shrink-0">
          <div className="flex justify-between items-center mb-1">
            <span className={`text-[10px] font-black uppercase tracking-widest ${theme.text}`}>Active Target</span>
            <span className="text-[10px] font-bold text-zinc-500">Day {activeDay.day_number} of {activeGoal.timeline_days}</span>
          </div>
          <h3 className="text-xl font-bold text-white">{activeDay.title}</h3>
          <div className="flex flex-col gap-2 mt-4">
            <div className="flex justify-between text-xs font-bold text-zinc-400"><span>Progress</span><span>{todayProgress}%</span></div>
            <div className="w-full h-2 rounded-full bg-zinc-800 border border-white/5 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${theme.gradient}`} style={{ width: `${todayProgress}%` }} />
            </div>
          </div>
        </div>

        {/* Pomodoro Timer */}
        <div className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col items-center gap-5 shrink-0">
          <div className="flex justify-between w-full items-center">
            <h4 className="text-sm font-bold text-zinc-300 flex items-center gap-2"><Clock className="w-4 h-4 text-zinc-500" /> Focus Timer</h4>
            <div className="flex gap-1.5 bg-zinc-950/60 p-1 rounded-xl border border-white/5">
              {[25, 45, 60, 90].map(m => (
                <button key={m} onClick={() => setTimerMode(m)} disabled={timerIsRunning} className={`px-3 py-1 rounded-lg text-xs font-bold ${timerMode === m ? `${theme.bg} ${theme.text}` : 'text-zinc-500'}`}>{m}m</button>
              ))}
            </div>
          </div>
          <span className="text-5xl font-black font-mono tracking-wider text-white">{formatTime(timerSecondsRemaining)}</span>
          <div className="flex gap-3 w-full max-w-xs">
            {timerIsRunning ? (
              <button onClick={pauseTimer} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold bg-amber-500/10 text-amber-500 border border-amber-500/20"><Pause className="w-4 h-4" /> Pause</button>
            ) : (
              <button onClick={startTimer} className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold ${theme.btn}`}><Play className="w-4 h-4" /> Focus</button>
            )}
            <button onClick={resetTimer} className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold bg-zinc-950/60 text-zinc-400 hover:text-white"><RotateCcw className="w-4 h-4" /> Reset</button>
          </div>
        </div>

        {/* Checklist */}
        <div className="flex flex-col gap-3">
          <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-widest pl-2">Today's Tasks</h4>
          {resources.map((res) => {
            const isSel = selectedResource?.id === res.id
            return (
              <div key={res.id} onClick={() => { setSelectedResource(res); setNoteContent(res.notes || '') }} className={`p-4 rounded-2xl border flex flex-col gap-3 cursor-pointer transition-all ${isSel ? `${theme.bg} ${theme.border} border-white/20` : 'bg-zinc-900/30 border-white/5'}`}>
                <div className="flex gap-4 w-full items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button onClick={(e) => { e.stopPropagation(); updateResourceMutation.mutate({ resourceId: res.id, payload: { is_completed: !res.is_completed } }) }}>
                      {res.is_completed ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <div className="w-5 h-5 rounded border-2 border-zinc-600" />}
                    </button>
                    <span className={`text-sm font-semibold ${res.is_completed ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>{res.title}</span>
                  </div>
                  <span className="text-[10px] font-bold text-zinc-400">{res.estimated_duration_mins}m</span>
                </div>
                {isSel && !res.is_completed && (
                  <div className="pt-2 flex justify-end">
                    <button onClick={(e) => { e.stopPropagation(); startSession(res.id); setTimerMode(res.estimated_duration_mins || 25); startTimer() }} className={`text-xs font-bold px-4 py-2 rounded-lg ${theme.btn}`}>Begin Mission</button>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* RIGHT COLUMN: Notes */}
      <div className="w-full lg:w-[45%] flex flex-col glass-panel rounded-3xl border border-white/10 overflow-hidden bg-zinc-950/15">
        {selectedResource ? (
          <div className="flex flex-col h-full">
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-zinc-900/30">
              <div className="flex items-center gap-2"><FileEdit className={`w-4 h-4 ${theme.text}`} /><span className="text-xs font-bold text-zinc-400 truncate max-w-[180px]">Notes: {selectedResource.title}</span></div>
              <span className="text-[10px] text-zinc-500 font-semibold">{savingStatus === 'saving' ? 'Autosaving...' : savingStatus === 'saved' ? 'Saved' : 'Synced'}</span>
            </div>
            <div className="flex-1 p-5"><textarea value={noteContent} onChange={handleNoteChange} placeholder="Write notes here... (Autosaves)" className="w-full h-full bg-transparent outline-none resize-none text-zinc-300 text-sm leading-relaxed" /></div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 gap-3"><AlertCircle className="w-8 h-8 text-zinc-600" /><h4 className="font-bold text-zinc-400 text-sm">No task selected</h4></div>
        )}
      </div>
    </div>
  )
}
