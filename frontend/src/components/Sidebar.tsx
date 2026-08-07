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

import { getColorClasses } from '../lib/theme'

// Inside Sidebar:
export const Sidebar: React.FC<SidebarProps> = ({ goal }) => {
  const navigate = useNavigate()
  const { accentColor, setAccentColor, goalThemes, isSidebarCollapsed, toggleSidebar } = useUIStore()
  const theme = getColorClasses(accentColor)
  const { data: goalsList } = useGoals()
  const { setActiveGoalId } = useAuthStore()
  
  const handleNavLinkClick = () => {
    if (window.innerWidth < 768) {
      if (!isSidebarCollapsed) {
        toggleSidebar()
      }
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
      className={`fixed top-0 left-0 h-screen bg-[#0c0c11] border-r-4 border-black flex flex-col justify-between z-50 overflow-y-auto custom-scrollbar transition-all duration-300 shadow-[4px_0px_0px_var(--theme-secondary)] ${
        isSidebarCollapsed 
          ? 'w-20 p-3.5 max-md:-translate-x-full' 
          : 'w-64 p-5 max-md:translate-x-0 max-md:w-72'
      }`}
      style={{
        backgroundImage: 'radial-gradient(rgba(255, 255, 255, 0.06) 1.5px, transparent 1.5px)',
        backgroundSize: '18px 18px'
      }}
    >
      <div className="flex flex-col gap-6 w-full">
        {/* Brand Header with Toggle Collapse */}
        <div className={`flex ${isSidebarCollapsed ? 'flex-col items-center gap-3' : 'items-center justify-between px-1'}`}>
          <div 
            className="flex items-center gap-3 cursor-pointer group" 
            onClick={() => {
              navigate('/app')
              handleNavLinkClick()
            }}
            title="myMentor Dashboard"
          >
            <img 
              src="/mymentor-logo.svg" 
              alt="myMentor Logo" 
              className="w-10 h-10 shrink-0 drop-shadow-[3px_3px_0px_#000] group-hover:scale-105 transition-transform" 
            />
            {!isSidebarCollapsed && (
              <span className="font-extrabold text-xl tracking-tight text-white flex items-center gap-0.5">
                my<span className={theme.text}>Mentor</span>
              </span>
            )}
          </div>
          
          <button 
            type="button"
            onClick={toggleSidebar}
            className="p-2 rounded-xl bg-zinc-900 border-2 border-black hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all cursor-pointer shadow-[3px_3px_0px_#000]"
            title={isSidebarCollapsed ? "Expand Sidebar (Ctrl+B)" : "Collapse Sidebar (Ctrl+B)"}
          >
            {isSidebarCollapsed ? <PanelLeftOpen className="w-5 h-5" /> : <PanelLeftClose className="w-5 h-5" />}
          </button>
        </div>

        {/* Goal Profile selector pills & Active Learning Profile Card */}
        <div className="flex flex-col gap-3">
          {!isSidebarCollapsed && (
            <div className="flex items-center justify-between px-1">
              <p className="text-[11px] text-zinc-400 font-extrabold uppercase tracking-wider">Learning Profiles</p>
              <button 
                onClick={() => navigate('/setup')} 
                className="text-[11px] font-extrabold text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                title="Add New Goal Profile"
              >
                <Plus className="w-3.5 h-3.5" /> Add New
              </button>
            </div>
          )}

          {/* Goal Profile Switcher Pills */}
          <div className={`flex items-center ${isSidebarCollapsed ? 'flex-col gap-2' : 'flex-wrap gap-2 px-1'}`}>
            {goalsList?.map((g: Goal) => {
              const isActive = g.id === goal?.id
              const initial = g.title.charAt(0).toUpperCase()
              return (
                <button
                  key={g.id}
                  onClick={() => {
                    setActiveGoalId(g.id)
                    if (window.innerWidth < 768 && !isSidebarCollapsed) {
                      toggleSidebar()
                    }
                  }}
                  title={g.title}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs transition-all duration-200 relative group cursor-pointer border-2 border-black ${getProfileColor(g.id)} ${
                    isActive 
                      ? 'scale-105 ring-2 ring-white shadow-[3px_3px_0px_#fff]' 
                      : 'opacity-60 hover:opacity-100 hover:scale-105 shadow-[2px_2px_0px_#000]'
                  }`}
                >
                  {initial}
                  {/* Tooltip */}
                  <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-zinc-900 border-2 border-black px-2.5 py-1 rounded-lg text-xs font-bold text-zinc-200 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-[3px_3px_0px_#000]">
                    {g.title}
                  </div>
                </button>
              )
            })}
          </div>

          {/* Active Learning Profile Card */}
          {goal && (
            isSidebarCollapsed ? (
              <div className="flex flex-col items-center gap-1.5 p-2.5 rounded-2xl bg-zinc-900 border-2 border-black shadow-[3px_3px_0px_#000] relative group cursor-pointer" onClick={() => navigate('/app')}>
                <span className="text-lg animate-pulse">🔥</span>
                <span className="text-[10px] font-black text-amber-400">{goal.streak}d</span>
                {/* Tooltip */}
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-zinc-900 border-2 border-black p-3 rounded-2xl text-xs font-bold text-zinc-200 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-[3px_3px_0px_#000] flex flex-col gap-1.5">
                  <span className="font-extrabold text-white text-sm">{goal.title}</span>
                  <span className="text-zinc-400 text-[11px]">Level {level} ({levelXpProgress}/1000 XP)</span>
                </div>
              </div>
            ) : (
              <div className="p-4.5 rounded-2xl bg-[#14141d] border-2 border-black shadow-[4px_4px_0px_var(--theme-secondary)] flex flex-col gap-3.5 overflow-hidden">
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] text-zinc-400 uppercase tracking-widest font-black">Active Profile</span>
                    <div className="flex items-center gap-1.5 bg-amber-500/20 border-2 border-black px-2.5 py-0.5 rounded-full shadow-[2px_2px_0px_#000] shrink-0">
                      <span className="text-xs animate-pulse">🔥</span>
                      <span className="text-[11px] font-black text-amber-400">{goal.streak} Days</span>
                    </div>
                  </div>
                  <h3 className="font-black text-sm text-zinc-100 leading-snug line-clamp-2">{goal.title}</h3>
                </div>
                
                {/* Level Progress Bar */}
                <div className="flex flex-col gap-1.5 pt-1 border-t border-white/10">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-zinc-400">Level {level}</span>
                    <span className={theme.text}>{levelXpProgress} / 1000 XP</span>
                  </div>
                  <div className="w-full h-2.5 rounded-full bg-zinc-950 overflow-hidden border-2 border-black">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${theme.gradient}`}
                      style={{ width: `${xpPercentage}%` }}
                    />
                  </div>
                </div>
              </div>
            )
          )}
        </div>
        
        {/* Navigation items */}
        <nav className="flex flex-col gap-2">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.name}
                to={item.path}
                onClick={handleNavLinkClick}
                className={({ isActive }) => 
                  `flex items-center ${isSidebarCollapsed ? 'justify-center p-3' : 'justify-between px-4 py-3'} rounded-xl text-sm font-extrabold transition-all duration-150 group border-2 relative ${
                    isActive 
                      ? `${theme.btn} border-black shadow-[4px_4px_0px_#000]` 
                      : 'text-zinc-300 border-transparent hover:text-white hover:bg-zinc-900/80 hover:border-black hover:shadow-[3px_3px_0px_#000]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <div className="flex items-center gap-3">
                      <Icon className={`w-5 h-5 transition-transform duration-200 group-hover:scale-110 ${isActive ? 'text-black' : 'text-zinc-400 group-hover:text-white'}`} />
                      {!isSidebarCollapsed && <span>{item.name}</span>}
                    </div>
                    {!isSidebarCollapsed && isActive && <ChevronRight className="w-4 h-4 text-black stroke-[3]" />}

                    {/* Tooltip in collapsed mode */}
                    {isSidebarCollapsed && (
                      <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 bg-zinc-900 border-2 border-black px-3 py-1.5 rounded-xl text-xs font-extrabold text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-50 shadow-[3px_3px_0px_#000]">
                        {item.name}
                      </div>
                    )}
                  </>
                )}
              </NavLink>
            )
          })}
        </nav>

        {/* Clear Explicit Collapse Switch Button */}
        <button
          type="button"
          onClick={toggleSidebar}
          className={`flex items-center justify-center gap-2.5 p-3 rounded-xl bg-zinc-900 border-2 border-black hover:bg-zinc-800 text-zinc-300 hover:text-white transition-all cursor-pointer shadow-[3px_3px_0px_#000] font-extrabold text-xs mt-2 ${isSidebarCollapsed ? 'w-12 mx-auto' : 'w-full'}`}
          title={isSidebarCollapsed ? "Expand Sidebar (Ctrl+B)" : "Collapse Sidebar (Ctrl+B)"}
        >
          {isSidebarCollapsed ? (
            <PanelLeftOpen className="w-5 h-5 shrink-0" />
          ) : (
            <>
              <PanelLeftClose className="w-5 h-5 shrink-0" />
              <span>Collapse Sidebar</span>
            </>
          )}
        </button>
      </div>
    </aside>
  )
}
