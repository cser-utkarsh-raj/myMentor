import React, { useState } from 'react'
import { BookOpen, ExternalLink, ShieldAlert, Sparkles, Filter } from 'lucide-react'
import { useResources } from '../hooks/useApi'
import { useUIStore } from '../store/uiStore'

export const Resources: React.FC = () => {
  const { accentColor } = useUIStore()
  const { data: library, isLoading } = useResources()
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL')

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
      case 'purple':
      default:
        if (type === 'text') return 'text-purple-400'
        if (type === 'bg') return 'bg-purple-500/10'
        if (type === 'border') return 'border-purple-500/20'
        if (type === 'btn') return 'bg-purple-500 hover:bg-purple-400 text-zinc-950 shadow-[0_0_15px_rgba(168,85,247,0.3)]'
        return 'rgba(168, 85, 247, 0.4)'
    }
  }

  // Flatten the library mapping into a single list
  const getFlattenedResources = () => {
    if (!library) return []
    const flat: any[] = []
    
    Object.entries(library).forEach(([libName, items]) => {
      let displayName = 'General'
      if (libName === 'dsa_must_75') displayName = 'Must 75'
      else if (libName === 'dsa_blind_75') displayName = 'Blind 75'
      else if (libName === 'python_interview_40') displayName = 'Python 40'
      else if (libName === 'sql_25') displayName = 'SQL 25'
      else if (libName === 'java_core') displayName = 'Core Java'

      items.forEach((item) => {
        flat.push({
          ...item,
          libraryGroup: displayName
        })
      })
    })

    return flat
  }

  const flatResources = getFlattenedResources()
  const filterOptions = ['ALL', 'DSA', 'Python', 'SQL', 'Java']
  
  const filteredItems = selectedFilter === 'ALL' 
    ? flatResources 
    : flatResources.filter(item => item.category === selectedFilter)

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto py-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            Resource Library
          </h2>
          <p className="text-zinc-500 font-medium mt-1">
            Built-in problem sets and conceptual blueprints. Toggle category filters to study.
          </p>
        </div>

        {/* Filter categories */}
        <div className="flex gap-1 bg-zinc-950/60 p-1.5 rounded-2xl border border-white/5">
          {filterOptions.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => setSelectedFilter(opt)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                selectedFilter === opt 
                  ? `${getColorClass('bg')} ${getColorClass('text')}` 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 rounded-full border-2 border-dashed border-zinc-500 animate-spin" />
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item, idx) => (
            <div 
              key={idx}
              className="glass-panel p-5 rounded-3xl border border-white/5 bg-zinc-950/15 flex flex-col justify-between min-h-[220px]"
            >
              <div className="flex flex-col gap-3">
                {/* Meta details header */}
                <div className="flex justify-between items-center">
                  <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${
                    item.category === 'DSA' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                    item.category === 'SQL' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                    'bg-purple-500/10 text-purple-400 border-purple-500/20'
                  }`}>
                    {item.category}
                  </span>
                  
                  <span className="text-[10px] text-zinc-500 font-bold uppercase">{item.libraryGroup}</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <h4 className="font-extrabold text-sm text-zinc-200 line-clamp-1">{item.title}</h4>
                  <p className="text-xs text-zinc-500 leading-relaxed line-clamp-3">{item.notes}</p>
                </div>
              </div>

              {/* Bottom detail action links */}
              <div className="border-t border-white/5 pt-4 mt-4 flex items-center justify-between">
                <div className="flex items-center gap-3 text-[10px] text-zinc-500 font-semibold uppercase">
                  <span>Est: {item.estimated_time_mins}m</span>
                  <span>•</span>
                  <span>+{item.xp} XP</span>
                </div>

                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-1.5 text-xs font-bold hover:underline cursor-pointer ${getColorClass('text')}`}
                >
                  Solve Problem <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center p-8 gap-3">
          <ShieldAlert className="w-8 h-8 text-zinc-650" />
          <h4 className="font-bold text-zinc-400 text-sm">No items found in filter category</h4>
          <p className="text-xs text-zinc-550">Please select 'ALL' or other active libraries.</p>
        </div>
      )}
    </div>
  )
}
