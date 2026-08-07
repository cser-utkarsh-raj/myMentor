import React, { useState, useMemo } from 'react'
import { 
  BookOpen, 
  ExternalLink, 
  ShieldAlert, 
  Filter, 
  Search, 
  Star, 
  Edit2, 
  Plus, 
  CheckCircle2, 
  Circle, 
  Video, 
  Book, 
  FileText, 
  Code, 
  TrendingUp,
  X 
} from 'lucide-react'
import { useResources, useUpdateResource, useActiveGoal, useAddCustomResource } from '../hooks/useApi'
import { useUIStore } from '../store/uiStore'
import { getColorClasses } from '../lib/theme'

export const Resources: React.FC = () => {
  const { accentColor } = useUIStore()
  const theme = getColorClasses(accentColor)
  const { data: activeGoal } = useActiveGoal()
  const { data: library, isLoading } = useResources(activeGoal?.id || null)
  const updateResourceMutation = useUpdateResource()
  const addCustomResourceMutation = useAddCustomResource()
  
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL')
  const [selectedPlatform, setSelectedPlatform] = useState<string>('ALL')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('mymentor_bookmarks') || '[]') } catch { return [] }
  })
  const [localCompletedIds, setLocalCompletedIds] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('mymentor_completed_resources') || '[]') } catch { return [] }
  })

  const [editingResourceId, setEditingResourceId] = useState<string | number | null>(null)
  const [editNotesText, setEditNotesText] = useState('')

  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [customTitle, setCustomTitle] = useState('')
  const [customCategory, setCustomCategory] = useState('Video')
  const [customPlatform, setCustomPlatform] = useState('YouTube')
  const [customDifficulty, setCustomDifficulty] = useState('Medium')
  const [customUrl, setCustomUrl] = useState('')
  const [customMins, setCustomMins] = useState(30)
  const [customNotes, setCustomNotes] = useState('')
  const [isSubmittingCustom, setIsSubmittingCustom] = useState(false)

  const getItemKey = (item: any) => item.id ? String(item.id) : `res-${(item.title || '').replace(/\s+/g, '-').toLowerCase()}`

  const toggleBookmark = (key: string) => {
    setBookmarkedIds(prev => {
      const next = prev.includes(key) ? prev.filter(i => i !== key) : [...prev, key]
      localStorage.setItem('mymentor_bookmarks', JSON.stringify(next))
      return next
    })
  }

  const handleToggleCompletion = async (item: any) => {
    const key = getItemKey(item)
    if (item && typeof item.id === 'number') {
      try {
        await updateResourceMutation.mutateAsync({
          resourceId: item.id,
          payload: { is_completed: !item.is_completed }
        })
      } catch (e) {
        console.error(e)
      }
    } else {
      setLocalCompletedIds(prev => {
        const next = prev.includes(key) ? prev.filter(i => i !== key) : [...prev, key]
        localStorage.setItem('mymentor_completed_resources', JSON.stringify(next))
        return next
      })
    }
  }

  const isItemCompleted = (item: any) => {
    if (item && typeof item.id === 'number') return Boolean(item.is_completed)
    return localCompletedIds.includes(getItemKey(item))
  }

  const getWorkingUrl = (item: any) => {
    if (item?.external_url?.startsWith('http')) return item.external_url
    const title = encodeURIComponent(item?.title || 'learning')
    const plat = (item?.platform || '').toLowerCase()
    if (plat.includes('youtube')) return `https://www.youtube.com/results?search_query=${title}`
    if (plat.includes('book')) return `https://books.google.com/books?q=${title}`
    if (plat.includes('github')) return `https://github.com/search?q=${title}`
    return `https://www.google.com/search?q=${title}`
  }

  const handleSaveNotes = async (item: any) => {
    if (item && typeof item.id === 'number') {
      try {
        await updateResourceMutation.mutateAsync({
          resourceId: item.id,
          payload: { notes: editNotesText }
        })
      } catch {
        alert('Failed to save notes')
      }
    }
    setEditingResourceId(null)
  }

  const handleAddCustomResourceSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!customTitle.trim()) return
    setIsSubmittingCustom(true)
    try {
      await addCustomResourceMutation.mutateAsync({
        title: customTitle.trim(),
        category: customCategory,
        platform: customPlatform,
        difficulty: customDifficulty,
        external_url: customUrl.trim() || undefined,
        estimated_time_mins: Number(customMins) || 30,
        notes: customNotes.trim() || undefined,
        goal_id: activeGoal?.id
      })
      setIsAddModalOpen(false)
      setCustomTitle('')
      setCustomUrl('')
      setCustomNotes('')
    } catch {
      alert('Failed to add custom resource.')
    } finally {
      setIsSubmittingCustom(false)
    }
  }

  const flatResources = useMemo(() => {
    if (!library) return []
    const flat: any[] = []
    const processItem = (item: any, idx: number, grp: string) => {
      if (item && typeof item === 'object') {
        flat.push({
          ...item,
          id: item.id || `res-${idx}`,
          title: item.title || 'Untitled Resource',
          category: item.category || 'General',
          platform: item.platform || 'YouTube',
          difficulty: item.difficulty || 'Medium',
          libraryGroup: grp
        })
      }
    }

    if (Array.isArray(library)) {
      library.forEach((item, idx) => processItem(item, idx, activeGoal?.title || 'Custom AI'))
    } else if (typeof library === 'object') {
      Object.entries(library).forEach(([libName, items]) => {
        const displayName = libName === 'custom_resources' ? activeGoal?.title || 'Custom AI' : libName
        if (Array.isArray(items)) items.forEach((item, idx) => processItem(item, idx, displayName))
      })
    }
    return flat
  }, [library, activeGoal])

  const completedCount = useMemo(() => flatResources.filter(r => isItemCompleted(r)).length, [flatResources, localCompletedIds])
  const progressPercent = flatResources.length ? Math.round((completedCount / flatResources.length) * 100) : 0

  const dynamicCategories = useMemo(() => Array.from(new Set(flatResources.map(i => i.category))).sort(), [flatResources])
  const filterOptions = ['ALL', 'COMPLETED', 'BOOKMARKS', ...dynamicCategories]
  const platformOptions = useMemo(() => ['ALL', ...Array.from(new Set(flatResources.map(i => i.platform))).sort()], [flatResources])
  const difficultyOptions = ['ALL', 'Easy', 'Medium', 'Hard']
  
  const filteredItems = flatResources.filter(item => {
    if (!item) return false
    const itemKey = getItemKey(item)
    const matchCategory = selectedFilter === 'ALL' 
      || (selectedFilter === 'BOOKMARKS' && bookmarkedIds.includes(itemKey))
      || (selectedFilter === 'COMPLETED' && isItemCompleted(item))
      || item.category === selectedFilter
    const matchPlatform = selectedPlatform === 'ALL' || item.platform === selectedPlatform
    const matchDifficulty = selectedDifficulty === 'ALL' || item.difficulty === selectedDifficulty
    const matchSearch = (item.title || '').toLowerCase().includes(searchQuery.toLowerCase()) || 
                        (item.notes || '').toLowerCase().includes(searchQuery.toLowerCase())
    return matchCategory && matchPlatform && matchDifficulty && matchSearch
  })

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto py-4">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">Resource Library</h2>
          <p className="text-zinc-500 font-medium mt-1">Study materials, video tutorials, and reference documentation for your active goal.</p>
        </div>
        <div className="flex items-center gap-3 w-full lg:w-auto">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs cursor-pointer ${theme.btn} w-full lg:w-auto`}
          >
            <Plus className="w-4 h-4" /> Add Custom Resource
          </button>
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
      </div>

      {/* Progress Bar */}
      {flatResources.length > 0 && (
        <div className="p-4 rounded-2xl bg-zinc-950/40 border border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${theme.bg} border ${theme.border}`}>
              <TrendingUp className={`w-5 h-5 ${theme.text}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">Learning Progress</span>
                <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${theme.bg} ${theme.text}`}>
                  {completedCount} / {flatResources.length} Completed ({progressPercent}%)
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">Track your study materials and practice problems.</p>
            </div>
          </div>
          <div className="w-full md:w-64 flex flex-col gap-1">
            <div className="w-full h-2.5 rounded-full bg-zinc-900 overflow-hidden border border-white/5">
              <div className={`h-full transition-all duration-500 ${theme.btn}`} style={{ width: `${progressPercent}%` }} />
            </div>
          </div>
        </div>
      )}
      
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex gap-1 bg-zinc-950/60 p-1.5 rounded-2xl border border-white/5 overflow-x-auto max-w-full">
          {filterOptions.map((opt) => (
            <button
              key={`cat-${opt}`}
              onClick={() => setSelectedFilter(opt)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                selectedFilter === opt ? `${theme.bg} ${theme.text}` : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-zinc-500" />
          <select value={selectedPlatform} onChange={(e) => setSelectedPlatform(e.target.value)} className="bg-zinc-950/60 border border-white/10 rounded-xl py-2 px-3 text-xs text-zinc-300 outline-none">
            {platformOptions.map(opt => <option key={`plat-${opt}`} value={opt}>{opt === 'ALL' ? 'All Platforms' : opt}</option>)}
          </select>
          <select value={selectedDifficulty} onChange={(e) => setSelectedDifficulty(e.target.value)} className="bg-zinc-950/60 border border-white/10 rounded-xl py-2 px-3 text-xs text-zinc-300 outline-none">
            {difficultyOptions.map(opt => <option key={`diff-${opt}`} value={opt}>{opt === 'ALL' ? 'All Difficulties' : opt}</option>)}
          </select>
        </div>
      </div>

      {/* Grid List */}
      {isLoading ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <div className="w-8 h-8 rounded-full border-2 border-dashed border-zinc-500 animate-spin" />
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item, idx) => {
            const itemKey = getItemKey(item)
            const completed = isItemCompleted(item)
            const bookmarked = bookmarkedIds.includes(itemKey)
            const workingUrl = getWorkingUrl(item)

            return (
              <div 
                key={`${itemKey}-${idx}`}
                className={`glass-panel p-5 rounded-3xl border flex flex-col justify-between min-h-[210px] transition-all ${
                  completed ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/5 bg-zinc-950/15 hover:border-white/15'
                }`}
              >
                <div className="flex flex-col gap-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleToggleCompletion(item)} className="text-zinc-500 hover:text-emerald-400 transition-colors cursor-pointer">
                        {completed ? <CheckCircle2 className="w-5 h-5 text-emerald-400" /> : <Circle className="w-5 h-5 text-zinc-600" />}
                      </button>
                      <span className="text-[9px] font-black px-2 py-0.5 rounded border bg-zinc-800/40 text-zinc-300 border-white/10">{item.category}</span>
                      <span className="text-[9px] font-black px-2 py-0.5 rounded border bg-amber-500/10 text-amber-400 border-amber-500/20">{item.difficulty}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase">{item.platform}</span>
                      <button onClick={() => toggleBookmark(itemKey)} className={`p-1 rounded hover:bg-white/5 transition-colors cursor-pointer ${bookmarked ? 'text-amber-400' : 'text-zinc-650'}`}>
                        <Star className={`w-3.5 h-3.5 ${bookmarked ? 'fill-amber-400' : ''}`} />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 flex-grow">
                    <div className="flex items-center justify-between group/title">
                      <a href={workingUrl} target="_blank" rel="noopener noreferrer" className={`font-extrabold text-sm line-clamp-2 hover:underline cursor-pointer ${completed ? 'text-emerald-300 line-through' : 'text-zinc-100'}`}>
                        {item.title}
                      </a>
                      {editingResourceId !== item.id && (
                        <button onClick={() => { setEditingResourceId(item.id); setEditNotesText(item.notes || '') }} className="opacity-0 group-hover/title:opacity-100 p-1 text-zinc-500 hover:text-zinc-300 shrink-0">
                          <Edit2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                    {editingResourceId === item.id ? (
                      <div className="flex flex-col gap-2 mt-1">
                        <textarea value={editNotesText} onChange={(e) => setEditNotesText(e.target.value)} className="w-full text-xs bg-zinc-950 border border-white/10 rounded-xl p-2 text-zinc-300 outline-none h-20 resize-none" />
                        <div className="flex justify-end gap-1.5">
                          <button onClick={() => setEditingResourceId(null)} className="px-2 py-1 text-[10px] bg-zinc-800 text-zinc-300 rounded font-semibold">Cancel</button>
                          <button onClick={() => handleSaveNotes(item)} className={`px-2 py-1 text-[10px] rounded font-bold ${theme.btn}`}>Save</button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-500 leading-relaxed line-clamp-3">{item.notes || 'No notes added.'}</p>
                    )}
                  </div>
                </div>

                <div className="border-t border-white/5 pt-3 mt-3 flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500 font-semibold">+{item.xp_reward || 10} XP</span>
                  <a href={workingUrl} target="_blank" rel="noopener noreferrer" className={`flex items-center gap-1.5 text-xs font-bold hover:underline ${theme.text}`}>
                    <ExternalLink className="w-3.5 h-3.5" /> Open Link
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center p-8 gap-3">
          <ShieldAlert className="w-8 h-8 text-zinc-600" />
          <h4 className="font-bold text-zinc-400 text-sm">No items found</h4>
        </div>
      )}

      {/* Add Custom Resource Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-white/10 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative">
            <button onClick={() => setIsAddModalOpen(false)} className="absolute top-5 right-5 p-1 rounded-full text-zinc-500 hover:text-white"><X className="w-5 h-5" /></button>
            <div className="flex items-center gap-3 mb-5">
              <div className={`p-2.5 rounded-2xl ${theme.bg} border ${theme.border}`}><Plus className={`w-5 h-5 ${theme.text}`} /></div>
              <div><h3 className="text-lg font-bold text-white">Add Custom Resource</h3></div>
            </div>
            <form onSubmit={handleAddCustomResourceSubmit} className="flex flex-col gap-4">
              <input type="text" required placeholder="Resource Title *" value={customTitle} onChange={(e) => setCustomTitle(e.target.value)} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none" />
              <div className="grid grid-cols-2 gap-3">
                <select value={customCategory} onChange={(e) => setCustomCategory(e.target.value)} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-zinc-300">
                  <option value="Video">Video</option><option value="Book">Book</option><option value="Theory">Theory</option><option value="Project">Project</option>
                </select>
                <select value={customPlatform} onChange={(e) => setCustomPlatform(e.target.value)} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-zinc-300">
                  <option value="YouTube">YouTube</option><option value="Google Books">Google Books</option><option value="GitHub">GitHub</option>
                </select>
              </div>
              <input type="url" placeholder="https://..." value={customUrl} onChange={(e) => setCustomUrl(e.target.value)} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none" />
              <textarea rows={3} placeholder="Notes..." value={customNotes} onChange={(e) => setCustomNotes(e.target.value)} className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none resize-none" />
              <div className="flex justify-end gap-3 mt-2">
                <button type="button" onClick={() => setIsAddModalOpen(false)} className="px-4 py-2.5 text-xs font-bold text-zinc-400 bg-zinc-900 rounded-xl">Cancel</button>
                <button type="submit" disabled={isSubmittingCustom || !customTitle.trim()} className={`px-5 py-2.5 text-xs font-bold rounded-xl ${theme.btn}`}>Save & Track</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
