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
import { getColorClasses } from '../lib/theme'

export const Dashboard: React.FC = () => {
  const navigate = useNavigate()
  const { accentColor } = useUIStore()
  const theme = getColorClasses(accentColor)
  const { userName } = useAuthStore()

  const { data: activeGoal, isLoading: isLoadingGoal } = useActiveGoal()
  const { data: analytics, isLoading: isLoadingAnalytics } = useGoalAnalytics(activeGoal?.id)
  const triggerRecoveryMutation = useTriggerRecovery()
  const [recoverySuccess, setRecoverySuccess] = useState(false)

  const parseTarget = (rawTarget: string | undefined | null) => {
    if (!rawTarget) return { displayTarget: 'None', details: null }
    if (rawTarget.includes(' | Experience Level:')) {
      const parts = rawTarget.split(' | ')
      return {
        displayTarget: parts[0].replace('Target: ', ''),
        details: {
          experience: parts.find(p => p.startsWith('Experience Level:'))?.replace('Experience Level: ', '') || '',
          focus: parts.find(p => p.startsWith('Core Focus Areas:'))?.replace('Core Focus Areas: ', '') || '',
          style: parts.find(p => p.startsWith('Preferred Learning Style:'))?.replace('Preferred Learning Style: ', '') || ''
        }
      }
    }
    return { displayTarget: rawTarget, details: null }
  }

  const { displayTarget, details: targetDetails } = parseTarget(activeGoal?.target)

  if (!isLoadingGoal && !activeGoal) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] text-center gap-6 px-4">
        <div className={`p-4 rounded-full ${theme.bg} border ${theme.border} animate-bounce`}>
          <Zap className={`w-10 h-10 ${theme.text}`} />
        </div>
        <div className="flex flex-col gap-2 max-w-md">
          <h2 className="text-2xl font-bold text-zinc-100">Welcome to myMentor!</h2>
          <p className="text-sm text-zinc-400 leading-relaxed">Ready to structure your learning path? Let's build your personalized curriculum!</p>
        </div>
        <button type="button" onClick={() => navigate('/setup')} className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm ${theme.btn}`}>
          Get Started Onboarding <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    )
  }

  if (isLoadingGoal || isLoadingAnalytics || !activeGoal || !analytics) {
    return <div className="flex items-center justify-center min-h-[60vh]"><div className="w-8 h-8 rounded-full border-2 border-dashed border-zinc-500 animate-spin" /></div>
  }

  const quotes = [
    "Consistency is what transforms average into excellence.",
    "Small daily improvements stack up into massive career achievements.",
    "Focus on system loops, not just target endpoints."
  ]
  const quoteOfTheDay = quotes[activeGoal.id % quotes.length]

  let activeDay: any = null, upcomingResources: any[] = []
  if (activeGoal.tracks) {
    const allDays: any[] = []
    activeGoal.tracks.forEach(t => t.modules?.forEach(m => m.days?.forEach(d => allDays.push(d))))
    allDays.sort((a, b) => a.day_number - b.day_number)
    activeDay = allDays.find(d => d.unlocked && !d.is_completed) || allDays.find(d => d.unlocked) || allDays[0]
    const inc: any[] = []
    allDays.forEach(d => {
      if (d.day_number >= (activeDay?.day_number || 1)) {
        d.resources?.forEach((r: any) => { if (!r.is_completed) inc.push({ ...r, dayNumber: d.day_number }) })
      }
    })
    upcomingResources = inc.slice(0, 3)
  }

  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good Morning' : hour < 18 ? 'Good Afternoon' : 'Good Evening'

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto py-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-zinc-200 to-zinc-400">
            {greeting}, {(!userName || userName === 'Mentor Client') ? 'Mentee' : userName}
          </h2>
          <p className="text-zinc-500 font-medium mt-1">Track metrics and conquer your mission for Day {activeDay?.day_number || 1}.</p>
        </div>
        <button type="button" onClick={() => navigate('/app/today')} className={`flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm cursor-pointer ${theme.btn}`}>
          <Play className="w-4 h-4 fill-zinc-950" /> Start Today's Mission
        </button>
      </div>

      {/* Recovery Alert */}
      {analytics.recovery_recommended && !recoverySuccess && (
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between p-5 rounded-2xl bg-red-500/10 border border-red-500/20 text-sm gap-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
            <div>
              <h4 className="font-bold text-zinc-100">Study Gap Detected</h4>
              <p className="text-zinc-400 text-xs mt-0.5">Trigger Recovery Mode to adjust your schedule and prevent burnout.</p>
            </div>
          </div>
          <button onClick={async () => { try { await triggerRecoveryMutation.mutateAsync(activeGoal.id); setRecoverySuccess(true) } catch {} }} className="px-4 py-2 rounded-xl bg-red-500 text-black font-bold text-xs">
            Trigger Recovery
          </button>
        </div>
      )}

      {/* Overall Goal Progress Banner */}
      <div className="glass-panel rounded-3xl p-6 border border-white/10 bg-zinc-950/40 relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-[10px] font-black uppercase tracking-widest ${theme.text}`}>Active Odyssey Goal</span>
              <span className="text-[10px] font-bold text-zinc-500">• {analytics.days_remaining} Days Remaining</span>
            </div>
            <h3 className="text-xl font-bold text-white">{activeGoal.title}</h3>
            {displayTarget && <p className="text-xs text-zinc-400 mt-0.5 font-medium">Target: {displayTarget}</p>}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-3xl font-black font-mono text-white">{Math.round(analytics.overall_progress_percent)}%</span>
            <span className="text-xs font-bold text-zinc-500 uppercase">Overall<br/>Progress</span>
          </div>
        </div>
        <div className="w-full h-3 rounded-full bg-zinc-900 border border-white/10 overflow-hidden">
          <div className={`h-full rounded-full transition-all duration-700 bg-gradient-to-r ${theme.gradient}`} style={{ width: `${Math.max(5, analytics.overall_progress_percent)}%` }} />
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel rounded-2xl p-5 border border-white/5 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className={`p-3 rounded-xl ${theme.bg} border ${theme.border}`}><span className="text-lg">🔥</span></div>
            <div className="flex flex-col text-right"><span className="text-2xl font-extrabold text-white">{analytics.current_streak}d</span><span className="text-[10px] text-zinc-500 font-bold uppercase">Streak</span></div>
          </div>
          <div className="border-t border-white/5 pt-3 mt-4 flex justify-between text-xs text-zinc-500"><span>Longest Streak</span><span className="font-bold text-zinc-300">{analytics.longest_streak} Days</span></div>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-white/5 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className={`p-3 rounded-xl ${theme.bg} border ${theme.border}`}><Clock className={`w-6 h-6 ${theme.text}`} /></div>
            <div className="flex flex-col text-right"><span className="text-2xl font-extrabold text-white">{analytics.total_hours_studied}h</span><span className="text-[10px] text-zinc-500 font-bold uppercase">Hours Studied</span></div>
          </div>
          <div className="border-t border-white/5 pt-3 mt-4 flex justify-between text-xs text-zinc-500"><span>Daily Target</span><span className="font-bold text-zinc-300">{activeGoal.daily_hours}h / day</span></div>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-white/5 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="p-3 rounded-xl bg-blue-500/10 border border-blue-500/20"><CheckSquare className="w-6 h-6 text-blue-400" /></div>
            <div className="flex flex-col text-right"><span className="text-2xl font-extrabold text-white">{analytics.total_resources_completed}</span><span className="text-[10px] text-zinc-500 font-bold uppercase">Resources Done</span></div>
          </div>
          <div className="border-t border-white/5 pt-3 mt-4 flex justify-between text-xs text-zinc-500"><span>Weakest Skill</span><span className="font-bold text-zinc-300 truncate max-w-[80px]">{analytics.weakest_topic || 'None'}</span></div>
        </div>

        <div className="glass-panel rounded-2xl p-5 border border-white/5 flex flex-col justify-between">
          <div className="flex justify-between items-start">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20"><Award className="w-6 h-6 text-amber-400" /></div>
            <div className="flex flex-col text-right"><span className="text-2xl font-extrabold text-white">{analytics.xp} XP</span><span className="text-[10px] text-zinc-500 font-bold uppercase">Total XP</span></div>
          </div>
          <div className="border-t border-white/5 pt-3 mt-4 flex justify-between text-xs text-zinc-500"><span>Badges</span><span className="font-bold text-zinc-300">{analytics.streak_badges_count} Earned</span></div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="flex flex-col gap-6">
          <div className="glass-panel rounded-3xl p-6 border border-white/5 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2"><Calendar className={`w-5 h-5 ${theme.text}`} /><h3 className="font-bold text-zinc-200">Today's Mission</h3></div>
              <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${theme.bg} ${theme.border} ${theme.text}`}>Day {activeDay?.day_number || 1}</span>
            </div>
            <h4 className="text-lg font-bold text-white">{activeDay?.title || 'Review Day'}</h4>
            <button type="button" onClick={() => navigate('/app/today')} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-950/60 hover:bg-zinc-900 border border-white/5 text-left transition-all mt-2 cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${theme.bg} border ${theme.border}`}><ListTodo className={`w-4 h-4 ${theme.text}`} /></div>
                <div><h5 className="text-sm font-semibold text-zinc-200">Go to Checklist</h5></div>
              </div>
              <ArrowRight className="w-5 h-5 text-zinc-500 group-hover:text-zinc-300" />
            </button>
          </div>

          <div className="glass-panel rounded-2xl p-5 border border-white/5 bg-zinc-900/10 flex items-center gap-4">
            <div className="p-3 rounded-full bg-purple-500/10 border border-purple-500/20 shrink-0"><Sparkles className="w-5 h-5 text-purple-400" /></div>
            <p className="text-xs text-zinc-400 italic">"{quoteOfTheDay}"</p>
          </div>
        </div>

        <div className="glass-panel rounded-3xl p-6 border border-white/5 flex flex-col gap-5 justify-between">
          <div className="flex flex-col gap-4">
            <h3 className="font-bold text-zinc-200 flex items-center gap-2"><ListTodo className="w-5 h-5 text-zinc-400" /> Upcoming Resources</h3>
            <div className="flex flex-col gap-3">
              {upcomingResources.map((t, idx) => (
                <div key={t.id} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-950/30 border border-white/5 hover:bg-zinc-950/50 cursor-pointer" onClick={() => navigate('/app/today')}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full border border-white/10 bg-zinc-900 flex items-center justify-center font-bold text-xs text-zinc-400">{idx + 1}</div>
                    <div><h4 className="text-sm font-semibold text-zinc-200 truncate max-w-[200px]">{t.title}</h4><span className="text-[10px] text-zinc-500 font-bold uppercase">Day {t.dayNumber} • {t.category}</span></div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400">{t.difficulty}</span>
                </div>
              ))}
            </div>
          </div>
          <button type="button" onClick={() => navigate('/app/roadmap')} className="w-full text-center text-xs font-semibold text-zinc-500 hover:text-zinc-300">View Full Roadmap Grid</button>
        </div>
      </div>
    </div>
  )
}
