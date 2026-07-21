import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { 
  Home, 
  Map, 
  Calendar, 
  BarChart2, 
  BookOpen, 
  FileText, 
  Settings, 
  Flame, 
  Award,
  Zap,
  ChevronRight,
  Target,
  Sparkles,
  Plus
} from 'lucide-react'
import { useUIStore, AccentColor } from '../store/uiStore'
import { Goal, useGoals } from '../hooks/useApi'
import { useAuthStore } from '../store/authStore'

interface SidebarProps {
  goal: Goal | null
}

const getProfileColor = (id: number) => {
  const colors = [
    'bg-red-600 hover:bg-red-500 text-white',
    'bg-blue-600 hover:bg-blue-500 text-white',
    'bg-emerald-600 hover:bg-emerald-500 text-white',
    'bg-amber-500 hover:bg-amber-400 text-black',
    'bg-purple-600 hover:bg-purple-500 text-white',
    'bg-pink-600 hover:bg-pink-500 text-white',
    'bg-cyan-600 hover:bg-cyan-500 text-white'
  ]
  return colors[id % colors.length]
}

export const Sidebar: React.FC<SidebarProps> = ({ goal }) => {
  const navigate = useNavigate()
  const { accentColor } = useUIStore()
  const { data: goalsList } = useGoals()
  const { setActiveGoalId } = useAuthStore()
  
  // Theme color resolver helper
  const getColorClass = (type: 'text' | 'bg' | 'border' | 'glow') => {
    switch (accentColor) {
      case 'cyan':
        if (type === 'text') return 'text-cyan-400'
        if (type === 'bg') return 'bg-cyan-500/10'
        if (type === 'border') return 'border-cyan-500/20'
        return 'rgba(6, 182, 212, 0.4)'
      case 'emerald':
        if (type === 'text') return 'text-emerald-400'
        if (type === 'bg') return 'bg-emerald-500/10'
        if (type === 'border') return 'border-emerald-500/20'
        return 'rgba(16, 185, 129, 0.4)'
      case 'purple':
      default:
        if (type === 'text') return 'text-purple-400'
        if (type === 'bg') return 'bg-purple-500/10'
        if (type === 'border') return 'border-purple-500/20'
        return 'rgba(168, 85, 247, 0.4)'
    }
  }
  
  const navItems = [
    { name: 'Dashboard', path: '/app/', icon: Home },
    { name: 'Roadmap', path: '/app/roadmap', icon: Map },
    { name: 'Today', path: '/app/today', icon: Calendar },
    { name: 'Progress', path: '/app/progress', icon: BarChart2 },
    { name: 'Resources', path: '/app/resources', icon: BookOpen },
    { name: 'PDFs', path: '/app/pdfs', icon: FileText },
    { name: 'Sensei', path: '/app/sensei', icon: Sparkles },
    { name: 'Settings', path: '/app/settings', icon: Settings },
    { name: 'New Goal', path: '/setup', icon: Target },
  ]
  
  // Calculate XP Level (arbitrary gamification: 1000 XP per level)
  const xp = goal?.xp || 0
  const level = Math.floor(xp / 1000) + 1
  const levelXpProgress = xp % 1000
  const xpPercentage = (levelXpProgress / 1000) * 100
  
  return (
    <aside className="w-80 h-screen fixed left-0 top-0 glass-panel border-r border-white/10 flex flex-col justify-between p-6 z-40 overflow-y-auto custom-scrollbar">
      <div className="flex flex-col gap-8 w-full">
        {/* Brand Logo */}
        <div className="flex items-center gap-3 px-2 cursor-pointer" onClick={() => navigate('/app')}>
          <div className={`p-2.5 rounded-xl ${getColorClass('bg')} border ${getColorClass('border')} shadow-[0_0_15px_rgba(0,0,0,0.2)]`}>
            <Zap className={`w-6 h-6 ${getColorClass('text')}`} />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
              myMentor
            </h1>
            <span className="text-xs text-zinc-500 font-medium">Enterprise V1</span>
          </div>
        </div>

        {/* Netflix-style Profile Switcher */}
        <div className="flex flex-col gap-2.5 px-2 pb-4 border-b border-white/5">
          <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Learning Profiles</p>
          <div className="flex flex-wrap gap-2.5 items-center">
            {goalsList?.map((g) => {
              const isActive = g.id === goal?.id
              const initial = g.title.trim().charAt(0).toUpperCase()
              return (
                <button
                  key={g.id}
                  onClick={() => {
                    setActiveGoalId(g.id)
                  }}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm transition-all duration-300 relative group cursor-pointer ${getProfileColor(g.id)} ${
                    isActive 
                      ? `ring-2 ${accentColor === 'purple' ? 'ring-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.4)]' : accentColor === 'cyan' ? 'ring-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.4)]' : 'ring-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]'} ring-offset-2 ring-offset-zinc-950 scale-105` 
                      : 'opacity-40 hover:opacity-100 hover:scale-105'
                  }`}
                  title={g.title}
                >
                  {initial}
                  {/* Tooltip */}
                  <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 bg-zinc-900 border border-white/10 px-2 py-1 rounded text-[10px] font-bold text-zinc-200 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-xl">
                    {g.title}
                  </div>
                </button>
              )
            })}
            
            {/* Add Goal profile */}
            <button
              onClick={() => navigate('/setup')}
              className="w-9 h-9 rounded-lg border border-dashed border-white/20 hover:border-white/40 flex items-center justify-center text-zinc-500 hover:text-zinc-300 transition-all duration-200 cursor-pointer hover:scale-105"
              title="Add New Goal Profile"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {/* Gamified Profile card if active goal exists */}
        {goal && (
          <div className="p-4 rounded-2xl bg-zinc-900/60 border border-white/5 flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs text-zinc-500 uppercase tracking-wider font-semibold">Learning Profile</p>
                <h3 className="font-bold text-sm text-zinc-200 mt-0.5 truncate max-w-[150px]">{goal.title}</h3>
              </div>
              <div className="flex items-center gap-1.5 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                <Flame className="w-4.5 h-4.5 text-amber-500 animate-streak-wobble" />
                <span className="text-xs font-bold text-amber-400">{goal.streak}</span>
              </div>
            </div>
            
            {/* Level Bar */}
            <div className="flex flex-col gap-1.5 mt-1">
              <div className="flex justify-between text-xs font-bold">
                <span className="text-zinc-400">Level {level}</span>
                <span className={getColorClass('text')}>{levelXpProgress} / 1000 XP</span>
              </div>
              <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden border border-white/5">
                <div 
                  className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${
                    accentColor === 'purple' ? 'from-purple-500 to-indigo-500' :
                    accentColor === 'cyan' ? 'from-cyan-500 to-blue-500' :
                    'from-emerald-500 to-teal-500'
                  }`}
                  style={{ width: `${xpPercentage}%` }}
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Navigation items */}
        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.name}
                to={item.path}
                className={({ isActive }) => 
                  `flex items-center justify-between px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 group border ${
                    isActive 
                      ? `${getColorClass('bg')} ${getColorClass('border')} ${getColorClass('text')}` 
                      : 'text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-white/5'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${isActive ? getColorClass('text') : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                      <span>{item.name}</span>
                    </div>
                    {isActive && <ChevronRight className="w-4 h-4" />}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>
      </div>
      
      {/* Bottom Footer Info */}
      <div className="flex flex-col gap-2 border-t border-white/5 pt-4 text-center">
        <p className="text-xs text-zinc-500 font-medium">Developed for resume excellence</p>
        <div className="flex justify-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Local Host Connected</span>
        </div>
      </div>
    </aside>
  )
}
