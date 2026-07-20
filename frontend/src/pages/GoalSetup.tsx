import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Zap, 
  Target, 
  Clock, 
  Calendar, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles,
  CheckCircle2,
  Code,
  Layers,
  Terminal,
  Cpu,
  TrendingUp,
  BrainCircuit,
  Loader2
} from 'lucide-react'
import { useCreateGoal, useGoalLibrary } from '../hooks/useApi'
import { useUIStore } from '../store/uiStore'

export const GoalSetup: React.FC = () => {
  const navigate = useNavigate()
  const { accentColor } = useUIStore()
  const createGoalMutation = useCreateGoal()
  
  const [step, setStep] = useState(1)
  
  // Setup Wizard States
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null)
  const [goal, setGoal] = useState('')
  const [customGoal, setCustomGoal] = useState('')
  const [target, setTarget] = useState('')
  const [customTarget, setCustomTarget] = useState('')
  const [activeMode, setActiveMode] = useState('Learning')
  const [dailyHours, setDailyHours] = useState(3)
  const [timelineDays, setTimelineDays] = useState(45)
  const [isGenerating, setIsGenerating] = useState(false)
  
  const { data: categorizedGoals, isLoading: isLibraryLoading } = useGoalLibrary()

  const targetsList = [
    { name: 'Career Transition / New Job', val: 'New Job' },
    { name: 'Interview Preparation', val: 'Interviews' },
    { name: 'Core Skill Mastery', val: 'Mastery' },
    { name: 'Side Project Build', val: 'Product Launch' },
    { name: 'No Specific Target', val: 'None' }
  ]

  const getColorClass = (type: 'text' | 'bg' | 'border' | 'btn' | 'glow') => {
    switch (accentColor) {
      case 'cyan':
        if (type === 'text') return 'text-cyan-400'
        if (type === 'bg') return 'bg-cyan-500/10'
        if (type === 'border') return 'border-cyan-500/20'
        if (type === 'btn') return 'bg-cyan-500 hover:bg-cyan-400 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]'
        return 'rgba(6, 182, 212, 0.4)'
      case 'emerald':
        if (type === 'text') return 'text-emerald-400'
        if (type === 'bg') return 'bg-emerald-500/10'
        if (type === 'border') return 'border-emerald-500/20'
        if (type === 'btn') return 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]'
        return 'rgba(16, 185, 129, 0.4)'
      case 'purple':
      default:
        if (type === 'text') return 'text-purple-400'
        if (type === 'bg') return 'bg-purple-500/10'
        if (type === 'border') return 'border-purple-500/20'
        if (type === 'btn') return 'bg-purple-500 hover:bg-purple-400 text-zinc-950 shadow-[0_0_15px_rgba(168,85,247,0.4)]'
        return 'rgba(168, 85, 247, 0.4)'
    }
  }

  const handleNext = () => {
    if (step < 3) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleFinish = async () => {
    setIsGenerating(true)
    const finalGoal = goal === 'Custom Goal' ? customGoal : goal
    const finalTarget = target === 'Other' ? customTarget : target
    
    try {
      await createGoalMutation.mutateAsync({
        title: finalGoal || 'Become Backend Developer',
        target: finalTarget || 'None',
        active_mode: activeMode,
        daily_hours: dailyHours,
        timeline_days: timelineDays
      })
      
      // Satisfying artificial delay to show generation progress
      setTimeout(() => {
        setIsGenerating(false)
        navigate('/app')
      }, 2500)
    } catch (e) {
      setIsGenerating(false)
      alert('Error creating your goal. Please verify backend service connection.')
    }
  }

  // Animation variants
  const slideVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: -50, transition: { duration: 0.3 } }
  }

  return (
    <div className="min-h-screen bg-[#09090b] flex flex-col justify-center items-center px-4 relative overflow-hidden">
      {/* Background radial glow */}
      <div 
        className="absolute w-[500px] h-[500px] rounded-full blur-[120px] -z-10 pointer-events-none opacity-25"
        style={{
          background: `radial-gradient(circle, ${getColorClass('glow')} 0%, transparent 70%)`,
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)'
        }}
      />
      
      {/* App brand header */}
      <div className="absolute top-8 flex items-center gap-3">
        <div className={`p-2 rounded-xl ${getColorClass('bg')} border ${getColorClass('border')}`}>
          <Zap className={`w-5 h-5 ${getColorClass('text')}`} />
        </div>
        <h1 className="text-xl font-bold tracking-wider">myMentor</h1>
      </div>

      <AnimatePresence mode="wait">
        {isGenerating ? (
          <motion.div 
            key="generating"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-lg glass-panel p-8 rounded-3xl border border-white/10 flex flex-col items-center justify-center text-center gap-6"
          >
            <div className="relative flex items-center justify-center">
              {/* Outer spinning ring */}
              <div 
                className="w-20 h-20 rounded-full border-4 border-dashed animate-spin"
                style={{ borderColor: getColorClass('text'), animationDuration: '3s' }}
              />
              {/* Inner glow pulse logo */}
              <div className={`absolute p-4 rounded-full ${getColorClass('bg')} animate-pulse`}>
                <Sparkles className={`w-8 h-8 ${getColorClass('text')}`} />
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-300">
                Generating Personalized Roadmap
              </h2>
              <p className="text-sm text-zinc-400 px-4 leading-relaxed">
                Structuring milestones, daily checklists, XP configurations, and analytics mapping. Setting up databases...
              </p>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="wizard"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl glass-panel p-8 rounded-3xl border border-white/10 flex flex-col gap-8"
          >
            {/* Step Indicators */}
            <div className="flex items-center justify-between w-full border-b border-white/5 pb-4">
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold uppercase tracking-widest ${getColorClass('text')}`}>
                  Step {step} of 3
                </span>
                <span className="text-zinc-500">•</span>
                <span className="text-xs text-zinc-400 font-semibold">
                  {step === 1 && 'Choose Your Goal'}
                  {step === 2 && 'Set Target Performance'}
                  {step === 3 && 'Configure Timeline & Commitment'}
                </span>
              </div>
              <div className="flex gap-1.5">
                {[1, 2, 3].map((s) => (
                  <div 
                    key={s}
                    className={`w-8 h-1.5 rounded-full transition-all duration-300 ${
                      s <= step 
                        ? (accentColor === 'purple' ? 'bg-purple-500' : accentColor === 'cyan' ? 'bg-cyan-500' : 'bg-emerald-500') 
                        : 'bg-zinc-800'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Wizard Body content */}
            <div className="min-h-[300px] flex flex-col justify-center">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step1"
                    variants={slideVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="flex flex-col gap-5"
                  >
                    <div className="flex flex-col gap-1">
                      <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
                        What is your learning goal? <Sparkles className={`w-5 h-5 ${getColorClass('text')}`} />
                      </h2>
                      <p className="text-sm text-zinc-400">Select a career pathway or choose custom goal to write your own.</p>
                    </div>

                    <div className="flex flex-col gap-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                      {isLibraryLoading ? (
                        <div className="flex justify-center p-8">
                          <Loader2 className={`w-8 h-8 animate-spin ${getColorClass('text')}`} />
                        </div>
                      ) : (
                        categorizedGoals && Object.entries(categorizedGoals).map(([category, goals]: [string, any]) => (
                          <div key={category} className="flex flex-col gap-3">
                            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">{category}</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              {goals.map((g: any) => {
                                const isSelected = selectedGoalId === g.id
                                return (
                                  <button
                                    key={g.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedGoalId(g.id)
                                      setGoal(g.title)
                                      if (g.id !== 'custom-01') setCustomGoal('')
                                    }}
                                    className={`flex items-start gap-4 p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                                      isSelected 
                                        ? `${getColorClass('bg')} ${getColorClass('border')} border-white/20` 
                                        : 'bg-zinc-950/40 border-white/5 hover:bg-zinc-900/60 hover:border-white/10'
                                    }`}
                                  >
                                    <div className="flex flex-col">
                                      <span className={`font-semibold text-sm ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                                        {g.title}
                                      </span>
                                      <span className="text-xs text-zinc-500 mt-1 leading-relaxed">{g.description}</span>
                                    </div>
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {goal === 'Custom Goal' && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }} 
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col gap-2 mt-1"
                      >
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Custom Goal Title</label>
                        <input
                          type="text"
                          value={customGoal}
                          onChange={(e) => setCustomGoal(e.target.value)}
                          placeholder="e.g. Master iOS App Architecture"
                          className="glass-input text-sm"
                        />
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step2"
                    variants={slideVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="flex flex-col gap-6"
                  >
                    <div className="flex flex-col gap-1">
                      <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
                        What is your target? <Target className={`w-5 h-5 ${getColorClass('text')}`} />
                      </h2>
                      <p className="text-sm text-zinc-400">Define the career milestone or income packet you are targeting.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-3">
                      {targetsList.map((t) => {
                        const isSelected = target === t.val
                        return (
                          <button
                            key={t.val}
                            type="button"
                            onClick={() => {
                              setTarget(t.val)
                              if (t.val !== 'Other') setCustomTarget('')
                            }}
                            className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all cursor-pointer ${
                              isSelected 
                                ? `${getColorClass('bg')} ${getColorClass('border')} border-white/20` 
                                : 'bg-zinc-950/40 border-white/5 hover:bg-zinc-900/60 hover:border-white/10'
                            }`}
                          >
                            <span className={`font-semibold text-sm ${isSelected ? 'text-white' : 'text-zinc-300'}`}>
                              {t.name}
                            </span>
                            {isSelected && <CheckCircle2 className={`w-5 h-5 ${getColorClass('text')}`} />}
                          </button>
                        )
                      })}
                      
                      <button
                        type="button"
                        onClick={() => setTarget('Other')}
                        className={`flex items-center justify-between p-4 rounded-xl border text-left transition-all cursor-pointer ${
                          target === 'Other' 
                            ? `${getColorClass('bg')} ${getColorClass('border')} border-white/20` 
                            : 'bg-zinc-950/40 border-white/5 hover:bg-zinc-900/60'
                        }`}
                      >
                        <span className={`font-semibold text-sm ${target === 'Other' ? 'text-white' : 'text-zinc-300'}`}>
                          Custom Target
                        </span>
                        {target === 'Other' && <CheckCircle2 className={`w-5 h-5 ${getColorClass('text')}`} />}
                      </button>
                    </div>

                    {target === 'Other' && (
                      <motion.div 
                        initial={{ opacity: 0, y: -10 }} 
                        animate={{ opacity: 1, y: 0 }}
                        className="flex flex-col gap-2"
                      >
                        <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Custom Target Detail</label>
                        <input
                          type="text"
                          value={customTarget}
                          onChange={(e) => setCustomTarget(e.target.value)}
                          placeholder="e.g. Crack Google L4 / Build SaaS MVP"
                          className="glass-input text-sm"
                        />
                      </motion.div>
                    )}
                  </motion.div>
                )}

                {step === 3 && (
                  <motion.div
                    key="step3"
                    variants={slideVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    className="flex flex-col gap-8"
                  >
                    <div className="flex flex-col gap-1">
                      <h2 className="text-2xl font-bold text-zinc-100 flex items-center gap-2">
                        Configure commitment & timeline <Clock className={`w-5 h-5 ${getColorClass('text')}`} />
                      </h2>
                      <p className="text-sm text-zinc-400">Scale the study pressure and timeline to construct your roadmap.</p>
                    </div>

                    <div className="flex flex-col gap-6">
                      {/* Daily hours slider */}
                      <div className="flex flex-col gap-3 p-5 rounded-2xl bg-zinc-900/60 border border-white/5">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Clock className="w-5 h-5 text-zinc-400" />
                            <span className="font-semibold text-sm text-zinc-300">Daily Study Time</span>
                          </div>
                          <span className={`font-bold text-lg ${getColorClass('text')}`}>{dailyHours} Hours</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="12"
                          step="0.5"
                          value={dailyHours}
                          onChange={(e) => setDailyHours(parseFloat(e.target.value))}
                          className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                          style={{
                            accentColor: accentColor === 'purple' ? '#a855f7' : accentColor === 'cyan' ? '#06b6d4' : '#10b981'
                          }}
                        />
                        <div className="flex justify-between text-[10px] font-bold text-zinc-600">
                          <span>1 HR (Casual)</span>
                          <span>4 HRS (Balanced)</span>
                          <span>8 HRS (Intense)</span>
                          <span>12 HRS (Extreme)</span>
                        </div>
                      </div>

                      {/* Timeline selection */}
                      <div className="flex flex-col gap-3 p-5 rounded-2xl bg-zinc-900/60 border border-white/5">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-zinc-400" />
                            <span className="font-semibold text-sm text-zinc-300">Total Roadmap Duration</span>
                          </div>
                          <span className={`font-bold text-lg ${getColorClass('text')}`}>{timelineDays} Days</span>
                        </div>
                        <input
                          type="range"
                          min="7"
                          max="180"
                          step="1"
                          value={timelineDays}
                          onChange={(e) => setTimelineDays(parseInt(e.target.value))}
                          className="w-full h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                          style={{
                            accentColor: accentColor === 'purple' ? '#a855f7' : accentColor === 'cyan' ? '#06b6d4' : '#10b981'
                          }}
                        />
                        <div className="flex justify-between text-[10px] font-bold text-zinc-600">
                          <span>7 DAYS (Crash Course)</span>
                          <span>45 DAYS (Standard Bootcamp)</span>
                          <span>90 DAYS (Comprehensive Mastery)</span>
                          <span>180 DAYS (Deep Immersion)</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Navigation buttons */}
            <div className="flex justify-between items-center border-t border-white/5 pt-4">
              <button
                type="button"
                onClick={handleBack}
                disabled={step === 1}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold glass-btn disabled:opacity-20 disabled:pointer-events-none"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>

              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  disabled={!goal || (goal === 'Custom Goal' && !customGoal)}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all ${getColorClass('btn')} disabled:opacity-40 disabled:pointer-events-none`}
                >
                  Next <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleFinish}
                  disabled={createGoalMutation.isPending}
                  className={`flex items-center gap-2 px-7 py-3 rounded-xl text-sm font-bold cursor-pointer transition-all ${getColorClass('btn')}`}
                >
                  Generate Roadmap <Sparkles className="w-4 h-4" />
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
