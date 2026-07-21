import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Flame, 
  Clock, 
  CheckSquare, 
  Calendar, 
  Sparkles, 
  Play, 
  ArrowRight,
  Award,
  Zap,
  ListTodo,
  AlertTriangle,
  CheckCircle2
} from 'lucide-react'
import { useActiveGoal, useGoalAnalytics, useTriggerRecovery } from '../hooks/useApi'
import { useUIStore } from '../store/uiStore'
import { useAuthStore } from '../store/authStore'

export const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const { accentColor } = useUIStore()
  const { userName } = useAuthStore()
  
  // Queries
  const { data: activeGoal, isLoading: isLoadingGoal } = useActiveGoal()
  const { data: analytics, isLoading: isLoadingAnalytics } = useGoalAnalytics(activeGoal?.id)
  const triggerRecoveryMutation = useTriggerRecovery()
  const [recoverySuccess, setRecoverySuccess] = useState(false)

  const parseTarget = (rawTarget: string | undefined) => {
    if (!rawTarget) return { displayTarget: 'None', details: null }
    if (rawTarget.includes(' | Experience Level:')) {
      const parts = rawTarget.split(' | ')
      const displayTarget = parts[0].replace('Target: ', '')
      const details = {
        experience: parts.find(p => p.startsWith('Experience Level:'))?.replace('Experience Level: ', '') || '',
        focus: parts.find(p => p.startsWith('Core Focus Areas:'))?.replace('Core Focus Areas: ', '') || '',
        style: parts.find(p => p.startsWith('Preferred Learning Style:'))?.replace('Preferred Learning Style: ', '') || ''
      }
      return { displayTarget, details }
    }
    return { displayTarget: rawTarget, details: null }
  }

  const { displayTarget, details: targetDetails } = parseTarget(activeGoal?.target)

  const getColorClass = (type: 'text' | 'bg' | 'border' | 'btn' | 'glow') => {
    switch (accentColor) {
      case 'cyan':
        if (type === 'text') return 'text-cyan-400'
        if (type === 'bg') return 'bg-cyan-500/10'
        if (type === 'border') return 'border-cyan-500/20'
        if (type === 'btn') return 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_15px_rgba(6,182,212,0.3)]'
        return 'from-cyan-500/20 to-blue-500/20'
      case 'emerald':
        if (type === 'text') return 'text-emerald-400'
        if (type === 'bg') return 'bg-emerald-500/10'
        if (type === 'border') return 'border-emerald-500/20'
        if (type === 'btn') return 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_15px_rgba(16,185,129,0.3)]'
        return 'from-emerald-500/20 to-teal-500/20'
      case 'blue':
        if (type === 'text') return 'text-blue-400'
        if (type === 'bg') return 'bg-blue-500/10'
        if (type === 'border') return 'border-blue-500/20'
        if (type === 'btn') return 'bg-blue-500 hover:bg-blue-400 text-black shadow-[0_0_15px_rgba(59,130,246,0.3)]'
        return 'from-blue-500/20 to-sky-500/20'
      case 'purple':
      default:
        if (type === 'text') return 'text-purple-400'
        if (type === 'bg') return 'bg-purple-500/10'
        if (type === 'border') return 'border-purple-500/20'
        if (type === 'btn') return 'bg-purple-500 hover:bg-purple-400 text-zinc-950 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
        return 'from-purple-500/20 to-indigo-500/20'
    }
  }

  // Handle redirects on loading completion
  if (!isLoadingGoal && !activeGoal) {
    // If no active goal exists, direct them to wizard onboarding
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center gap-6 px-4">
        <div className={`p-4 rounded-full ${getColorClass('bg')} border ${getColorClass('border')} animate-bounce`}>
          <Zap className={`w-10 h-10 ${getColorClass('text')}`} />
        </div>
        <div className="flex flex-col gap-2 max-w-md">
          <h2 className="text-2xl font-bold text-zinc-100">Welcome to myMentor!</h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Ready to structure your learning path, track progress, and gamify your study habits? Let's build your personalized curriculum!
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('/app/settings')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${getColorClass('btn')}`}
        >
          Get Started Onboarding <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    )
  }

  if (isLoadingGoal || isLoadingAnalytics || !activeGoal || !analytics) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-dashed border-zinc-500 animate-spin" />
      </div>
    )
  }

  // Circular progress ring constants
  const radius = 55
  const circumference = 2 * Math.PI * radius
  const strokeDashoffset = circumference - (analytics.overall_progress_percent / 100) * circumference

  // Motivational quote pool
  const quotes = [
    "Consistency is the compounding interest of self-improvement.",
    "The secret of getting ahead is getting started.",
    "You don't need a perfect plan, you just need to do Day 1.",
    "Focus on system loops, not just target endpoints.",
    "Small milestones stack up into massive career achievements.",
    "Your future self is built by your active Pomodoros today."
  ]
  const quoteOfTheDay = quotes[activeGoal.id % quotes.length]

  // Find Today's Day from activeGoal tracks
  let activeDay: any = null
  let upcomingResources: any[] = []

  if (activeGoal.tracks) {
    const allDays = []
    for (const track of activeGoal.tracks) {
      if (track.modules) {
        for (const mod of track.modules) {
          if (mod.days) {
            for (const day of mod.days) {
              allDays.push(day)
            }
          }
        }
      }
    }
    
    // Sort days by day number
    allDays.sort((a, b) => a.day_number - b.day_number)
    
    // Active Day is the first unlocked day that is not completed, or fallback to first unlocked
    activeDay = allDays.find(d => d.unlocked && !d.is_completed) || allDays.find(d => d.unlocked) || allDays[0]
    
    // Gather next 3 uncompleted upcoming resources
    const incompleteResources = []
    for (const day of allDays) {
      if (day.day_number >= (activeDay?.day_number || 1)) {
        if (day.resources) {
          for (const resource of day.resources) {
            if (!resource.is_completed) {
              incompleteResources.push({ ...resource, dayNumber: day.day_number })
            }
          }
        }
      }
    }
    upcomingResources = incompleteResources.slice(0, 3)
  }

  // Calculate greeting
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening'

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto py-4">
      {/* Dashboard Top Greeting Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
            {greeting}, {userName}
          </h2>
          <p className="text-zinc-500 font-medium mt-1">
            Track metrics and conquer your mission for Day {activeDay?.day_number || 1}.
          </p>
        </div>
        
        {/* Quick Study Launch button */}
        <button
          type="button"
          onClick={() => navigate('/app/today')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all cursor-pointer ${getColorClass('btn')}`}
        >
          <Play className="w-4 h-4 fill-zinc-950" /> Start Today's Mission
        </button>
      </div>

      {/* Dynamic Alerts (Recovery / Checkpoints) */}
      {recoverySuccess && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            <span><strong>Recovery Mode Activated:</strong> Timeline extended by 7 days and daily commitment load scaled down.</span>
          </div>
          <button onClick={() => setRecoverySuccess(false)} className="text-zinc-500 hover:text-zinc-300 font-bold text-xs uppercase cursor-pointer">Dismiss</button>
        </div>
      )}

      {analytics.recovery_recommended && !recoverySuccess && (
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-5 rounded-2xl bg-red-500/10 border border-red-500/20 text-sm gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-zinc-100">Study Gap Detected</h4>
              <p className="text-zinc-400 text-xs mt-0.5">You've been away for a couple of days. Trigger Recovery Mode to adjust your roadmap schedule and prevent burnout.</p>
            </div>
          </div>
          <button
            onClick={async () => {
              if (activeGoal) {
                try {
                  await triggerRecoveryMutation.mutateAsync(activeGoal.id)
                  setRecoverySuccess(true)
                } catch (e) {
                  alert("Failed to activate recovery mode.")
                }
              }
            }}
            disabled={triggerRecoveryMutation.isPending}
            className="px-4 py-2 rounded-xl bg-red-500 text-black hover:bg-red-400 font-bold text-xs shrink-0 cursor-pointer disabled:opacity-50"
          >
            {triggerRecoveryMutation.isPending ? 'Activating...' : 'Trigger Recovery Mode'}
          </button>
        </div>
      )}

      {analytics.checkpoint_celebration && analytics.last_completed_module && (
        <div className="flex items-center gap-4 p-5 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-sm">
          <div className={`p-2.5 rounded-xl ${getColorClass('bg')} border ${getColorClass('border')}`}>
            <Award className={`w-5 h-5 ${getColorClass('text')}`} />
          </div>
          <div>
            <h4 className="font-bold text-zinc-100">Checkpoint Reached! 🎉</h4>
            <p className="text-zinc-400 text-xs mt-0.5">
              You completed the module: <strong className="text-zinc-200">{analytics.last_completed_module}</strong>. Excellent progress! Keep moving forward.
            </p>
          </div>
        </div>
      )}

      {/* Grid: circular progress & daily statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Circular Progress Card */}
        <div className="lg:col-span-1 glass-panel rounded-3xl p-6 flex flex-col items-center justify-center relative overflow-hidden border border-white/5 bg-zinc-950/20">
          <div 
            className="absolute w-44 h-44 rounded-full blur-[80px] opacity-15 pointer-events-none -z-10"
            style={{ background: `radial-gradient(circle, ${accentColor === 'purple' ? '#a855f7' : accentColor === 'cyan' ? '#06b6d4' : accentColor === 'emerald' ? '#10b981' : '#3b82f6'} 0%, transparent 70%)` }}
          />
          <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest mb-6">Overall Progress</h3>
          
          <div className="relative flex items-center justify-center">
            {/* SVG Progress Arc */}
            <svg className="w-36 h-36 transform -rotate-90">
              <circle
                cx="72"
                cy="72"
                r={radius}
                className="stroke-zinc-800"
                strokeWidth="10"
                fill="transparent"
              />
              <circle
                cx="72"
                cy="72"
                r={radius}
                className="transition-all duration-700 ease-out"
                style={{
                  stroke: accentColor === 'purple' ? '#a855f7' : accentColor === 'cyan' ? '#06b6d4' : accentColor === 'emerald' ? '#10b981' : '#3b82f6',
                  strokeWidth: '10',
                  fill: 'transparent',
                  strokeDasharray: circumference,
                  strokeDashoffset: strokeDashoffset,
                  strokeLinecap: 'round'
                }}
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center text-center">
              <span className="text-3xl font-extrabold tracking-tight text-white">
                {analytics.overall_progress_percent}%
              </span>
              <span className="text-[10px] text-zinc-500 font-bold uppercase mt-0.5">Completed</span>
            </div>
          </div>
          
          <div className="flex gap-8 mt-6 border-t border-white/5 pt-4 w-full justify-center">
            <div className="flex flex-col items-center">
              <span className="text-xs text-zinc-500 font-semibold">Goal Status</span>
              <span className={`text-xs font-bold mt-1 ${getColorClass('text')}`}>{displayTarget}</span>
            </div>
            <div className="w-[1px] bg-white/5" />
            <div className="flex flex-col items-center">
              <span className="text-xs text-zinc-500 font-semibold">Remaining</span>
              <span className="text-xs font-bold text-zinc-200 mt-1">{analytics.days_remaining} Days</span>
            </div>
          </div>
        </div>



        {/* Highlight Grid (Streak, hours, xp, questions) */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-4">
          {/* Card 1: Streak */}
          <div className="glass-panel rounded-2xl p-5 border border-white/5 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20">
                <Flame className="w-6 h-6 text-orange-500 animate-streak-wobble" />
              </div>
              <div className="flex flex-col text-right">
                <span className="text-2xl font-extrabold text-white">{analytics.current_streak}</span>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">Day Streak</span>
              </div>
            </div>
            <div className="border-t border-white/5 pt-3 mt-4 flex justify-between text-xs text-zinc-500">
              <span>Longest Streak</span>
              <span className="font-bold text-zinc-300">{analytics.longest_streak} Days</span>
            </div>
          </div>

          {/* Card 2: Hours Studied */}
          <div className="glass-panel rounded-2xl p-5 border border-white/5 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className={`p-3 rounded-xl ${getColorClass('bg')} border ${getColorClass('border')}`}>
                <Clock className={`w-6 h-6 ${getColorClass('text')}`} />
              </div>
              <div className="flex flex-col text-right">
                <span className="text-2xl font-extrabold text-white">{analytics.total_hours_studied}h</span>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">Hours Studied</span>
              </div>
            </div>
            <div className="border-t border-white/5 pt-3 mt-4 flex justify-between text-xs text-zinc-500">
              <span>Daily target</span>
              <span className="font-bold text-zinc-300">{activeGoal.daily_hours}h / day</span>
            </div>
          </div>

          {/* Card 3: Resources Completed */}
          <div className="glass-panel rounded-2xl p-5 border border-white/5 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20">
                <CheckSquare className="w-6 h-6 text-blue-400" />
              </div>
              <div className="flex flex-col text-right">
                <span className="text-2xl font-extrabold text-white">{analytics.total_resources_completed}</span>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">Resources Done</span>
              </div>
            </div>
            <div className="border-t border-white/5 pt-3 mt-4 flex justify-between text-xs text-zinc-500">
              <span>Weakest Skill</span>
              <span className="font-bold text-zinc-300 truncate max-w-[80px]">{analytics.weakest_topic || 'None'}</span>
            </div>
          </div>

          {/* Card 4: Accumulated XP */}
          <div className="glass-panel rounded-2xl p-5 border border-white/5 flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20">
                <Award className="w-6 h-6 text-amber-400" />
              </div>
              <div className="flex flex-col text-right">
                <span className="text-2xl font-extrabold text-white">{analytics.xp} XP</span>
                <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">Total XP</span>
              </div>
            </div>
            <div className="border-t border-white/5 pt-3 mt-4 flex justify-between text-xs text-zinc-500">
              <span>Streak Badges</span>
              <span className="font-bold text-zinc-300">{analytics.streak_badges_count} Earned</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section: Mission and Upcoming Tasks */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Today's Mission & Quote card */}
        <div className="flex flex-col gap-6">
          {/* Today's Mission Info */}
          <div className="glass-panel rounded-3xl p-6 border border-white/5 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Calendar className={`w-5 h-5 ${getColorClass('text')}`} />
                <h3 className="font-bold text-zinc-200">Today's Mission</h3>
              </div>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${getColorClass('bg')} border ${getColorClass('border')} ${getColorClass('text')}`}>
                Day {activeDay?.day_number || 1}
              </span>
            </div>
            
            <div className="flex flex-col gap-2">
              <h4 className="text-lg font-bold text-white">{activeDay?.title || 'Review Day'}</h4>
              <p className="text-sm text-zinc-400 leading-relaxed mt-1">
                Configure your timers and check off {activeDay?.resources?.length || 0} topics in your agenda. Completion unlocks the next milestone day.
              </p>
            </div>
            
            <button 
              type="button"
              onClick={() => navigate('/app/today')}
              className="flex items-center justify-between p-4 rounded-2xl bg-zinc-950/60 hover:bg-zinc-900 border border-white/5 hover:border-white/10 text-left transition-all mt-2 cursor-pointer group"
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${getColorClass('bg')} border ${getColorClass('border')}`}>
                  <ListTodo className={`w-4 h-4 ${getColorClass('text')}`} />
                </div>
                <div>
                  <h5 className="text-sm font-semibold text-zinc-200">Go to Checklist</h5>
                  <span className="text-xs text-zinc-500 mt-0.5 block">{(activeDay?.resources || []).filter((r: any) => r.is_completed).length} / {(activeDay?.resources || []).length} Resources Completed</span>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-zinc-500 group-hover:text-zinc-300 transition-transform duration-200 group-hover:translate-x-1" />
            </button>
          </div>

          {/* Quote Panel */}
          <div className="glass-panel rounded-2xl p-5 border border-white/5 bg-zinc-900/10 flex items-center gap-4">
            <div className="p-3 rounded-full bg-purple-500/10 border border-purple-500/20 shrink-0">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-xs text-zinc-400 italic leading-relaxed">
              "{quoteOfTheDay}"
            </p>
          </div>
        </div>

        {/* Upcoming Agenda Queue */}
        <div className="glass-panel rounded-3xl p-6 border border-white/5 flex flex-col gap-5 justify-between">
          <div className="flex flex-col gap-4">
            <h3 className="font-bold text-zinc-200 flex items-center gap-2">
              <ListTodo className="w-5 h-5 text-zinc-400" /> Upcoming Resources
            </h3>
            
            <div className="flex flex-col gap-3">
              {upcomingResources.length > 0 ? (
                upcomingResources.map((t, idx) => (
                  <div 
                    key={t.id}
                    className="flex items-center justify-between p-4 rounded-2xl bg-zinc-950/30 border border-white/5 hover:border-white/10 hover:bg-zinc-950/50 transition-all cursor-pointer"
                    onClick={() => navigate('/app/today')}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full border border-white/10 bg-zinc-900 flex items-center justify-center font-bold text-xs text-zinc-400`}>
                        {idx + 1}
                      </div>
                      <div>
                        <h4 className="text-sm font-semibold text-zinc-200 truncate max-w-[200px]">{t.title}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-zinc-500 font-bold uppercase">Day {t.dayNumber}</span>
                          <span className="text-[10px] text-zinc-600 font-bold">•</span>
                          <span className="text-[10px] text-zinc-400 font-bold">{t.category}</span>
                        </div>
                      </div>
                    </div>
                    
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                      t.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      t.difficulty === 'Hard' ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                      'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                    }`}>
                      {t.difficulty}
                    </span>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-zinc-500 text-sm">
                  No upcoming resources left! Complete your active roadmap or modify timeline settings.
                </div>
              )}
            </div>
          </div>
          
          <button 
            type="button"
            onClick={() => navigate('/app/roadmap')}
            className="w-full text-center text-xs font-semibold text-zinc-500 hover:text-zinc-300 transition-colors mt-2"
          >
            View Full Roadmap Grid
          </button>
        </div>
      </div>
    </div>
  )
}
