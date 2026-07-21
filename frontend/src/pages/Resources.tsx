import React, { useState, useMemo } from 'react'
import { 
  BookOpen, 
  ExternalLink, 
  ShieldAlert, 
  Sparkles, 
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

export const Resources: React.FC = () => {
  const { accentColor } = useUIStore()
  const { data: activeGoal } = useActiveGoal()
  const { data: library, isLoading } = useResources(activeGoal?.id || null)
  const updateResourceMutation = useUpdateResource()
  const addCustomResourceMutation = useAddCustomResource()
  
  const [selectedFilter, setSelectedFilter] = useState<string>('ALL')
  const [selectedPlatform, setSelectedPlatform] = useState<string>('ALL')
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('ALL')
  const [searchQuery, setSearchQuery] = useState('')
  
  // Bookmarks state (persisted to localStorage)
  const [bookmarkedIds, setBookmarkedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('mymentor_bookmarks') || '[]')
    } catch {
      return []
    }
  })

  // Completed items state for synthetic items without DB id
  const [localCompletedIds, setLocalCompletedIds] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('mymentor_completed_resources') || '[]')
    } catch {
      return []
    }
  })

  // Notes editing state
  const [editingResourceId, setEditingResourceId] = useState<string | number | null>(null)
  const [editNotesText, setEditNotesText] = useState('')

  // Add Custom Resource Modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [customTitle, setCustomTitle] = useState('')
  const [customCategory, setCustomCategory] = useState('Video')
  const [customPlatform, setCustomPlatform] = useState('YouTube')
  const [customDifficulty, setCustomDifficulty] = useState('Medium')
  const [customUrl, setCustomUrl] = useState('')
  const [customMins, setCustomMins] = useState(30)
  const [customNotes, setCustomNotes] = useState('')
  const [isSubmittingCustom, setIsSubmittingCustom] = useState(false)

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

  const getWorkingUrl = (item: any) => {
    if (!item) return 'https://www.youtube.com'
    if (item.external_url && typeof item.external_url === 'string' && item.external_url.startsWith('http')) {
      return item.external_url
    }

    const cleanTitle = (item.title || '').trim()
    if (!cleanTitle) return 'https://www.google.com'

    const plat = (item.platform || '').toLowerCase()
    const cat = (item.category || '').toLowerCase()
    const lowerTitle = cleanTitle.toLowerCase()

    // 1. LeetCode / Coding Problem detection
    const isCodingProblem = 
      plat.includes('leetcode') || 
      cat.includes('dsa') || 
      cat.includes('algorithm') || 
      cat.includes('coding') ||
      lowerTitle.includes('leetcode') ||
      lowerTitle.includes('two sum') ||
      lowerTitle.includes('valid parentheses') ||
      lowerTitle.includes('binary tree') ||
      lowerTitle.includes('linked list') ||
      lowerTitle.includes('reverse') ||
      lowerTitle.includes('array') ||
      lowerTitle.includes('matrix') ||
      lowerTitle.includes('graph') ||
      lowerTitle.includes('dynamic programming')

    if (isCodingProblem) {
      const slug = lowerTitle
        .replace(/^(leetcode\s*\d*[:\-]?\s*)/i, '')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')

      if (slug && slug.length > 2) {
        return `https://leetcode.com/problems/${slug}/`
      }
      return `https://leetcode.com/problemset/all/?search=${encodeURIComponent(cleanTitle)}`
    }

    // 2. YouTube Video Solutions / Tutorials
    if (plat.includes('youtube') || cat.includes('video') || cat.includes('one-shot')) {
      return `https://www.youtube.com/results?search_query=${encodeURIComponent(cleanTitle + ' tutorial solution')}`
    }

    // 3. GitHub Projects / Code Repos
    if (plat.includes('github') || cat.includes('project')) {
      return `https://github.com/search?q=${encodeURIComponent(cleanTitle)}`
    }

    // 4. Books
    if (plat.includes('book') || cat.includes('book') || lowerTitle.includes('book')) {
      return `https://www.google.com/search?tbm=bks&q=${encodeURIComponent(cleanTitle)}`
    }

    // 5. Clean search without goal suffix
    return `https://www.google.com/search?q=${encodeURIComponent(cleanTitle)}`
  }

  const toggleBookmark = (idStr: string) => {
    const nextBookmarks = bookmarkedIds.includes(idStr)
      ? bookmarkedIds.filter(bId => bId !== idStr)
      : [...bookmarkedIds, idStr]
    setBookmarkedIds(nextBookmarks)
    localStorage.setItem('mymentor_bookmarks', JSON.stringify(nextBookmarks))
  }

  const handleToggleCompletion = async (item: any) => {
    if (!item) return
    const isCompletedCurrent = isItemCompleted(item)

    if (typeof item.id === 'number') {
      try {
        await updateResourceMutation.mutateAsync({
          resourceId: item.id,
          payload: { is_completed: !isCompletedCurrent }
        })
      } catch (err) {
        console.error(err)
      }
    } else {
      const itemKey = getItemKey(item)
      const nextCompleted = isCompletedCurrent
        ? localCompletedIds.filter(id => id !== itemKey)
        : [...localCompletedIds, itemKey]
      setLocalCompletedIds(nextCompleted)
      localStorage.setItem('mymentor_completed_resources', JSON.stringify(nextCompleted))
    }
  }

  const getItemKey = (item: any) => {
    if (!item) return 'res-0'
    return String(item.id || item.title || 'untitled')
  }

  const isItemCompleted = (item: any) => {
    if (!item) return false
    if (typeof item.id === 'number' && item.is_completed !== undefined) {
      return Boolean(item.is_completed)
    }
    return localCompletedIds.includes(getItemKey(item))
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
    } catch (err) {
      console.error(err)
      alert('Failed to add custom resource. Please verify backend connection.')
    } finally {
      setIsSubmittingCustom(false)
    }
  }

  // Robust parsing of library items (handles objects, arrays, and custom dicts)
  const flatResources = useMemo(() => {
    if (!library) return []
    const flat: any[] = []

    if (Array.isArray(library)) {
      library.forEach((item: any, idx: number) => {
        if (item && typeof item === 'object') {
          flat.push({
            ...item,
            id: item.id || `res-${idx}`,
            title: item.title || 'Untitled Resource',
            category: item.category || 'General',
            platform: item.platform || 'YouTube',
            difficulty: item.difficulty || 'Medium',
            libraryGroup: activeGoal?.title || 'Custom AI'
          })
        }
      })
    } else if (typeof library === 'object') {
      Object.entries(library).forEach(([libName, items]) => {
        let displayName = 'General'
        if (libName === 'dsa_must_75') displayName = 'Must 75'
        else if (libName === 'dsa_blind_75') displayName = 'Blind 75'
        else if (libName === 'python_interview_40') displayName = 'Python 40'
        else if (libName === 'sql_25') displayName = 'SQL 25'
        else if (libName === 'java_core') displayName = 'Core Java'
        else if (libName === 'custom_resources') displayName = activeGoal?.title || 'Custom AI'
        else if (libName === 'my_custom_resources') displayName = 'My Added Resources'
        else if (libName === 'uploaded_pdfs') displayName = 'Your PDFs'

        if (Array.isArray(items)) {
          items.forEach((item: any, idx: number) => {
            if (item && typeof item === 'object') {
              flat.push({
                ...item,
                id: item.id || `${libName}-${idx}`,
                title: item.title || 'Untitled Resource',
                category: item.category || 'General',
                platform: item.platform || 'YouTube',
                difficulty: item.difficulty || 'Medium',
                libraryGroup: displayName
              })
            }
          })
        }
      })
    }

    return flat
  }, [library, activeGoal])

  const completedCount = useMemo(() => {
    return flatResources.filter(r => isItemCompleted(r)).length
  }, [flatResources, localCompletedIds])

  const progressPercent = useMemo(() => {
    if (flatResources.length === 0) return 0
    return Math.round((completedCount / flatResources.length) * 100)
  }, [completedCount, flatResources])

  const dynamicCategories = useMemo(() => {
    const cats = new Set<string>()
    flatResources.forEach(item => {
      if (item && item.category) cats.add(item.category)
    })
    return Array.from(cats).sort()
  }, [flatResources])
  const filterOptions = ['ALL', 'COMPLETED', 'BOOKMARKS', ...dynamicCategories]
  
  const platformOptions = useMemo(() => {
    const plats = new Set<string>()
    flatResources.forEach(item => {
      if (item && item.platform) plats.add(item.platform)
    })
    return ['ALL', ...Array.from(plats).sort()]
  }, [flatResources])
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
    const itemTitle = item.title || ''
    const itemNotes = item.notes || ''
    const matchSearch = itemTitle.toLowerCase().includes(searchQuery.toLowerCase()) || 
                       itemNotes.toLowerCase().includes(searchQuery.toLowerCase())
    return matchCategory && matchPlatform && matchDifficulty && matchSearch
  })

  const getActionIcon = (item: any) => {
    const plat = (item.platform || '').toLowerCase()
    const cat = (item.category || '').toLowerCase()
    if (plat.includes('youtube') || cat.includes('video') || cat.includes('one-shot')) {
      return <Video className="w-3.5 h-3.5 text-rose-400" />
    }
    if (plat.includes('book') || cat.includes('book')) {
      return <Book className="w-3.5 h-3.5 text-amber-400" />
    }
    if (plat.includes('pdf')) {
      return <FileText className="w-3.5 h-3.5 text-cyan-400" />
    }
    if (plat.includes('github') || cat.includes('project')) {
      return <Code className="w-3.5 h-3.5 text-purple-400" />
    }
    return <ExternalLink className="w-3.5 h-3.5" />
  }

  const getActionText = (item: any) => {
    const plat = (item.platform || '').toLowerCase()
    const cat = (item.category || '').toLowerCase()
    if (plat.includes('youtube') || cat.includes('video') || cat.includes('one-shot')) {
      return 'Watch Video'
    }
    if (plat.includes('book') || cat.includes('book')) {
      return 'Read Book'
    }
    if (plat.includes('pdf')) {
      return 'Open PDF'
    }
    if (plat.includes('github') || cat.includes('project')) {
      return 'View Code'
    }
    return 'Open Link'
  }

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto py-4">
      {/* Header with Title and Add Resource CTA */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white flex items-center gap-3">
            Resource Library
          </h2>
          <p className="text-zinc-500 font-medium mt-1">
            YouTube one-shots, books, documentation, and user-added custom study materials with progress tracking.
          </p>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${getColorClass('btn')} w-full lg:w-auto`}
          >
            <Plus className="w-4 h-4" /> Add Custom Resource
          </button>

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
      </div>

      {/* Progress & Tracking Overview Bar */}
      {flatResources.length > 0 && (
        <div className="p-4 rounded-2xl bg-zinc-950/40 border border-white/5 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className={`p-2.5 rounded-xl ${getColorClass('bg')} border ${getColorClass('border')}`}>
              <TrendingUp className={`w-5 h-5 ${getColorClass('text')}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-white">Learning Progress</span>
                <span className={`text-xs font-extrabold px-2 py-0.5 rounded-full ${getColorClass('bg')} ${getColorClass('text')}`}>
                  {completedCount} / {flatResources.length} Completed ({progressPercent}%)
                </span>
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">Track your videos, books, and practice materials for your active goal.</p>
            </div>
          </div>

          <div className="w-full md:w-64 flex flex-col gap-1">
            <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden border border-white/5">
              <div 
                className={`h-full transition-all duration-500 ${getColorClass('btn')}`}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <div className="flex justify-between text-[10px] text-zinc-500 font-bold">
              <span>0%</span>
              <span>100% Mastery</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Filters Row */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Category Filters */}
        <div className="flex gap-1 bg-zinc-950/60 p-1.5 rounded-2xl border border-white/5 overflow-x-auto max-w-full">
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
          {filteredItems.map((item, idx) => {
            const itemKey = getItemKey(item)
            const completed = isItemCompleted(item)
            const bookmarked = bookmarkedIds.includes(itemKey)
            const workingUrl = getWorkingUrl(item)

            return (
              <div 
                key={`${itemKey}-${idx}`}
                className={`glass-panel p-5 rounded-3xl border flex flex-col justify-between min-h-[220px] transition-all ${
                  completed 
                    ? 'border-emerald-500/30 bg-emerald-500/5' 
                    : 'border-white/5 bg-zinc-950/15 hover:border-white/15'
                }`}
              >
                <div className="flex flex-col gap-3">
                  {/* Meta details header */}
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleToggleCompletion(item)}
                        className="text-zinc-500 hover:text-emerald-400 transition-colors cursor-pointer"
                        title={completed ? "Mark incomplete" : "Mark completed (+10 XP)"}
                      >
                        {completed ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        ) : (
                          <Circle className="w-5 h-5 text-zinc-650 hover:text-zinc-400" />
                        )}
                      </button>

                      <span className={`text-[9px] font-black px-2 py-0.5 rounded border ${
                        item.category === 'DSA' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        item.category === 'SQL' ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' :
                        item.category === 'Theory' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        item.category === 'Video' || item.category === 'One-Shot' ? 'bg-rose-500/10 text-rose-400 border-rose-500/20' :
                        item.category === 'Book' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' :
                        item.category === 'Project' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                        'bg-zinc-800/40 text-zinc-300 border-white/10'
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
                    
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase">{item.platform}</span>
                      <button
                        onClick={() => toggleBookmark(itemKey)}
                        className={`p-1 rounded hover:bg-white/5 transition-colors cursor-pointer ${
                          bookmarked ? 'text-amber-400' : 'text-zinc-650 hover:text-zinc-350'
                        }`}
                      >
                        <Star className={`w-3.5 h-3.5 ${bookmarked ? 'fill-amber-400' : ''}`} />
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5 flex-grow">
                    <div className="flex items-center justify-between group/title">
                      <a
                        href={workingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`font-extrabold text-sm line-clamp-2 hover:underline cursor-pointer ${
                          completed ? 'text-emerald-300 line-through' : 'text-zinc-100 hover:text-white'
                        }`}
                      >
                        {item.title}
                      </a>

                      {editingResourceId !== item.id && (
                        <button
                          onClick={() => {
                            setEditingResourceId(item.id)
                            setEditNotesText(item.notes || '')
                          }}
                          className="opacity-0 group-hover/title:opacity-100 p-1 text-zinc-500 hover:text-zinc-300 transition-opacity cursor-pointer shrink-0 ml-1"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {editingResourceId === item.id ? (
                      <div className="flex flex-col gap-2 mt-1">
                        <textarea
                          value={editNotesText}
                          onChange={(e) => setEditNotesText(e.target.value)}
                          className="w-full text-xs bg-zinc-950 border border-white/10 rounded-xl p-2 text-zinc-300 outline-none focus:border-white/20 h-20 resize-none"
                        />
                        <div className="flex justify-end gap-1.5">
                          <button
                            onClick={() => setEditingResourceId(null)}
                            className="px-2 py-1 text-[10px] bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded font-semibold cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleSaveNotes(item)}
                            className={`px-2 py-1 text-[10px] rounded font-bold cursor-pointer ${getColorClass('btn')}`}
                          >
                            Save
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-zinc-500 leading-relaxed line-clamp-3">{item.notes || 'No notes added yet.'}</p>
                    )}
                  </div>
                </div>

                {/* Bottom detail action links */}
                <div className="border-t border-white/5 pt-4 mt-4 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[10px] text-zinc-500 font-semibold uppercase">
                    <span>Est: {item.estimated_duration_mins || item.estimated_time_mins || 30}m</span>
                    <span>•</span>
                    <span>+{item.xp_reward || 10} XP</span>
                  </div>

                  <a
                    href={workingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex items-center gap-1.5 text-xs font-bold hover:underline cursor-pointer ${getColorClass('text')}`}
                  >
                    {getActionIcon(item)} {getActionText(item)}
                  </a>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center min-h-[40vh] text-center p-8 gap-3">
          <ShieldAlert className="w-8 h-8 text-zinc-650" />
          <h4 className="font-bold text-zinc-400 text-sm">No items found in filter category</h4>
          <p className="text-xs text-zinc-550">Adjust your search or filter settings to see more resources.</p>
        </div>
      )}

      {/* Add Custom Resource Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-white/10 rounded-3xl p-6 w-full max-w-lg shadow-2xl relative">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-5 right-5 p-1 rounded-full text-zinc-500 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className={`p-2.5 rounded-2xl ${getColorClass('bg')} border ${getColorClass('border')}`}>
                <Plus className={`w-5 h-5 ${getColorClass('text')}`} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Add Custom Resource</h3>
                <p className="text-xs text-zinc-500">Add YouTube tutorials, books, PDFs, or code repos to your goal roadmap.</p>
              </div>
            </div>

            <form onSubmit={handleAddCustomResourceSubmit} className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-zinc-400 block mb-1.5">Resource Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Python Full Course One-Shot / Crop Science Reference Book"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-white/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-400 block mb-1.5">Category</label>
                  <select
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-zinc-300 outline-none"
                  >
                    <option value="Video">Video / One-Shot</option>
                    <option value="Book">Book / Manual</option>
                    <option value="Theory">Theory & Articles</option>
                    <option value="Project">Project / Code Repo</option>
                    <option value="Practice">Practice & Exercises</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-400 block mb-1.5">Platform</label>
                  <select
                    value={customPlatform}
                    onChange={(e) => setCustomPlatform(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-zinc-300 outline-none"
                  >
                    <option value="YouTube">YouTube</option>
                    <option value="Google Books">Google Books</option>
                    <option value="GitHub">GitHub</option>
                    <option value="Documentation">Documentation</option>
                    <option value="Other">Other Web Site</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-zinc-400 block mb-1.5">Difficulty</label>
                  <select
                    value={customDifficulty}
                    onChange={(e) => setCustomDifficulty(e.target.value)}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3 py-2.5 text-xs text-zinc-300 outline-none"
                  >
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-zinc-400 block mb-1.5">Est. Duration (Mins)</label>
                  <input
                    type="number"
                    min="5"
                    max="600"
                    value={customMins}
                    onChange={(e) => setCustomMins(Number(e.target.value))}
                    className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-white/20"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 block mb-1.5">External URL (Optional)</label>
                <input
                  type="url"
                  placeholder="https://... (Leave empty to auto-generate YouTube/Google search link)"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-white/20"
                />
                <span className="text-[10px] text-zinc-500 mt-1 block">If left empty, a working direct YouTube or Google search link will be auto-created for you.</span>
              </div>

              <div>
                <label className="text-xs font-bold text-zinc-400 block mb-1.5">Notes / Description</label>
                <textarea
                  rows={3}
                  placeholder="What key takeaways or instructions relate to this resource?"
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                  className="w-full bg-zinc-900 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-white/20 resize-none"
                />
              </div>

              <div className="flex justify-end gap-3 mt-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 text-xs font-bold text-zinc-400 bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingCustom || !customTitle.trim()}
                  className={`px-5 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer ${getColorClass('btn')} disabled:opacity-50`}
                >
                  {isSubmittingCustom ? 'Adding...' : 'Save & Track Resource'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
