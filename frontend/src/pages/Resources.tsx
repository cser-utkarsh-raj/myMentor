import React, { useState } from 'react'
import { BookOpen, ExternalLink, ShieldAlert, Sparkles, Filter, Search } from 'lucide-react'
import { useResources } from '../hooks/useApi'
import { useUIStore } from '../store/uiStore'

export const Resources: React.FC = () => {
  const { accentColor } = useUIStore()
  const { data: library, isLoading } = useResources()
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL')
  const [selectedPlatform, setSelectedPlatform] = useState<string>('ALL')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')

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
  const filterOptions = ['ALL', 'DSA', 'Python', 'SQL', 'System Design', 'React']
  const platformOptions = ['ALL', 'LeetCode', 'HackerRank', 'Internal', 'GitHub', 'YouTube']
  const difficultyOptions = ['ALL', 'Easy', 'Medium', 'Hard']
  
  const filteredItems = flatResources.filter(item => {
    const matchCategory = selectedFilter === 'ALL' || item.category === selectedFilter
    const matchPlatform = selectedPlatform === 'ALL' || item.platform === selectedPlatform
    const matchDifficulty = selectedDifficulty === 'ALL' || item.difficulty === selectedDifficulty
    const matchSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       (item.notes && item.notes.toLowerCase().includes(searchQuery.toLowerCase()))
    return matchCategory && matchPlatform && matchDifficulty && matchSearch
  })

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto py-4">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            Resource Library
          </h2>
          <p className="text-zinc-500 font-medium mt-1">
            Built-in problem sets and conceptual blueprints.
          </p>
        </div>

        {/* Search */}
        <div className="relative w-full lg:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
          <input 
            type="text" 
            placeholder="Search resources..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-950/60 border border-white/10 rounded-xl py-2 pl-9 pr-4 text-sm text-white outline-none focus:border-white/20"
          />
        </div>
      </div>
      
      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Category Filters */}
        <div className="flex gap-1 bg-zinc-950/60 p-1.5 rounded-2xl border border-white/5 overflow-x-auto">
          {filterOptions.map((opt) => (
            <button
              key={`cat-${opt}`}
              type="button"
              onClick={() => setSelectedFilter(opt)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedFilter === opt 
                  ? `${getColorClass('bg')} ${getColorClass('text')}` 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
        
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-zinc-500" />
          <select 
            value={selectedPlatform}
            onChange={(e) => setSelectedPlatform(e.target.value)}
            className="bg-zinc-950/60 border border-white/10 rounded-xl py-2 px-3 text-xs text-zinc-300 outline-none"
          >
            {platformOptions.map(opt => (
              <option key={`plat-${opt}`} value={opt}>{opt === 'ALL' ? 'All Platforms' : opt}</option>
            ))}
          </select>
          
          <select 
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="bg-zinc-950/60 border border-white/10 rounded-xl py-2 px-3 text-xs text-zinc-300 outline-none"
          >
            {difficultyOptions.map(opt => (
              <option key={`diff-${opt}`} value={opt}>{opt === 'ALL' ? 'All Difficulties' : opt}</option>
            ))}
          </select>
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
                  <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${
                      item.category === 'DSA' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      item.category === 'SQL' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                      'bg-purple-500/10 text-purple-400 border-purple-500/20'
                    }`}>
                      {item.category}
                    </span>
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${
                      item.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                      item.difficulty === 'Hard' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                      'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}>
                      {item.difficulty}
                    </span>
                  </div>
                  
                  <span className="text-[10px] text-zinc-500 font-bold uppercase">{item.platform}</span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <h4 className="font-extrabold text-sm text-zinc-200 line-clamp-1">{item.title}</h4>
                  <p className="text-xs text-zinc-500 leading-relaxed line-clamp-3">{item.notes}</p>
                </div>
              </div>

              {/* Bottom detail action links */}
              <div className="border-t border-white/5 pt-4 mt-4 flex items-center justify-between">
                <div className="flex items-center gap-3 text-[10px] text-zinc-500 font-semibold uppercase">
                  <span>Est: {item.estimated_duration_mins || 30}m</span>
                  <span>•</span>
                  <span>+{item.xp_reward || 10} XP</span>
                </div>

                {item.external_url && item.external_url !== '#' ? (
                  <a
                    href={item.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-1.5 text-xs font-bold hover:underline cursor-pointer ${getColorClass('text')}`}
                  >
                    Open Link <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                ) : (
                  <span className="text-[10px] text-zinc-600 font-bold">Internal</span>
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center p-8 gap-3">
          <ShieldAlert className="w-8 h-8 text-zinc-650" />
          <h4 className="font-bold text-zinc-400 text-sm">No items found in filter category</h4>
          <p className="text-xs text-zinc-550">Adjust your search or filter settings to see more resources.</p>
        </div>
      )}
    </div>
  )
}
