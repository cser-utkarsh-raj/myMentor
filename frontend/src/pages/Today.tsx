import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Play, 
  Pause, 
  RotateCcw, 
  CheckCircle2, 
  FileEdit, 
  Clock, 
  Save, 
  AlertCircle,
  HelpCircle,
  BookOpen
} from 'lucide-react'
import { useActiveGoal, useUpdateTask, useLogStudySession, Day, Task } from '../hooks/useApi'
import { useUIStore } from '../store/uiStore'

export const Today: React.FC = () => {
  const { accentColor, timerMode, timerSecondsRemaining, timerIsRunning, setTimerMode, startTimer, pauseTimer, resetTimer, tickTimer } = useUIStore()
  
  // Queries & Mutations
  const { data: activeGoal, isLoading } = useActiveGoal()
  const updateTaskMutation = useUpdateTask()
  const logSessionMutation = useLogStudySession()

  // State management
  const [activeDay, setActiveDay] = useState<Day | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [noteContent, setNoteContent] = useState('')
  const [savingStatus, setSavingStatus] = useState<'idle' | 'typing' | 'saving' | 'saved'>('idle')
  
  const timerIntervalRef = useRef<any>(null)
  const typingTimeoutRef = useRef<any>(null)

  // Color mappings
  const getColorClass = (type: 'text' | 'bg' | 'border' | 'btn' | 'glow') => {
    switch (accentColor) {
      case 'cyan':
        if (type === 'text') return 'text-cyan-400'
        if (type === 'bg') return 'bg-cyan-500/10'
        if (type === 'border') return 'border-cyan-500/20'
        if (type === 'btn') return 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_15px_rgba(6,182,212,0.3)]'
        return 'rgba(6, 182, 212, 0.4)'
      case 'emerald':
        if (type === 'text') return 'text-emerald-400'
        if (type === 'bg') return 'bg-emerald-500/10'
        if (type === 'border') return 'border-emerald-500/20'
        if (type === 'btn') return 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]'
        return 'rgba(16, 185, 129, 0.4)'
      case 'purple':
      default:
        if (type === 'text') return 'text-purple-400'
        if (type === 'bg') return 'bg-purple-500/10'
        if (type === 'border') return 'border-purple-500/20'
        if (type === 'btn') return 'bg-purple-500 hover:bg-purple-400 text-zinc-950 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
        return 'rgba(168, 85, 247, 0.4)'
    }
  }

  // 1. Resolve Active Day on load
  useEffect(() => {
    if (activeGoal?.tracks) {
      const allDays: Day[] = []
      for (const track of activeGoal.tracks) {
        for (const ms of track.milestones) {
          for (const day of ms.days) {
            allDays.push(day)
          }
        }
      }
      allDays.sort((a, b) => a.day_number - b.day_number)
      
      // Active Day is the first unlocked day that is not completed
      const todayDay = allDays.find(d => d.unlocked && !d.is_completed) || allDays.find(d => d.unlocked) || allDays[0]
      setActiveDay(todayDay || null)
      
      // Auto-select first task if none is selected
      if (todayDay && todayDay.tasks.length > 0 && !selectedTask) {
        setSelectedTask(todayDay.tasks[0])
        setNoteContent(todayDay.tasks[0].notes || '')
      }
    }
  }, [activeGoal, selectedTask])

  // 2. Pomodoro Timer intervals logic
  useEffect(() => {
    if (timerIsRunning) {
      timerIntervalRef.current = setInterval(() => {
        tickTimer()
      }, 1000)
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    }
    
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current)
    }
  }, [timerIsRunning, tickTimer])

  // 3. Auto-save study session if timer hits 0
  useEffect(() => {
    if (timerSecondsRemaining === 0 && timerIsRunning) {
      handleCompleteTimer()
    }
  }, [timerSecondsRemaining, timerIsRunning])

  const handleCompleteTimer = async () => {
    if (activeGoal) {
      try {
        await logSessionMutation.mutateAsync({
          goal_id: activeGoal.id,
          duration_seconds: timerMode * 60,
          completed: true
        })
        alert(`Great work! You completed a ${timerMode} minute Pomodoro block and logged your study hours!`)
        resetTimer()
      } catch (e) {
        console.error(e)
      }
    }
  }

  // 4. Notes Autosave Debounce
  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value
    setNoteContent(value)
    setSavingStatus('typing')
    
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    
    typingTimeoutRef.current = setTimeout(async () => {
      if (selectedTask) {
        setSavingStatus('saving')
        try {
          await updateTaskMutation.mutateAsync({
            taskId: selectedTask.id,
            payload: { notes: value }
          })
          setSavingStatus('saved')
          setTimeout(() => setSavingStatus('idle'), 1500)
        } catch (e) {
          setSavingStatus('idle')
        }
      }
    }, 1000)
  }

  // Handle task toggles
  const handleToggleTask = async (task: Task) => {
    try {
      await updateTaskMutation.mutateAsync({
        taskId: task.id,
        payload: { is_completed: !task.is_completed }
      })
    } catch (e) {
      console.error(e)
    }
  }

  // Format Timer string
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-dashed border-zinc-500 animate-spin" />
      </div>
    )
  }

  if (!activeGoal || !activeDay) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[65vh] text-center gap-4">
        <h2 className="text-xl font-bold text-zinc-300">No active daily missions.</h2>
        <p className="text-sm text-zinc-500 max-w-sm">Setup a target profile or verify that your goal milestones aren't already completed.</p>
      </div>
    )
  }

  const completedCount = activeDay.tasks.filter(t => t.is_completed).length
  const totalCount = activeDay.tasks.length
  const todayProgress = Math.round((completedCount / (totalCount || 1)) * 100)

  return (
    <div className="flex flex-col lg:flex-row gap-6 w-full max-w-6xl mx-auto py-4 h-[calc(100vh-140px)]">
      
      {/* LEFT COLUMN: Mission Checklist & Pomodoro Timer */}
      <div className="w-full lg:w-[55%] flex flex-col gap-6 overflow-y-auto pr-1">
        
        {/* Day Mission Heading card */}
        <div className="glass-panel p-5 rounded-3xl border border-white/5 bg-zinc-950/20 relative overflow-hidden shrink-0">
          <div 
            className="absolute w-44 h-44 rounded-full blur-[85px] opacity-15 pointer-events-none -z-10"
            style={{ background: `radial-gradient(circle, ${getColorClass('glow')} 0%, transparent 70%)` }}
          />
          <div className="flex justify-between items-center mb-1">
            <span className={`text-[10px] font-black uppercase tracking-widest ${getColorClass('text')}`}>
              Active Learning Target
            </span>
            <span className="text-[10px] font-bold text-zinc-500">Day {activeDay.day_number} of {activeGoal.timeline_days}</span>
          </div>
          <h3 className="text-xl font-bold text-white leading-tight">{activeDay.title}</h3>
          
          <div className="flex flex-col gap-2 mt-4">
            <div className="flex justify-between text-xs font-bold text-zinc-400">
              <span>Day Completion Ratio</span>
              <span>{todayProgress}%</span>
            </div>
            <div className="w-full h-2 rounded-full bg-zinc-800 border border-white/5 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${
                  accentColor === 'purple' ? 'from-purple-500 to-indigo-500' :
                  accentColor === 'cyan' ? 'from-cyan-500 to-blue-500' :
                  'from-emerald-500 to-teal-500'
                }`}
                style={{ width: `${todayProgress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Pomodoro Timer widget */}
        <div className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col items-center gap-5 shrink-0">
          <div className="flex justify-between w-full items-center">
            <h4 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
              <Clock className="w-4 h-4 text-zinc-500" /> Focus Pomodoro
            </h4>
            
            {/* Presets */}
            <div className="flex gap-1.5 bg-zinc-950/60 p-1 rounded-xl border border-white/5">
              {[25, 45, 60, 90].map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setTimerMode(mode)}
                  disabled={timerIsRunning}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    timerMode === mode 
                      ? `${getColorClass('bg')} ${getColorClass('text')}` 
                      : 'text-zinc-500 hover:text-zinc-300'
                  } disabled:opacity-50`}
                >
                  {mode}m
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col items-center gap-2">
            <span className="text-5xl font-black font-mono tracking-wider text-white">
              {formatTime(timerSecondsRemaining)}
            </span>
            <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest mt-1">
              {timerIsRunning ? 'Session active - Stay Focused' : 'Timer Paused'}
            </span>
          </div>

          <div className="flex gap-3 w-full max-w-xs mt-1">
            {timerIsRunning ? (
              <button
                type="button"
                onClick={pauseTimer}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold bg-amber-500/10 border border-amber-500/20 text-amber-500 hover:bg-amber-500/20 transition-all cursor-pointer"
              >
                <Pause className="w-4 h-4 fill-amber-500" /> Pause
              </button>
            ) : (
              <button
                type="button"
                onClick={startTimer}
                className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold transition-all cursor-pointer ${getColorClass('btn')}`}
              >
                <Play className="w-4 h-4 fill-zinc-950" /> Focus
              </button>
            )}
            <button
              type="button"
              onClick={resetTimer}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl text-sm font-bold bg-zinc-950/60 border border-white/5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900 transition-all cursor-pointer"
            >
              <RotateCcw className="w-4 h-4" /> Reset
            </button>
          </div>
        </div>

        {/* Agenda tasks checklists */}
        <div className="flex flex-col gap-3">
          <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-widest pl-2">Checks for Today</h4>
          
          <div className="flex flex-col gap-3">
            {activeDay.tasks.map((task) => {
              const isSelected = selectedTask?.id === task.id
              return (
                <div 
                  key={task.id}
                  className={`p-4 rounded-2xl border flex gap-4 transition-all duration-200 cursor-pointer ${
                    isSelected 
                      ? `${getColorClass('bg')} ${getColorClass('border')} border-white/20 shadow-[0_0_12px_rgba(0,0,0,0.15)]` 
                      : 'bg-zinc-900/30 border-white/5 hover:bg-zinc-900/60'
                  }`}
                  onClick={() => {
                    setSelectedTask(task)
                    setNoteContent(task.notes || '')
                  }}
                >
                  <button 
                    type="button" 
                    className="mt-0.5 shrink-0 cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleTask(task)
                    }}
                  >
                    {task.is_completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <div className="w-5 h-5 rounded-md border-2 border-zinc-600 hover:border-zinc-400 flex items-center justify-center transition-colors" />
                    )}
                  </button>

                  <div className="flex flex-col gap-1 w-full">
                    <h5 className={`text-sm font-semibold leading-snug ${task.is_completed ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                      {task.title}
                    </h5>
                    
                    <div className="flex items-center justify-between w-full mt-2">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase">{task.category}</span>
                        <span className="text-[10px] text-zinc-700 font-bold">•</span>
                        <span className={`text-[10px] font-bold uppercase ${
                          task.difficulty === 'Easy' ? 'text-emerald-400' :
                          task.difficulty === 'Hard' ? 'text-red-400' : 'text-amber-400'
                        }`}>{task.difficulty}</span>
                      </div>
                      
                      {task.revision_count > 0 && (
                        <span className="text-[10px] text-purple-400 font-bold uppercase">
                          {task.revision_count} Revisions
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: Notion-Style Autosaving Notes Editor */}
      <div className="w-full lg:w-[45%] flex flex-col glass-panel rounded-3xl border border-white/10 overflow-hidden bg-zinc-950/15">
        {selectedTask ? (
          <div className="flex flex-col h-full">
            {/* Notes Header info */}
            <div className="p-5 border-b border-white/5 flex justify-between items-center bg-zinc-900/30">
              <div className="flex items-center gap-2.5">
                <FileEdit className={`w-4 h-4 ${getColorClass('text')}`} />
                <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider truncate max-w-[180px]">
                  Notes: {selectedTask.title}
                </span>
              </div>
              
              {/* Autosaving indicators */}
              <div className="flex items-center gap-1.5">
                {savingStatus === 'typing' && (
                  <span className="text-[10px] text-zinc-500 font-semibold">Typing...</span>
                )}
                {savingStatus === 'saving' && (
                  <span className="text-[10px] text-zinc-400 font-bold animate-pulse">Autosaving...</span>
                )}
                {savingStatus === 'saved' && (
                  <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Saved
                  </span>
                )}
                {savingStatus === 'idle' && (
                  <span className="text-[10px] text-zinc-650 font-semibold">Synced</span>
                )}
              </div>
            </div>

            {/* Note text area editor */}
            <div className="flex-1 p-5 relative">
              <textarea
                value={noteContent}
                onChange={handleNoteChange}
                placeholder="Write down notes, code snippets, key insights, or markdown summaries here... (Autosaves automatically)"
                className="w-full h-full bg-transparent border-0 outline-none resize-none text-zinc-300 text-sm leading-relaxed placeholder-zinc-650"
              />
            </div>
            
            {/* Revision / Estimate tuning footer */}
            <div className="p-4 border-t border-white/5 bg-zinc-900/20 flex justify-between items-center text-xs text-zinc-500">
              <div className="flex items-center gap-2">
                <span>Revision Count:</span>
                <button
                  type="button"
                  onClick={async () => {
                    const currentVal = selectedTask.revision_count
                    await updateTaskMutation.mutateAsync({
                      taskId: selectedTask.id,
                      payload: { revision_count: currentVal + 1 }
                    })
                  }}
                  className="px-2 py-0.5 rounded bg-zinc-800 border border-white/5 font-bold hover:text-zinc-200 hover:bg-zinc-750 transition-colors"
                >
                  + Log Revision ({selectedTask.revision_count})
                </button>
              </div>
              <span>Est. time: {selectedTask.estimated_time_mins}m</span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center p-8 gap-3">
            <AlertCircle className="w-8 h-8 text-zinc-600 animate-bounce" />
            <h4 className="font-bold text-zinc-400 text-sm">No task selected</h4>
            <p className="text-xs text-zinc-650 max-w-[200px]">Click any item in your daily checklist to open its notes panel.</p>
          </div>
        )}
      </div>
    </div>
  )
}
