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
  LogOut,
  Sparkles,
  UserCheck,
  UserPlus,
  Mail
} from 'lucide-react'
import { useActiveGoal, useDeleteGoal } from '../hooks/useApi'
import { useUIStore, AccentColor, SenseiPersonality } from '../store/uiStore'
import { useAuthStore } from '../store/authStore'
import { supabase } from '../lib/supabase'
import { useNavigate } from 'react-router-dom'
import { getColorClasses } from '../lib/theme'
import { PersonaAvatar } from '../components/PersonaAvatar'

export const Settings: React.FC = () => {
  const { accentColor, setAccentColor, setGoalTheme, senseiPersonality, setSenseiPersonality } = useUIStore()
  const theme = getColorClasses(accentColor)
  const { data: activeGoal, refetch } = useActiveGoal()
  const deleteGoalMutation = useDeleteGoal()
  const { user, isDemoMode, clearSession, userName, setUserName } = useAuthStore()
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
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-1">
            {/* Plasma Vibe */}
            <button
              type="button"
              onClick={() => handleSetTheme('plasma')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                accentColor === 'plasma' || accentColor === 'purple'
                  ? 'bg-purple-500/20 border-purple-500 text-purple-300 shadow-[0_0_15px_rgba(168,85,247,0.3)] scale-[1.02]' 
                  : 'bg-zinc-900/60 border-white/10 hover:border-white/20 hover:bg-zinc-900'
              }`}
            >
              <div className="flex -space-x-1 shrink-0">
                <div className="w-3.5 h-3.5 rounded-full bg-purple-500 border border-black" />
                <div className="w-3.5 h-3.5 rounded-full bg-pink-500 border border-black" />
              </div>
              <span className="truncate font-extrabold">Plasma</span>
            </button>

            {/* Winter Vibe */}
            <button
              type="button"
              onClick={() => handleSetTheme('winter')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                accentColor === 'winter' || accentColor === 'cyan'
                  ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.3)] scale-[1.02]' 
                  : 'bg-zinc-900/60 border-white/10 hover:border-white/20 hover:bg-zinc-900'
              }`}
            >
              <div className="flex -space-x-1 shrink-0">
                <div className="w-3.5 h-3.5 rounded-full bg-cyan-400 border border-black" />
                <div className="w-3.5 h-3.5 rounded-full bg-blue-500 border border-black" />
              </div>
              <span className="truncate font-extrabold">Winter</span>
            </button>

            {/* Jungle Vibe */}
            <button
              type="button"
              onClick={() => handleSetTheme('jungle')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                accentColor === 'jungle' || accentColor === 'emerald'
                  ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300 shadow-[0_0_15px_rgba(16,185,129,0.3)] scale-[1.02]' 
                  : 'bg-zinc-900/60 border-white/10 hover:border-white/20 hover:bg-zinc-900'
              }`}
            >
              <div className="flex -space-x-1 shrink-0">
                <div className="w-3.5 h-3.5 rounded-full bg-emerald-500 border border-black" />
                <div className="w-3.5 h-3.5 rounded-full bg-lime-400 border border-black" />
              </div>
              <span className="truncate font-extrabold">Jungle</span>
            </button>

            {/* Volcano Vibe */}
            <button
              type="button"
              onClick={() => handleSetTheme('volcano')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                accentColor === 'volcano' || accentColor === 'blue'
                  ? 'bg-orange-500/20 border-orange-500 text-orange-300 shadow-[0_0_15px_rgba(249,115,22,0.3)] scale-[1.02]' 
                  : 'bg-zinc-900/60 border-white/10 hover:border-white/20 hover:bg-zinc-900'
              }`}
            >
              <div className="flex -space-x-1 shrink-0">
                <div className="w-3.5 h-3.5 rounded-full bg-orange-500 border border-black" />
                <div className="w-3.5 h-3.5 rounded-full bg-red-600 border border-black" />
              </div>
              <span className="truncate font-extrabold">Volcano</span>
            </button>

            {/* Cyberpunk Vibe */}
            <button
              type="button"
              onClick={() => handleSetTheme('cyberpunk')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                accentColor === 'cyberpunk' 
                  ? 'bg-[#00f0ff]/20 border-[#00f0ff] text-[#00f0ff] shadow-[0_0_15px_rgba(0,240,255,0.4)] scale-[1.02]' 
                  : 'bg-zinc-900/60 border-white/10 hover:border-white/20 hover:bg-zinc-900'
              }`}
            >
              <div className="flex -space-x-1 shrink-0">
                <div className="w-3.5 h-3.5 rounded-full bg-[#00f0ff] border border-black" />
                <div className="w-3.5 h-3.5 rounded-full bg-[#ff0055] border border-black" />
              </div>
              <span className="truncate font-extrabold">Cyberpunk</span>
            </button>

            {/* Solar Flare Vibe */}
            <button
              type="button"
              onClick={() => handleSetTheme('solar')}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-bold transition-all cursor-pointer ${
                accentColor === 'solar' 
                  ? 'bg-yellow-500/20 border-yellow-500 text-yellow-300 shadow-[0_0_15px_rgba(250,204,21,0.3)] scale-[1.02]' 
                  : 'bg-zinc-900/60 border-white/10 hover:border-white/20 hover:bg-zinc-900'
              }`}
            >
              <div className="flex -space-x-1 shrink-0">
                <div className="w-3.5 h-3.5 rounded-full bg-yellow-400 border border-black" />
                <div className="w-3.5 h-3.5 rounded-full bg-amber-500 border border-black" />
              </div>
              <span className="truncate font-extrabold">Solar</span>
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
                setUserName(tempName.trim() || 'Mentee')
                alert('Profile name updated!')
              }}
              className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${theme.btn}`}
            >
              Save Name
            </button>
          </div>
        </div>

        {/* Account Management Card */}
        <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-zinc-950/15 flex flex-col gap-5">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-white/5">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl ${theme.bg} border ${theme.border} text-zinc-200 shrink-0`}>
                <UserCheck className={`w-6 h-6 ${theme.text}`} />
              </div>
              <div className="flex flex-col gap-1">
                <h3 className="font-bold text-zinc-200 text-sm flex items-center gap-2">
                  Account Session
                  <span className={`text-[10px] font-black px-2 py-0.5 rounded border uppercase ${
                    isDemoMode ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  }`}>
                    {isDemoMode ? 'Demo Mode' : user ? 'Authenticated' : 'Guest Session'}
                  </span>
                </h3>
                <p className="text-xs text-zinc-400 flex items-center gap-2 mt-0.5">
                  <Mail className="w-3.5 h-3.5 text-zinc-500" />
                  <span className="font-semibold text-zinc-300">
                    {user?.email || (isDemoMode ? 'demo@mymentor.app' : 'local-guest@mymentor.app')}
                  </span>
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className={`px-5 py-2.5 rounded-2xl text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 ${theme.btn}`}
            >
              <LogOut className="w-4 h-4" /> Sign Out / Log Out
            </button>
          </div>

          {/* Option to log in / sign in with a new ID */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-1">
            <p className="text-xs text-zinc-500 font-medium">
              Need to switch accounts or sign in with a different email address?
            </p>
            <button
              type="button"
              onClick={handleLogout}
              className="px-4 py-2.5 rounded-xl border border-white/10 bg-zinc-900/80 hover:bg-zinc-900 text-zinc-200 hover:text-white text-xs font-bold transition-all shrink-0 cursor-pointer flex items-center gap-2 hover:border-white/20"
            >
              <UserPlus className="w-3.5 h-3.5 text-cyan-400" /> Log in / Sign in with new ID
            </button>
          </div>
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

        {/* Real User Useful Settings: Mentor Personality & Export Data */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Sensei Personality Selector */}
          <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-zinc-950/20 flex flex-col gap-4 col-span-1 md:col-span-2">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Sparkles className={`w-5 h-5 ${theme.text}`} />
                <h4 className="font-bold text-white text-base">Sensei Mentor Personality & Voice</h4>
              </div>
              <p className="text-xs text-zinc-400">
                Choose Sensei's active personality, teaching philosophy, and mentor voice.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mt-1">
              {[
                { name: 'Deadpool', tag: 'Witty & Playful', desc: 'Fourth-wall breaking banter, sarcastic humor, technically sharp explanations.' },
                { name: 'Homelander', tag: 'Intense & Demanding', desc: 'Dominant, high-pressure, demands absolute perfection and zero excuses.' },
                { name: 'Thor', tag: 'God of Thunder', desc: 'Boisterous warrior mentor, treats study sessions like epic battle training.' },
                { name: 'Messi', tag: 'Tactical Genius', desc: 'Calm, humble, precise, focusing on spatial vision and graceful execution.' },
                { name: 'Taylor Swift', tag: 'Poetic & Structured', desc: 'Lyrical storytelling, organized in Eras, deeply empathetic and structured.' },
                { name: 'Ryan Gosling', tag: 'Quiet & Cool', desc: 'Stoic confidence, synthwave drive energy, calm and smooth mentorship.' }
              ].map((p) => {
                const isSelected = senseiPersonality === p.name
                return (
                  <button
                    key={p.name}
                    type="button"
                    onClick={() => setSenseiPersonality(p.name as SenseiPersonality)}
                    className={`flex items-start gap-3.5 p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                      isSelected 
                        ? `${theme.bg} ${theme.border} border-white/30 shadow-[0_0_15px_rgba(0,0,0,0.4)] scale-[1.02]` 
                        : 'bg-zinc-900/50 border-white/5 hover:bg-zinc-900/90 hover:border-white/10'
                    }`}
                  >
                    <PersonaAvatar personality={p.name as SenseiPersonality} size="md" />
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className={`font-bold text-sm ${isSelected ? 'text-white' : 'text-zinc-200'}`}>
                          {p.name}
                        </span>
                        <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded border shrink-0 ${
                          isSelected ? `${theme.bg} ${theme.text} ${theme.border}` : 'bg-zinc-950 text-zinc-500 border-white/5'
                        }`}>
                          {p.tag}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 leading-relaxed font-medium">{p.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Export Portfolio / Progress Data */}
          <div className="glass-panel p-5 rounded-2xl border border-white/5 bg-zinc-950/20 flex flex-col justify-between gap-3">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Clock className={`w-4.5 h-4.5 ${theme.text}`} />
                <h4 className="font-bold text-white text-sm">Export Goal Summary & Notes</h4>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Download your active roadmap timeline, checklist logs, and study notes as a JSON file.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                if (!activeGoal) return
                const blob = new Blob([JSON.stringify(activeGoal, null, 2)], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `mymentor_${activeGoal.title.toLowerCase().replace(/\s+/g, '_')}_summary.json`
                a.click()
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all w-fit cursor-pointer ${theme.btn}`}
            >
              Download Roadmap Data (.json)
            </button>
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
