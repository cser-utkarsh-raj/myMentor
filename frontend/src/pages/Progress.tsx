import React from 'react'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts'
import { 
  Flame, 
  Clock, 
  Award, 
  CheckCircle2, 
  TrendingUp, 
  Activity,
  AlertTriangle,
  RefreshCcw
} from 'lucide-react'
import { useActiveGoal, useGoalAnalytics } from '../hooks/useApi'
import { useUIStore } from '../store/uiStore'

export const Progress: React.FC = () => {
  const { accentColor } = useUIStore()
  const { data: activeGoal, isLoading: isLoadingGoal } = useActiveGoal()
  const { data: analytics, isLoading: isLoadingAnalytics } = useGoalAnalytics(activeGoal?.id)

  const getColorClass = (type: 'text' | 'bg' | 'border' | 'fill' | 'stroke') => {
    switch (accentColor) {
      case 'cyan':
        if (type === 'text') return 'text-cyan-400'
        if (type === 'bg') return 'bg-cyan-500/10'
        if (type === 'border') return 'border-cyan-500/20'
        if (type === 'fill') return '#06b6d4'
        return 'rgba(6, 182, 212, 0.4)'
      case 'emerald':
        if (type === 'text') return 'text-emerald-400'
        if (type === 'bg') return 'bg-emerald-500/10'
        if (type === 'border') return 'border-emerald-500/20'
        if (type === 'fill') return '#10b981'
        return 'rgba(16, 185, 129, 0.4)'
      case 'blue':
        if (type === 'text') return 'text-blue-400'
        if (type === 'bg') return 'bg-blue-500/10'
        if (type === 'border') return 'border-blue-500/20'
        if (type === 'fill') return '#3b82f6'
        return 'rgba(59, 130, 246, 0.4)'
      case 'purple':
      default:
        if (type === 'text') return 'text-purple-400'
        if (type === 'bg') return 'bg-purple-500/10'
        if (type === 'border') return 'border-purple-500/20'
        if (type === 'fill') return '#a855f7'
        return 'rgba(168, 85, 247, 0.4)'
    }
  }

  if (isLoadingGoal || isLoadingAnalytics) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-dashed border-zinc-500 animate-spin" />
      </div>
    )
  }

  if (!activeGoal || !analytics) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-4">
        <h2 className="text-xl font-bold text-zinc-350">No progress logs found.</h2>
        <p className="text-sm text-zinc-500 max-w-sm">Onboard your career targets in settings to activate learning analytics tracking.</p>
      </div>
    )
  }

  // 1. Weekly hours Chart mapping
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const chartData = daysOfWeek.map((day, idx) => ({
    name: day,
    hours: analytics.weekly_study_hours[idx] || 0.0
  }))

  // 2. Contributions Grid (GitHub Heatmap simulation)
  // Let's generate past 77 days (11 weeks) to simulate a complete calendar block grid
  const heatmapGrid = []
  const today = new Date()
  
  // Create a map of date-string to statistic object
  const statsMap: Record<string, typeof analytics.heatmap[0]> = {}
  analytics.heatmap.forEach((item) => {
    statsMap[item.date] = item
  })
  
  for (let i = 76; i >= 0; i--) {
    const d = new Date()
    d.setDate(today.getDate() - i)
    const isoString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const stat = statsMap[isoString]
    
    heatmapGrid.push({
      date: isoString,
      count: stat ? stat.count : 0,
      xp: stat ? stat.xp : 0,
      hours: stat ? stat.hours : 0.0
    })
  }

  // Heatmap color shading resolver
  const getShadingClass = (xp: number) => {
    if (xp === 0) return 'fill-zinc-900 border-zinc-800'
    if (xp < 30) {
      return accentColor === 'purple' ? 'fill-purple-950/40' :
             accentColor === 'cyan' ? 'fill-cyan-950/40' :
             accentColor === 'blue' ? 'fill-blue-950/40' : 'fill-emerald-950/40'
    }
    if (xp < 100) {
      return accentColor === 'purple' ? 'fill-purple-800/60' :
             accentColor === 'cyan' ? 'fill-cyan-800/60' :
             accentColor === 'blue' ? 'fill-blue-800/60' : 'fill-emerald-800/60'
    }
    return accentColor === 'purple' ? 'fill-purple-500 shadow-lg' :
           accentColor === 'cyan' ? 'fill-cyan-500 shadow-lg' :
           accentColor === 'blue' ? 'fill-blue-500 shadow-lg' : 'fill-emerald-500 shadow-lg'
  }

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto py-4">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
          Progress & Analytics
        </h2>
        <p className="text-zinc-500 font-medium mt-1">
          Review core statistics, study consistency grids, and sub-category completion ratings.
        </p>
      </div>

      {/* Analytics Summary banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Weekly average */}
        <div className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Weekly study hours</span>
          <h3 className="text-2xl font-extrabold text-white mt-2">
            {analytics.weekly_study_hours.reduce((a, b) => a + b, 0).toFixed(1)} Hours
          </h3>
          <span className="text-[10px] text-zinc-500 font-semibold mt-1">Goal: {activeGoal.daily_hours * 7}h / week</span>
        </div>

        {/* Total days studied */}
        <div className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Active learning days</span>
          <h3 className="text-2xl font-extrabold text-white mt-2">
            {analytics.heatmap.filter(h => h.hours > 0).length} Days
          </h3>
          <span className="text-[10px] text-zinc-500 font-semibold mt-1">Target timeline: {activeGoal.timeline_days} days</span>
        </div>

        {/* Weakest skill */}
        <div className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> Focus Needed
          </span>
          <h3 className="text-2xl font-extrabold text-white mt-2 truncate">
            {analytics.weakest_topic || 'All clear'}
          </h3>
          <span className="text-[10px] text-zinc-500 font-semibold mt-1">Lowest checklist completion %</span>
        </div>

        {/* Most revised */}
        <div className="glass-panel p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
          <span className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider flex items-center gap-1">
            <RefreshCcw className="w-3.5 h-3.5 text-purple-400" /> Most Revised
          </span>
          <h3 className="text-2xl font-extrabold text-white mt-2 truncate">
            {analytics.most_revised_topic || 'None'}
          </h3>
          <span className="text-[10px] text-zinc-500 font-semibold mt-1">Highest total repetition count</span>
        </div>
      </div>

      {/* Grid: Heatmap Contributions Grid & Weekly Hours chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* GitHub style contributions Grid card */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-white/5 flex flex-col gap-6">
          <div className="flex justify-between items-center">
            <h4 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
              <Activity className="w-4 h-4 text-zinc-500" /> Consistency Grid
            </h4>
            <span className="text-[10px] text-zinc-500 font-bold uppercase">Past 11 Weeks</span>
          </div>
          
          {/* Heatmap block layout */}
          <div className="flex flex-col items-center justify-center p-2 rounded-2xl bg-zinc-950/30 border border-white/5">
            <div className="grid grid-flow-col grid-rows-7 gap-1">
              {heatmapGrid.map((item, idx) => (
                <div 
                  key={idx}
                  title={`${item.date}: ${item.xp} XP Gained (${item.hours}h studied)`}
                  className={`w-3.5 h-3.5 rounded border border-white/5 transition-all ${getShadingClass(item.xp)}`}
                />
              ))}
            </div>
            
            {/* Heatmap Legend */}
            <div className="flex justify-between items-center w-full mt-4 px-2 text-[10px] text-zinc-650 font-bold">
              <span>Less Active</span>
              <div className="flex gap-1 items-center">
                <div className="w-2.5 h-2.5 rounded bg-zinc-900 border border-white/5" />
                <div className={`w-2.5 h-2.5 rounded ${accentColor === 'purple' ? 'bg-purple-950/40' : accentColor === 'cyan' ? 'bg-cyan-950/40' : accentColor === 'blue' ? 'bg-blue-950/40' : 'bg-emerald-950/40'}`} />
                <div className={`w-2.5 h-2.5 rounded ${accentColor === 'purple' ? 'bg-purple-800/60' : accentColor === 'cyan' ? 'bg-cyan-800/60' : accentColor === 'blue' ? 'bg-blue-800/60' : 'bg-emerald-800/60'}`} />
                <div className={`w-2.5 h-2.5 rounded ${accentColor === 'purple' ? 'bg-purple-500' : accentColor === 'cyan' ? 'bg-cyan-500' : accentColor === 'blue' ? 'bg-blue-500' : 'bg-emerald-500'}`} />
              </div>
              <span>Highly Active (+100 XP)</span>
            </div>
          </div>
        </div>

        {/* Weekly hours chart */}
        <div className="lg:col-span-1 glass-panel p-6 rounded-3xl border border-white/5 flex flex-col gap-6">
          <h4 className="text-sm font-bold text-zinc-350 flex items-center gap-2">
            <Clock className="w-4 h-4 text-zinc-500" /> Weekly Distribution
          </h4>
          
          <div className="h-[200px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                <XAxis dataKey="name" stroke="#6b7280" fontSize={11} tickLine={false} />
                <YAxis stroke="#6b7280" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '12px' }}
                  labelStyle={{ color: '#9ca3af', fontWeight: 'bold' }}
                />
                <Bar 
                  dataKey="hours" 
                  fill={getColorClass('fill')} 
                  radius={[4, 4, 0, 0]} 
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Grid: Category Progress bars */}
      <div className="glass-panel p-6 rounded-3xl border border-white/5 flex flex-col gap-6">
        <h4 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-zinc-500" /> Per-Category Progress
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Object.keys(analytics.category_progress).length > 0 ? (
            Object.entries(analytics.category_progress).map(([category, percentage]) => (
              <div key={category} className="flex flex-col gap-2 p-4 rounded-2xl bg-zinc-950/30 border border-white/5">
                <div className="flex justify-between items-center text-xs font-bold">
                  <span className="text-zinc-300 uppercase tracking-wider">{category}</span>
                  <span className={getColorClass('text')}>{percentage}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-zinc-800 border border-white/5 overflow-hidden">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      percentage === 100 ? 'bg-emerald-500' :
                      accentColor === 'purple' ? 'bg-purple-500' :
                      accentColor === 'cyan' ? 'bg-cyan-500' :
                      accentColor === 'blue' ? 'bg-blue-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${percentage}%` }}
                  />
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-2 text-center py-6 text-zinc-500 text-sm">
              No categories mapped yet. Select standard roadmap pathways in settings.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
