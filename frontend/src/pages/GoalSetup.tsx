import React, { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowLeft, ArrowRight, Calendar, CheckCircle2, Clock, Loader2, Sparkles, Target, Zap } from 'lucide-react'
import { useCreateGoal, useGoalLibrary } from '../hooks/useApi'
import { useUIStore } from '../store/uiStore'
import { getColorClasses } from '../lib/theme'

export const GoalSetup: React.FC = () => {
  const navigate = useNavigate()
  const { accentColor } = useUIStore()
  const theme = getColorClasses(accentColor)
  const createGoalMutation = useCreateGoal()
  const { data: categorizedGoals, isLoading: libraryLoading, isError: libraryError, refetch } = useGoalLibrary()
  const [step, setStep] = useState(1)
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null)
  const [goal, setGoal] = useState('')
  const [customGoal, setCustomGoal] = useState('')
  const [qExperience, setQExperience] = useState('')
  const [qFocus, setQFocus] = useState('')
  const [qLearnStyle, setQLearnStyle] = useState('')
  const [target, setTarget] = useState('Career transition / new job')
  const [customTarget, setCustomTarget] = useState('')
  const [activeMode, setActiveMode] = useState('Learning')
  const [dailyHours, setDailyHours] = useState(3)
  const [timelineDays, setTimelineDays] = useState(45)
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState('')

  const selectedGoalDetails = useMemo(() => {
    if (!categorizedGoals || !selectedGoalId) return null
    for (const category of Object.keys(categorizedGoals)) {
      const found = categorizedGoals[category]?.find((g: any) => g.id === selectedGoalId)
      if (found) return found
    }
    return null
  }, [categorizedGoals, selectedGoalId])

  const finalGoal = selectedGoalId === 'custom-01' ? customGoal.trim() : goal.trim()
  const finalTarget = target === 'Other' ? customTarget.trim() : target
  const validStep = () => {
    if (step === 1) return !!finalGoal
    if (step === 2) return !!qExperience.trim() && !!qFocus.trim() && !!qLearnStyle.trim()
    if (step === 3) return !!finalTarget
    return true
  }

  const next = () => {
    if (!validStep()) return
    setGenerationError('')
    if (step < 4) setStep(step + 1)
  }
  const back = () => { if (step > 1) setStep(step - 1) }

  const finish = async () => {
    if (!validStep()) return
    setIsGenerating(true)
    setGenerationError('')
    const structuredTarget = `Target: ${finalTarget} | Experience Level: ${qExperience} | Core Focus Areas: ${qFocus} | Preferred Learning Style: ${qLearnStyle}`
    try {
      await createGoalMutation.mutateAsync({ title: finalGoal, target: structuredTarget, active_mode: activeMode, daily_hours: dailyHours, timeline_days: timelineDays })
      navigate('/app', { replace: true })
    } catch (error: any) {
      setGenerationError(error?.message || 'We could not generate your roadmap. Please retry.')
      setIsGenerating(false)
    }
  }

  const stepNames = ['Goal', 'About You', 'Target', 'Review']
  const targetOptions = [
    ['Interview preparation', 'Interview-focused practice, timed drills and assessment.'],
    ['Career transition / new job', 'Job-ready skills, portfolio evidence and production practices.'],
    ['Side project / fast launch', 'Build, test and ship a working product.'],
    ['Core skill mastery', 'Deep foundations, deliberate practice and advanced mastery.'],
    ['Casual / flexible learning', 'Lower-pressure learning with room to adapt.'],
    ['Other', 'Define your own measurable outcome.']
  ]

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col justify-center items-center px-4 py-16 relative overflow-x-hidden w-full">
      <div className="absolute w-[600px] h-[600px] rounded-full blur-[140px] -z-10 pointer-events-none opacity-20" style={{ background: `radial-gradient(circle, ${theme.hex} 0%, transparent 70%)`, top: '30%', left: '50%', transform: 'translate(-50%, -50%)' }} />
      <div className="absolute top-6 flex items-center gap-3 cursor-pointer" onClick={() => navigate('/app')}>
        <img src="/mymentor-logo.svg" alt="myMentor Logo" className="w-9 h-9" />
        <h1 className="text-xl font-black tracking-tight text-white">my<span className={theme.text}>Mentor</span></h1>
      </div>

      <AnimatePresence mode="wait">
        {isGenerating ? (
          <motion.div key="generating" initial={{ opacity: 0, scale: .96 }} animate={{ opacity: 1, scale: 1 }} className="w-full max-w-xl glass-panel p-10 rounded-3xl border-2 border-black flex flex-col items-center justify-center text-center gap-6 bg-[#121217]">
            <div className="relative flex items-center justify-center w-32 h-32">
              <div className="w-28 h-28 rounded-full border-4 border-dashed border-purple-500/30 animate-spin" style={{ animationDuration: '7s' }} />
              <div className="absolute w-20 h-20 rounded-full border-4 border-t-cyan-400 border-b-rose-500 border-l-transparent border-r-transparent animate-spin" style={{ animationDuration: '1.5s' }} />
              <img src="/mymentor-logo.svg" alt="Generating" className="absolute w-12 h-12" />
            </div>
            <div><h2 className="text-2xl font-black text-white">Building your learning system</h2><p className="text-sm text-zinc-400 mt-2">Planning prerequisites, daily workload, practice, review and real resources.</p></div>
          </motion.div>
        ) : (
          <motion.div key="wizard" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-4xl glass-panel p-6 md:p-10 rounded-3xl border-2 border-black bg-[#121217] flex flex-col gap-8">
            <div className="flex items-center justify-between border-b border-white/5 pb-5">
              <div><div className={`text-xs font-black uppercase tracking-widest ${theme.text}`}>Step {step} of 4</div><div className="text-sm text-zinc-400 mt-1">{stepNames[step - 1]}</div></div>
              <div className="flex gap-1.5">{[1,2,3,4].map(s => <div key={s} className={`w-10 h-1.5 rounded-full ${s <= step ? theme.btn : 'bg-zinc-800'}`} />)}</div>
            </div>

            <div className="min-h-[430px] flex flex-col justify-center">
              <AnimatePresence mode="wait">
                {step === 1 && <motion.div key="one" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-6">
                  <div><h2 className="text-3xl font-black text-white flex items-center gap-2">What are you learning? <Sparkles className={theme.text} /></h2><p className="text-sm text-zinc-500 mt-2">Pick a pathway or create your own. This becomes the curriculum anchor.</p></div>
                  {libraryError ? <div className="p-6 rounded-2xl border border-amber-500/20 bg-amber-500/5 text-center"><p className="text-sm text-zinc-400">The learning library could not be loaded.</p><button onClick={() => refetch()} className="mt-3 px-4 py-2 rounded-xl bg-zinc-900 text-white text-xs font-bold">Retry</button></div> : libraryLoading ? <div className="flex justify-center py-16"><Loader2 className={`w-8 h-8 animate-spin ${theme.text}`} /></div> : <div className="max-h-[420px] overflow-y-auto pr-2 space-y-6">{categorizedGoals && Object.entries(categorizedGoals).map(([category, goals]: [string, any]) => <div key={category}><div className="text-xs font-black uppercase tracking-widest text-zinc-600 mb-3">{category}</div><div className="grid md:grid-cols-2 gap-3">{goals.map((g: any) => <button key={g.id} type="button" onClick={() => { setSelectedGoalId(g.id); setGoal(g.title); if (g.id !== 'custom-01') setCustomGoal('') }} className={`p-4 rounded-2xl border-2 text-left transition-all ${selectedGoalId === g.id ? `${theme.bg} ${theme.border} -translate-y-0.5` : 'bg-zinc-950/50 border-black hover:border-white/10'}`}><div className="font-bold text-sm text-white">{g.title}</div><div className="text-xs text-zinc-500 mt-1 leading-relaxed">{g.description}</div></button>)}</div></div>)}</div>}
                  {selectedGoalId === 'custom-01' && <input value={customGoal} onChange={e => setCustomGoal(e.target.value)} placeholder="e.g. Become a product designer" className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-white/30" />}
                </motion.div>}

                {step === 2 && <motion.div key="two" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-5 max-w-2xl mx-auto w-full">
                  <div><h2 className="text-3xl font-black text-white">Tell Sensei about you.</h2><p className="text-sm text-zinc-500 mt-2">These answers change sequencing and workload. No more fake personalization hidden inside a giant target string.</p></div>
                  <label className="text-xs font-bold text-zinc-400">Experience level<select value={qExperience} onChange={e => setQExperience(e.target.value)} className="mt-2 w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white"><option value="">Choose one</option><option>Complete beginner</option><option>Some exposure</option><option>Intermediate</option><option>Advanced</option><option>Experienced professional</option></select></label>
                  <label className="text-xs font-bold text-zinc-400">Core focus areas<input value={qFocus} onChange={e => setQFocus(e.target.value)} placeholder="e.g. React, APIs, system design" className="mt-2 w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none" /></label>
                  <label className="text-xs font-bold text-zinc-400">Preferred learning style<select value={qLearnStyle} onChange={e => setQLearnStyle(e.target.value)} className="mt-2 w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white"><option value="">Choose one</option><option>Hands-on projects</option><option>Video + practice</option><option>Documentation + practice</option><option>Theory first</option><option>Interview/problem driven</option></select></label>
                </motion.div>}

                {step === 3 && <motion.div key="three" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-6">
                  <div><h2 className="text-3xl font-black text-white flex items-center gap-2"><Target className={theme.text} /> What outcome are we chasing?</h2><p className="text-sm text-zinc-500 mt-2">Your roadmap should optimize for an outcome, not just a list of technologies.</p></div>
                  <div className="grid md:grid-cols-2 gap-3">{targetOptions.map(([name, desc]) => <button key={name} onClick={() => setTarget(name)} className={`p-4 rounded-2xl border-2 text-left ${target === name ? `${theme.bg} ${theme.border}` : 'bg-zinc-950/50 border-black'}`}><div className="font-bold text-sm text-white">{name}</div><div className="text-xs text-zinc-500 mt-1">{desc}</div></button>)}</div>
                  {target === 'Other' && <input value={customTarget} onChange={e => setCustomTarget(e.target.value)} placeholder="e.g. Pass AWS Solutions Architect exam" className="w-full bg-zinc-950 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none" />}
                  <div className="grid md:grid-cols-2 gap-4"><label className="text-xs font-bold text-zinc-400">Daily commitment: <span className={theme.text}>{dailyHours}h</span><input type="range" min="1" max="10" step="0.5" value={dailyHours} onChange={e => setDailyHours(Number(e.target.value))} className="w-full mt-3" /></label><label className="text-xs font-bold text-zinc-400">Timeline: <span className={theme.text}>{timelineDays} days</span><input type="range" min="7" max="180" step="1" value={timelineDays} onChange={e => setTimelineDays(Number(e.target.value))} className="w-full mt-3" /></label></div>
                  <div className="flex gap-2">{['Learning','Interview','Build'].map(mode => <button key={mode} onClick={() => setActiveMode(mode)} className={`px-4 py-2 rounded-xl text-xs font-bold border ${activeMode === mode ? `${theme.bg} ${theme.text} ${theme.border}` : 'border-white/5 text-zinc-500'}`}>{mode}</button>)}</div>
                </motion.div>}

                {step === 4 && <motion.div key="four" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="flex flex-col gap-5 max-w-2xl mx-auto w-full">
                  <div><h2 className="text-3xl font-black text-white">Ready to build it?</h2><p className="text-sm text-zinc-500 mt-2">Sensei will create the curriculum and attach usable resources where available.</p></div>
                  <div className="grid gap-3"><div className="p-5 rounded-2xl bg-zinc-950/60 border border-white/5"><div className="text-[10px] uppercase tracking-widest text-zinc-600">Goal</div><div className="font-bold text-white mt-1">{finalGoal}</div></div><div className="grid md:grid-cols-3 gap-3"><div className="p-4 rounded-2xl bg-zinc-950/60 border border-white/5"><Clock className="w-4 h-4 text-zinc-500" /><div className="text-xs text-zinc-500 mt-2">Daily</div><div className="font-bold text-white">{dailyHours}h</div></div><div className="p-4 rounded-2xl bg-zinc-950/60 border border-white/5"><Calendar className="w-4 h-4 text-zinc-500" /><div className="text-xs text-zinc-500 mt-2">Timeline</div><div className="font-bold text-white">{timelineDays}d</div></div><div className="p-4 rounded-2xl bg-zinc-950/60 border border-white/5"><Zap className="w-4 h-4 text-zinc-500" /><div className="text-xs text-zinc-500 mt-2">Mode</div><div className="font-bold text-white">{activeMode}</div></div></div><div className="p-4 rounded-2xl bg-zinc-950/60 border border-white/5 text-sm text-zinc-300">{finalTarget} · {qExperience} · {qLearnStyle}</div></div>
                  {generationError && <div className="p-4 rounded-2xl bg-red-500/5 border border-red-500/20 text-sm text-red-300">{generationError}</div>}
                </motion.div>}
              </AnimatePresence>
            </div>

            <div className="flex items-center justify-between border-t border-white/5 pt-5">
              <button onClick={back} disabled={step === 1} className="px-4 py-2.5 rounded-xl text-sm font-bold text-zinc-500 disabled:opacity-30"><ArrowLeft className="w-4 h-4 inline mr-2" />Back</button>
              {step < 4 ? <button onClick={next} disabled={!validStep()} className={`px-5 py-3 rounded-xl text-sm font-bold disabled:opacity-30 ${theme.btn}`}>Continue <ArrowRight className="w-4 h-4 inline ml-2" /></button> : <button onClick={finish} disabled={isGenerating} className={`px-6 py-3 rounded-xl text-sm font-black ${theme.btn} disabled:opacity-60`}>{createGoalMutation.isPending ? 'Building roadmap…' : <><CheckCircle2 className="w-4 h-4 inline mr-2" />Build my roadmap</>}</button>}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
