import React, { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, FileText, ArrowRight, ShieldAlert, Sparkles, Home, Map, Calendar, BarChart2, BookOpen, Settings } from 'lucide-react'
import { useActiveGoal } from '../hooks/useApi'
import { useUIStore } from '../store/uiStore'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate()
  const { accentColor } = useUIStore()
  const { data: activeGoal } = useActiveGoal()
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const getColorClass = (type: 'text' | 'bg' | 'border' | 'btn' | 'glow') => {
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

  // Key listeners
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
      setSearch('')
      setSelectedIndex(0)
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  // Handle outside click
  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  // Compile items
  const menuItems = [
    { name: 'Go to Dashboard', type: 'Nav', path: '/app/', icon: Home },
    { name: 'Go to Roadmap Grid', type: 'Nav', path: '/app/roadmap', icon: Map },
    { name: 'Go to Today\'s Mission', type: 'Nav', path: '/app/today', icon: Calendar },
    { name: 'Go to Progress Analytics', type: 'Nav', path: '/app/progress', icon: BarChart2 },
    { name: 'Go to Resource Library', type: 'Nav', path: '/app/resources', icon: BookOpen },
    { name: 'Go to PDF Uploads', type: 'Nav', path: '/app/pdfs', icon: FileText },
    { name: 'Go to Settings', type: 'Nav', path: '/app/settings', icon: Settings },
  ]

  const getResults = () => {
    const query = search.trim().toLowerCase()
    
    // Fallback: show navigation suggestions
    if (!query) return menuItems

    const results: any[] = []

    // 1. Match navigation items
    menuItems.forEach(item => {
      if (item.name.toLowerCase().includes(query)) {
        results.push(item)
      }
    })

    // 2. Match active goal items (tracks, modules, days, resources)
    if (activeGoal && activeGoal.tracks) {
      activeGoal.tracks.forEach(track => {
        if (track.title.toLowerCase().includes(query)) {
          results.push({ name: `Track: ${track.title}`, type: 'Track', path: '/app/roadmap' })
        }
        if (track.modules) {
          track.modules.forEach(mod => {
            if (mod.title.toLowerCase().includes(query)) {
              results.push({ name: `Module: ${mod.title}`, type: 'Module', path: '/app/roadmap' })
            }
            if (mod.days) {
              mod.days.forEach(day => {
                if (day.title.toLowerCase().includes(query)) {
                  results.push({ name: `Day ${day.day_number}: ${day.title}`, type: 'Day', path: '/app/today' })
                }
                if (day.resources) {
                  day.resources.forEach(res => {
                    if (res.title.toLowerCase().includes(query)) {
                      results.push({ name: `Resource: ${res.title} (${res.platform})`, type: 'Resource', path: '/app/today' })
                    }
                  })
                }
              })
            }
          })
        }
      })
    }

    return results
  }

  const results = getResults()

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose()
    } else if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => (prev + 1) % results.length)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => (prev - 1 + results.length) % results.length)
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (results[selectedIndex]) {
        handleSelect(results[selectedIndex])
      }
    }
  }

  const handleSelect = (item: any) => {
    navigate(item.path)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div 
      onClick={handleOverlayClick}
      className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-start justify-center pt-28 px-4 z-50 animate-fade-in"
    >
      <div 
        className="w-full max-w-xl bg-zinc-950 border border-white/10 rounded-3xl shadow-2xl flex flex-col overflow-hidden max-h-[450px]"
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/5 bg-zinc-900/30">
          <Search className="w-5 h-5 text-zinc-500 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setSelectedIndex(0)
            }}
            placeholder="Search tracks, modules, lessons, resources, or menus..."
            className="w-full bg-transparent border-none text-zinc-200 outline-none placeholder-zinc-500 text-sm"
          />
          <span className="text-[10px] text-zinc-600 bg-white/5 border border-white/10 px-1.5 py-0.5 rounded font-black uppercase shrink-0">ESC</span>
        </div>

        {/* Results List */}
        <div className="overflow-y-auto p-2 flex-grow custom-scrollbar">
          {results.length > 0 ? (
            <div className="flex flex-col gap-1">
              {results.map((item, idx) => {
                const isSelected = idx === selectedIndex
                const IconComponent = item.icon || Sparkles
                
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelect(item)}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`flex items-center justify-between p-3 rounded-xl text-left transition-all text-sm font-semibold cursor-pointer border ${
                      isSelected 
                        ? `${getColorClass('bg')} ${getColorClass('border')} ${getColorClass('text')}`
                        : 'text-zinc-400 border-transparent hover:text-zinc-200 hover:bg-white/5'
                    }`}
                  >
                    <div className="flex items-center gap-3 truncate">
                      <IconComponent className={`w-4 h-4 ${isSelected ? getColorClass('text') : 'text-zinc-500'} shrink-0`} />
                      <span className="truncate">{item.name}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${
                        item.type === 'Nav' ? 'bg-zinc-800 text-zinc-400' :
                        item.type === 'Track' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                        item.type === 'Module' ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20' :
                        'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      }`}>
                        {item.type || 'Goal'}
                      </span>
                      {isSelected && <ArrowRight className="w-3.5 h-3.5" />}
                    </div>
                  </button>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-center gap-2">
              <ShieldAlert className="w-6 h-6 text-zinc-650" />
              <p className="text-zinc-500 text-xs font-semibold">No results found for "{search}"</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
