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
  Plus,
  PanelLeftClose,
  PanelLeftOpen
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
  const { accentColor, setAccentColor, goalThemes, isSidebarCollapsed, toggleSidebar } = useUIStore()
  const { data: goalsList } = useGoals()
  const { setActiveGoalId } = useAuthStore()
  
  const handleNavLinkClick = () => {
    if (window.innerWidth < 768) {
      if (!isSidebarCollapsed) {
        toggleSidebar()
      }
    }
  }
  
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
      case 'blue':
        if (type === 'text') return 'text-blue-400'
        if (type === 'bg') return 'bg-blue-500/10'
        if (type === 'border') return 'border-blue-500/20'
        return 'rgba(59, 130, 246, 0.4)'
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
  
  // Calculate XP Level
  const xp = goal?.xp || 0
  const level = Math.floor(xp / 1000) + 1
  const levelXpProgress = xp % 1000
  const xpPercentage = (levelXpProgress / 1000) * 100

  return (
    <aside 
      className={`fixed top-0 h-screen glass-panel border-r border-white/10 flex flex-col justify-between z-40 overflow-y-auto custom-scrollbar transition-all duration-300 ${
        isSidebarCollapsed 
          ? 'w-20 p-3 left-0 max-md:-left-80 max-md:w-80 max-md:p-6' 
          : 'w-80 p-6 left-0 max-md:left-0'
      }`}
    >
      <div className="flex flex-col gap-6 w-full">
        {/* Brand Header with Toggle Collapse */}
        <div className="flex items-center justify-between px-1">
          <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => {
              navigate('/app')
              handleNavLinkClick()
            }}
            title="myMentor Dashboard"
          >
            <div className={`p-2.5 rounded-xl ${getColorClass('bg')} border ${getColorClass('border')} shadow-[0_0_15px_rgba(0,0,0,0.2)] shrink-0`}>
              <Zap className={`w-6 h-6 ${getColorClass('text')}`} />
            </div>
            {!isSidebarCollapsed && (
              <div>
                <h1 className="text-xl font-bold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">
                  myMentor
                </h1>
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={toggleSidebar}
            className="p-1.5 rounded-xl text-zinc-500 hover:text-white hover:bg-white/10 transition-colors cursor-pointer shrink-0"
            title={isSidebarCollapsed ? "Expand Sidebar (Ctrl+B)" : "Collapse Sidebar (Ctrl+B)"}
          >
            {isSidebarCollapsed ? (
              <PanelLeftOpen className="w-5 h-5" />
            ) : (
              <PanelLeftClose className="w-5 h-5" />
            )}
          </button>
        </div>

        {/* Learning Profiles Switcher */}
        <div className={`flex flex-col gap-2.5 border-b border-white/5 ${isSidebarCollapsed ? 'pb-3 px-1' : 'pb-4 px-2'}`}>
          {!isSidebarCollapsed && (
            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">Learning Profiles</p>
          )}
          <div className={`flex items-center ${isSidebarCollapsed ? 'flex-col gap-2' : 'flex-wrap gap-2.5'}`}>
            {goalsList?.map((g) => {
              const isActive = g.id === goal?.id
              const initial = g.title.trim().charAt(0).toUpperCase()
              return (
                <button
                  key={g.id}
                  onClick={() => {
                    setActiveGoalId(g.id)
                    const savedTheme = goalThemes[String(g.id)]
                    if (savedTheme) {
                      setAccentColor(savedTheme)
                    }
                  }}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-sm transition-all duration-300 relative group cursor-pointer ${getProfileColor(g.id)} ${
                    isActive 
                      ? `ring-2 ${accentColor === 'purple' ? 'ring-purple-500 shadow-[0_0_12px_rgba(168,85,247,0.4)]' : accentColor === 'cyan' ? 'ring-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.4)]' : accentColor === 'emerald' ? 'ring-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.4)]' : 'ring-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.4)]'} ring-offset-2 ring-offset-zinc-950 scale-105` 
                      : 'opacity-40 hover:opacity-100 hover:scale-105'
                  }`}
                >
                  {initial}
                  {/* Tooltip */}
                  <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-zinc-900 border border-white/10 px-2.5 py-1 rounded-lg text-xs font-bold text-zinc-200 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-xl">
                    {g.title}
                  </div>
                </button>
              )
            })}
            
            {/* Add Goal profile */}
            <button
              onClick={() => navigate('/setup')}
              className="w-9 h-9 rounded-lg border border-dashed border-white/20 hover:border-white/40 flex items-center justify-center text-zinc-500 hover:text-zinc-300 transition-all duration-200 cursor-pointer hover:scale-105 relative group"
            >
              <Plus className="w-4 h-4" />
              {isSidebarCollapsed && (
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-zinc-900 border border-white/10 px-2.5 py-1 rounded-lg text-xs font-bold text-zinc-200 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-xl">
                  Add New Goal Profile
                </div>
              )}
            </button>
          </div>
        </div>
        
        {/* Gamified Profile card if active goal exists */}
        {goal && (
          isSidebarCollapsed ? (
            <div className="flex flex-col items-center gap-1.5 p-2 rounded-xl bg-zinc-900/60 border border-white/5 relative group cursor-pointer" onClick={() => navigate('/app')}>
              <Flame className="w-5 h-5 text-amber-500 animate-streak-wobble" />
              <span className="text-[10px] font-extrabold text-amber-400">{goal.streak}d</span>
              {/* Tooltip */}
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-zinc-900 border border-white/10 p-2 rounded-xl text-xs font-bold text-zinc-200 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-xl flex flex-col gap-1">
                <span>{goal.title}</span>
                <span className="text-zinc-400 text-[10px]">Level {level} ({levelXpProgress}/1000 XP)</span>
              </div>
            </div>
          ) : (
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
                      accentColor === 'blue' ? 'from-blue-500 to-sky-500' :
                      'from-emerald-500 to-teal-500'
                    }`}
                    style={{ width: `${xpPercentage}%` }}
                  />
                </div>
              </div>
            </div>
          )
        )}
        
        {/* Navigation items */}
        <nav className="flex flex-col gap-1.5">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={handleNavLinkClick}
                className={({ isActive }) => 
                  `flex items-center ${isSidebarCollapsed ? 'justify-center p-3' : 'justify-between px-4 py-3'} rounded-xl text-sm font-semibold transition-all duration-200 group border relative ${
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
                      {!isSidebarCollapsed && <span>{item.name}</span>}
                    </div>
                    {!isSidebarCollapsed && isActive && <ChevronRight className="w-4 h-4" />}

                    {/* Tooltip in collapsed mode */}
                    {isSidebarCollapsed && (
                      <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-zinc-900 border border-white/10 px-3 py-1.5 rounded-xl text-xs font-bold text-zinc-200 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-xl">
                        {item.name}
                      </div>
                    )}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>
      </div>
      
      {/* Bottom Footer Info */}
      {!isSidebarCollapsed && (
        <div className="flex flex-col gap-2 border-t border-white/5 pt-4 text-center">
          <div className="flex justify-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-bold">Local Host Connected</span>
          </div>
        </div>
      )}
    </aside>
  )
}
