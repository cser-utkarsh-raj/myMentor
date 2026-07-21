import React from 'react'
import { 
  Palette, 
  Trash2, 
  Zap, 
  ShieldAlert, 
  HelpCircle, 
  Clock, 
  Settings as SettingsIcon,
  RefreshCw,
  Lock,
  Cloud,
  LogOut
} from 'lucide-react'
import { useActiveGoal, useDeleteGoal } from '../hooks/useApi'
import { useUIStore, AccentColor } from '../store/uiStore'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'

export const Settings: React.FC = () => {
  const { accentColor, setAccentColor, setGoalTheme } = useUIStore()
  const { data: activeGoal, refetch } = useActiveGoal()
  const deleteGoalMutation = useDeleteGoal()
  const clearSession = useAuthStore(state => state.clearSession)
  const { userName, setUserName } = useAuthStore()
  const [tempName, setTempName] = React.useState(userName)
  const navigate = useNavigate()

  const handleSetTheme = (color: AccentColor) => {
    if (activeGoal?.id) {
      setGoalTheme(activeGoal.id, color)
    } else {
      setAccentColor(color)
    }
  }

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut()
    } catch (e) {
      console.error("SignOut error:", e)
    }
    clearSession()
    navigate('/login')
  }

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
      case 'blue':
        if (type === 'text') return 'text-blue-400'
        if (type === 'bg') return 'bg-blue-500/10'
        if (type === 'border') return 'border-blue-500/20'
        if (type === 'btn') return 'bg-blue-500 hover:bg-blue-400 text-black shadow-[0_0_15px_rgba(59,130,246,0.3)]'
        return 'rgba(59, 130, 246, 0.4)'
      case 'purple':
      default:
        if (type === 'text') return 'text-purple-400'
        if (type === 'bg') return 'bg-purple-500/10'
        if (type === 'border') return 'border-purple-500/20'
        if (type === 'btn') return 'bg-purple-500 hover:bg-purple-400 text-zinc-950 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
        return 'rgba(168, 85, 247, 0.4)'
    }
  }

  // Handle application reset
  const handleResetApp = async () => {
    if (!activeGoal) return
    const confirmed = confirm(
      "CAUTION: This will delete your current active goal, wipe all checklist logs, reset study stats, streaks, and achievements. This cannot be undone. Proceed?"
    )
    if (confirmed) {
      try {
        await deleteGoalMutation.mutateAsync(activeGoal.id)
        alert("Goal database cleared. Launching wizard setup.")
        window.location.href = '/'
      } catch (e) {
        alert("Failed to reset application goal.")
      }
    }
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-4xl mx-auto py-4">
      {/* Header */}
      <div>
        <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
          App Settings
        </h2>
        <p className="text-zinc-500 font-medium mt-1">
          Customize UI aesthetics, manage database sync profiles, or reset learning configurations.
        </p>
      </div>

      <div className="flex flex-col gap-6 mt-4">
        {/* Accent Color card */}
        <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-zinc-950/15 flex flex-col gap-4">
          <h3 className="font-bold text-zinc-200 flex items-center gap-2">
            <Palette className="w-4.5 h-4.5 text-zinc-500" /> UI Glow Accent Color
          </h3>
          <p className="text-xs text-zinc-400">Choose a primary theme accent for glowing panels, active routes, and sliders.</p>
          
          <div className="flex flex-wrap gap-3 mt-1">
            {/* Purple preset */}
            <button
              type="button"
              onClick={() => handleSetTheme('purple')}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                accentColor === 'purple' 
                  ? 'bg-purple-500/10 border-purple-500/40 text-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.15)]' 
                  : 'bg-zinc-900/30 border-white/5 hover:border-white/10 hover:bg-zinc-900/60'
              }`}
            >
              <div className="w-3.5 h-3.5 rounded-full bg-purple-500" /> Purple Violet
            </button>

            {/* Blue preset */}
            <button
              type="button"
              onClick={() => handleSetTheme('blue')}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                accentColor === 'blue' 
                  ? 'bg-blue-500/10 border-blue-500/40 text-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.15)]' 
                  : 'bg-zinc-900/30 border-white/5 hover:border-white/10 hover:bg-zinc-900/60'
              }`}
            >
              <div className="w-3.5 h-3.5 rounded-full bg-blue-500" /> Ocean Blue
            </button>

            {/* Cyan preset */}
            <button
              type="button"
              onClick={() => handleSetTheme('cyan')}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                accentColor === 'cyan' 
                  ? 'bg-cyan-500/10 border-cyan-500/40 text-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.15)]' 
                  : 'bg-zinc-900/30 border-white/5 hover:border-white/10 hover:bg-zinc-900/60'
              }`}
            >
              <div className="w-3.5 h-3.5 rounded-full bg-cyan-500" /> Cyber Cyan
            </button>

            {/* Emerald preset */}
            <button
              type="button"
              onClick={() => handleSetTheme('emerald')}
              className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                accentColor === 'emerald' 
                  ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.15)]' 
                  : 'bg-zinc-900/30 border-white/5 hover:border-white/10 hover:bg-zinc-900/60'
              }`}
            >
              <div className="w-3.5 h-3.5 rounded-full bg-emerald-500" /> Forest Emerald
            </button>
          </div>
        </div>

        {/* User Profile Card */}
        <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-zinc-950/15 flex flex-col gap-4">
          <h3 className="font-bold text-zinc-200 flex items-center gap-2">
            <Palette className="w-4.5 h-4.5 text-zinc-500" /> User Profile Display Name
          </h3>
          <p className="text-xs text-zinc-400">Change your display name shown in the dashboard greeting.</p>
          
          <div className="flex gap-3 max-w-md items-center">
            <input
              type="text"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              placeholder="Enter your name"
              className="glass-input text-sm flex-1 bg-zinc-900 border border-white/10 rounded-xl px-4 py-2.5 text-zinc-200"
            />
            <button
              type="button"
              onClick={() => {
                setUserName(tempName.trim() || 'Mentor Client')
                alert('Profile name updated!')
              }}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${getColorClass('btn')}`}
            >
              Save Name
            </button>
          </div>
        </div>

        {/* Account Management Card */}
        <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-zinc-950/15 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex gap-4">
            <div className={`p-3 rounded-2xl ${getColorClass('bg')} border ${getColorClass('border')} text-zinc-200 shrink-0`}>
              <LogOut className={`w-6 h-6 ${getColorClass('text')}`} />
            </div>
            <div className="flex flex-col gap-1">
              <h3 className="font-bold text-zinc-200 text-sm">Account Session</h3>
              <p className="text-xs text-zinc-500 leading-relaxed">
                Log out of your current session. Your progress and goal configurations are safely stored in the database.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${getColorClass('btn')}`}
          >
            <LogOut className="w-4 h-4" /> Sign Out / Log Out
          </button>
        </div>

        {/* Profile statistics metadata */}
        {activeGoal && (
          <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-zinc-950/15 flex flex-col gap-4">
            <h3 className="font-bold text-zinc-200 flex items-center gap-2">
              <Palette className="w-4.5 h-4.5 text-zinc-500" /> Active Goal Configuration
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="flex flex-col gap-1 p-3.5 rounded-xl bg-zinc-900/40 border border-white/5">
                <span className="text-zinc-500 font-bold uppercase">Learning Pathway</span>
                <span className="text-zinc-200 font-bold mt-0.5 text-sm">{activeGoal.title}</span>
              </div>

              <div className="flex flex-col gap-1 p-3.5 rounded-xl bg-zinc-900/40 border border-white/5">
                <span className="text-zinc-500 font-bold uppercase">Financial / Skill Target</span>
                <span className="text-zinc-200 font-bold mt-0.5 text-sm">{activeGoal.target}</span>
              </div>

              <div className="flex flex-col gap-1 p-3.5 rounded-xl bg-zinc-900/40 border border-white/5">
                <span className="text-zinc-500 font-bold uppercase">Commitment Commitment</span>
                <span className="text-zinc-200 font-bold mt-0.5 text-sm">{activeGoal.daily_hours} hours / day</span>
              </div>

              <div className="flex flex-col gap-1 p-3.5 rounded-xl bg-zinc-900/40 border border-white/5">
                <span className="text-zinc-500 font-bold uppercase">Milestone Length</span>
                <span className="text-zinc-200 font-bold mt-0.5 text-sm">{activeGoal.timeline_days} Days duration</span>
              </div>
            </div>
          </div>
        )}

        {/* Future expansion placeholders */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Auth */}
          <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-zinc-950/10 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4 text-zinc-650" />
              <h4 className="font-bold text-zinc-500 text-sm">V2 Authentication</h4>
            </div>
            <p className="text-[11px] text-zinc-650 leading-relaxed">
              Secure OAuth2 flow and JWT refresh token authorization. Keep all work sandboxed locally in V1.
            </p>
          </div>

          {/* Cloud Sync */}
          <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-zinc-950/10 flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-zinc-650" />
              <h4 className="font-bold text-zinc-500 text-sm">V2 Cloud Sync</h4>
            </div>
            <p className="text-[11px] text-zinc-650 leading-relaxed">
              Automatic sync to Neon remote databases, backing up checklists, files, and statistics.
            </p>
          </div>
        </div>

        {/* caution zone resets */}
        {activeGoal && (
          <div className="glass-panel p-6 rounded-3xl border border-red-500/20 bg-red-500/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mt-2">
            <div className="flex gap-4">
              <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="font-bold text-zinc-200 text-sm">CAUTION ZONE: Delete Active Goal Profile</h3>
                <p className="text-xs text-zinc-500 leading-relaxed">
                  Permanently delete your current active learning profile "{activeGoal.title}" and all its roadmap history.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleResetApp}
              className="px-5 py-3 rounded-2xl text-xs font-bold bg-red-500 hover:bg-red-400 text-black shadow-[0_0_15px_rgba(239,68,68,0.2)] transition-all shrink-0 cursor-pointer flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" /> Delete Goal Profile
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
