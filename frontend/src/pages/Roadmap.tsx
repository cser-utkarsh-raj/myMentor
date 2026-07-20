import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Lock, 
  Unlock, 
  CheckCircle2, 
  X, 
  CheckSquare, 
  Square,
  BookOpen,
  ArrowRight,
  Flame,
  Award
} from 'lucide-react'
import { useActiveGoal, useUpdateTask, Goal, Day, Task } from '../hooks/useApi'
import { useUIStore } from '../store/uiStore'

export const Roadmap: React.FC = () => {
  const { accentColor } = useUIStore()
  const { data: activeGoal, isLoading } = useActiveGoal()
  const updateTaskMutation = useUpdateTask()
  
  const [selectedDay, setSelectedDay] = useState<Day | null>(null)

  const getColorClass = (type: 'text' | 'bg' | 'border' | 'btn' | 'glow') => {
    switch (accentColor) {
      case 'cyan':
        if (type === 'text') return 'text-cyan-400'
        if (type === 'bg') return 'bg-cyan-500/10'
        if (type === 'border') return 'border-cyan-500/20'
        if (type === 'btn') return 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_15px_rgba(6,182,212,0.3)]'
        return 'rgba(6, 182, 212, 0.2)'
      case 'emerald':
        if (type === 'text') return 'text-emerald-400'
        if (type === 'bg') return 'bg-emerald-500/10'
        if (type === 'border') return 'border-emerald-500/20'
        if (type === 'btn') return 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]'
        return 'rgba(16, 185, 129, 0.2)'
      case 'purple':
      default:
        if (type === 'text') return 'text-purple-400'
        if (type === 'bg') return 'bg-purple-500/10'
        if (type === 'border') return 'border-purple-500/20'
        if (type === 'btn') return 'bg-purple-500 hover:bg-purple-400 text-zinc-950 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
        return 'rgba(168, 85, 247, 0.2)'
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-dashed border-zinc-500 animate-spin" />
      </div>
    )
  }

  if (!activeGoal) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <h2 className="text-xl font-bold text-zinc-350">No active roadmap found.</h2>
        <p className="text-sm text-zinc-500 max-w-sm">Please set up a career learning goal in settings to build your customized timeline curriculum.</p>
      </div>
    )
  }

  // Handle task toggling from within the day details modal
  const handleToggleTask = async (task: Task) => {
    try {
      const updated = await updateTaskMutation.mutateAsync({
        taskId: task.id,
        payload: { is_completed: !task.is_completed }
      })
      
      // Update local modal state to reflect task completion immediately
      if (selectedDay) {
        const updatedTasks = selectedDay.tasks.map(t => t.id === task.id ? updated : t)
        const isDayDone = updatedTasks.every(t => t.is_completed)
        setSelectedDay({
          ...selectedDay,
          tasks: updatedTasks,
          is_completed: isDayDone
        })
      }
    } catch (e) {
      console.error(e)
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto py-4">
      {/* Page Header */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
          Roadmap Timeline
        </h2>
        <p className="text-zinc-500 font-medium mt-1">
          Explore tracks and milestones. Click any day card to view topics and complete tasks.
        </p>
      </div>

      {/* Relational Hierarchy layout */}
      <div className="flex flex-col gap-10 mt-4">
        {activeGoal.tracks && activeGoal.tracks.map((track) => (
          <div key={track.id} className="flex flex-col gap-6 border-b border-white/5 pb-10 last:border-0 last:pb-0">
            {/* Track Title banner */}
            <div className="flex flex-col gap-1.5 p-5 rounded-2xl bg-zinc-950/20 border border-white/5 relative overflow-hidden">
              <div 
                className="absolute w-60 h-20 rounded-full blur-[60px] opacity-15 pointer-events-none -z-10"
                style={{ background: `radial-gradient(circle, ${getColorClass('glow')} 0%, transparent 70%)` }}
              />
              <span className={`text-[10px] font-bold uppercase tracking-widest ${getColorClass('text')}`}>
                Track {track.order}
              </span>
              <h3 className="text-xl font-bold text-white">{track.title}</h3>
              <p className="text-xs text-zinc-400 max-w-2xl leading-relaxed mt-0.5">{track.description}</p>
            </div>

            {/* Milestones in Track */}
            <div className="flex flex-col gap-8 pl-4 border-l border-white/5">
              {track.milestones.map((ms) => (
                <div key={ms.id} className="flex flex-col gap-4">
                  <div className="flex flex-col">
                    <h4 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-zinc-500" /> {ms.title}
                    </h4>
                    {ms.description && (
                      <p className="text-xs text-zinc-500 mt-1 max-w-xl">{ms.description}</p>
                    )}
                  </div>

                  {/* Day Cards Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-2">
                    {ms.days.map((day) => {
                      const completedCount = day.tasks.filter(t => t.is_completed).length
                      const totalCount = day.tasks.length
                      
                      let cardStyle = 'border-white/5 bg-zinc-950/20 opacity-40'
                      let borderGlow = ''
                      
                      if (day.is_completed) {
                        cardStyle = 'border-emerald-500/30 bg-emerald-500/5 hover:border-emerald-500/50 hover:bg-emerald-500/10 cursor-pointer'
                        borderGlow = 'shadow-[0_0_15px_rgba(16,185,129,0.15)]'
                      } else if (day.unlocked) {
                        cardStyle = `border-zinc-700/60 hover:border-white/20 bg-zinc-900/40 hover:bg-zinc-900/80 cursor-pointer`
                        if (accentColor === 'purple') borderGlow = 'shadow-[0_0_15px_rgba(168,85,247,0.15)] hover:border-purple-500/30'
                        else if (accentColor === 'cyan') borderGlow = 'shadow-[0_0_15px_rgba(6,182,212,0.15)] hover:border-cyan-500/30'
                        else borderGlow = 'shadow-[0_0_15px_rgba(16,185,129,0.15)] hover:border-emerald-500/30'
                      }

                      return (
                        <motion.div
                          key={day.id}
                          whileHover={day.unlocked ? { scale: 1.02 } : {}}
                          whileTap={day.unlocked ? { scale: 0.98 } : {}}
                          onClick={() => day.unlocked && setSelectedDay(day)}
                          className={`p-4 rounded-2xl border flex flex-col justify-between min-h-[140px] transition-all duration-300 relative overflow-hidden ${cardStyle} ${borderGlow}`}
                        >
                          <div className="flex justify-between items-start">
                            <span className="text-2xl font-black text-zinc-700 tracking-tight">
                              Day {day.day_number}
                            </span>
                            <div>
                              {day.is_completed ? (
                                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                              ) : day.unlocked ? (
                                <Unlock className={`w-4 h-4 ${getColorClass('text')}`} />
                              ) : (
                                <Lock className="w-4 h-4 text-zinc-600" />
                              )}
                            </div>
                          </div>

                          <div className="flex flex-col gap-2 mt-4">
                            <h5 className="font-bold text-xs text-zinc-300 line-clamp-1">
                              {day.title}
                            </h5>
                            
                            {day.unlocked ? (
                              <div className="flex justify-between items-center text-[10px] text-zinc-500 font-bold uppercase mt-1">
                                <span>Tasks</span>
                                <span>{completedCount} / {totalCount}</span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-zinc-600 font-semibold uppercase mt-1">Locked</span>
                            )}

                            {/* Progress Microbar */}
                            {day.unlocked && (
                              <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden mt-0.5">
                                <div 
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    day.is_completed ? 'bg-emerald-500' :
                                    accentColor === 'purple' ? 'bg-purple-500' :
                                    accentColor === 'cyan' ? 'bg-cyan-500' : 'bg-emerald-500'
                                  }`}
                                  style={{ width: `${(completedCount / (totalCount || 1)) * 100}%` }}
                                />
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Day Details Modal Overlay */}
      <AnimatePresence>
        {selectedDay && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
            {/* Modal Box */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="w-full max-w-xl glass-panel rounded-3xl p-6 border border-white/10 flex flex-col gap-6 relative"
            >
              {/* Close button */}
              <button 
                type="button"
                onClick={() => setSelectedDay(null)}
                className="absolute top-4 right-4 p-2 rounded-full hover:bg-white/5 border border-transparent hover:border-white/10 text-zinc-400 hover:text-white transition-all cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Modal Header */}
              <div className="flex flex-col gap-1">
                <span className={`text-[10px] font-black uppercase tracking-widest ${selectedDay.is_completed ? 'text-emerald-400' : getColorClass('text')}`}>
                  {selectedDay.is_completed ? 'Day Completed (+100 XP)' : `Day ${selectedDay.day_number} Active`}
                </span>
                <h3 className="text-xl font-bold text-white pr-8">{selectedDay.title}</h3>
                <p className="text-xs text-zinc-500">Check off individual tasks to log XP and unlock the next roadmap levels.</p>
              </div>

              {/* Tasks List */}
              <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
                {selectedDay.tasks.map((task) => (
                  <div 
                    key={task.id}
                    onClick={() => handleToggleTask(task)}
                    className={`flex items-start gap-4 p-4 rounded-2xl border text-left cursor-pointer transition-all ${
                      task.is_completed 
                        ? 'bg-emerald-500/5 border-emerald-500/10 hover:border-emerald-500/30' 
                        : 'bg-zinc-950/40 border-white/5 hover:bg-zinc-900/60 hover:border-white/10'
                    }`}
                  >
                    <button type="button" className="mt-0.5 shrink-0">
                      {task.is_completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      ) : (
                        <div className="w-5 h-5 rounded-md border-2 border-zinc-600 hover:border-zinc-400 flex items-center justify-center transition-colors" />
                      )}
                    </button>
                    
                    <div className="flex flex-col gap-1">
                      <h4 className={`text-sm font-semibold leading-snug ${task.is_completed ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                        {task.title}
                      </h4>
                      {task.notes && (
                        <p className="text-xs text-zinc-500 leading-relaxed mt-0.5">{task.notes}</p>
                      )}
                      
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-zinc-500 font-bold uppercase">{task.category}</span>
                        <span className="text-[10px] text-zinc-700 font-bold">•</span>
                        <span className={`text-[10px] font-bold uppercase ${
                          task.difficulty === 'Easy' ? 'text-emerald-400' :
                          task.difficulty === 'Hard' ? 'text-red-400' : 'text-amber-400'
                        }`}>{task.difficulty}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Modal Footer actions */}
              <div className="flex justify-between items-center border-t border-white/5 pt-4">
                <span className="text-xs text-zinc-500 font-medium">
                  {selectedDay.tasks.filter(t => t.is_completed).length} / {selectedDay.tasks.length} Completed
                </span>
                
                <button
                  type="button"
                  onClick={() => setSelectedDay(null)}
                  className={`px-5 py-2 rounded-xl text-xs font-bold ${getColorClass('btn')}`}
                >
                  Close Day View
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
