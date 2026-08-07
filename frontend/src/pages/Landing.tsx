import React from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { 
  Zap, 
  ArrowRight, 
  Target, 
  Clock, 
  TrendingUp, 
  Code, 
  Play
} from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useUIStore } from '../store/uiStore'
import { getColorClasses } from '../lib/theme'

export const Landing: React.FC = () => {
  const navigate = useNavigate()
  const { session, isDemoMode } = useAuthStore()
  const { accentColor } = useUIStore()
  const theme = getColorClasses(accentColor)
  
  // Standard SaaS behavior: redirect logged-in users to the app
  React.useEffect(() => {
    if (session || isDemoMode) {
      navigate('/app')
    }
  }, [session, isDemoMode, navigate])

  const fadeIn: any = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
  }

  const stagger: any = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-zinc-200 selection:bg-purple-500/30 selection:text-white font-sans overflow-x-hidden">
      
      {/* Theme Reactive Background Glow */}
      <div 
        className="fixed w-[800px] h-[800px] rounded-full blur-[160px] -z-10 pointer-events-none opacity-25 transition-colors duration-500"
        style={{
          background: `radial-gradient(circle, ${theme.hex} 0%, transparent 70%)`,
          top: '-10%',
          left: '50%',
          transform: 'translateX(-50%)'
        }}
      />

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-[#09090b]/80 backdrop-blur-xl border-b-2 border-black">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => navigate('/')}>
            <div className={`p-2 rounded-lg bg-black border-2 border-black ${theme.text} shadow-[2px_2px_0px_#000]`}>
              <Zap className="w-5 h-5" />
            </div>
            <span className="text-xl font-black text-white tracking-tight">myMentor</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-bold">
            <a href="#features" className="text-zinc-400 hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="text-zinc-400 hover:text-white transition-colors">How it Works</a>
            <a href="#goals" className="text-zinc-400 hover:text-white transition-colors">Supported Goals</a>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors">
              <Code className="w-4 h-4" /> GitHub
            </a>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate('/login')}
              className="text-sm font-bold text-zinc-300 hover:text-white transition-colors"
            >
              Log in
            </button>
            <button 
              onClick={() => navigate('/setup')}
              className={`text-sm font-black px-5 py-2.5 rounded-xl border-2 border-black ${theme.btn} flex items-center gap-2 cursor-pointer transition-all`}
            >
              Get Started <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="pt-32 pb-16 px-6 max-w-7xl mx-auto flex flex-col items-center text-center">
        <motion.div 
          initial="hidden"
          animate="visible"
          variants={stagger}
          className="flex flex-col items-center gap-6 max-w-4xl"
        >
          <motion.div variants={fadeIn} className="sticker-tag sticker-purple">
            <span className={`w-2 h-2 rounded-full ${theme.bg} animate-pulse`} />
            Execution Engine Active
          </motion.div>
          
          <motion.h1 variants={fadeIn} className="text-5xl md:text-7xl font-black text-white tracking-tight leading-[1.1]">
            Don't track your goals.<br />
            <span className={`text-transparent bg-clip-text bg-gradient-to-r ${theme.gradient}`}>
              Execute them.
            </span>
          </motion.h1>
          
          <motion.p variants={fadeIn} className="text-lg md:text-xl text-zinc-400 max-w-2xl leading-relaxed font-medium">
            myMentor is an AI-powered Goal Execution Platform. Input your target, daily study hours, and timeline — we build your daily step-by-step roadmap.
          </motion.p>
          
          <motion.div variants={fadeIn} className="flex items-center gap-4 mt-4">
            <button 
              onClick={() => navigate('/setup')}
              className={`text-base font-black px-8 py-4 rounded-xl border-3 border-black ${theme.btn} flex items-center gap-2 cursor-pointer transition-all`}
            >
              Start Your Journey <ArrowRight className="w-5 h-5" />
            </button>
            <button 
              onClick={() => navigate('/login?demo=true')}
              className="text-base font-bold bg-zinc-900 text-white px-8 py-4 rounded-xl border-3 border-black box-shadow-[4px_4px_0px_#000] hover:bg-zinc-800 hover:translate-y-[-2px] transition-all flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4" /> Try Demo
            </button>
          </motion.div>
        </motion.div>

        {/* Dashboard Preview Interface */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="w-full max-w-6xl mt-16 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-transparent to-transparent z-10 pointer-events-none" />
          <div className="rounded-2xl border-3 border-black overflow-hidden shadow-[8px_8px_0px_#000] bg-zinc-950">
            <img 
              src="https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?q=80&w=2088&auto=format&fit=crop" 
              alt="Dashboard Preview" 
              className="w-full h-auto opacity-70 filter saturate-50 contrast-125"
            />
          </div>
        </motion.div>
      </main>

      {/* Problem / Solution */}
      <section id="features" className="py-24 px-6 bg-[#0c0c0e] border-t-3 border-b-3 border-black">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="glass-panel p-8 flex flex-col gap-4">
            <div className={`w-12 h-12 rounded-xl bg-black border-2 border-black flex items-center justify-center ${theme.text} shadow-[3px_3px_0px_#000]`}>
              <Target className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-white">Dynamic Roadmaps</h3>
            <p className="text-sm text-zinc-400 leading-relaxed font-medium">
              Stop guessing what to study next. myMentor generates a structured module-by-module curriculum tailored to your specific outcome and timeline.
            </p>
          </div>
          <div className="glass-panel p-8 flex flex-col gap-4">
            <div className={`w-12 h-12 rounded-xl bg-black border-2 border-black flex items-center justify-center ${theme.text} shadow-[3px_3px_0px_#000]`}>
              <Clock className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-white">Focus Sessions</h3>
            <p className="text-sm text-zinc-400 leading-relaxed font-medium">
              Engage in deep-work Focus Sessions with built-in Pomodoro timers that log your exact daily effort against your active tasks.
            </p>
          </div>
          <div className="glass-panel p-8 flex flex-col gap-4">
            <div className={`w-12 h-12 rounded-xl bg-black border-2 border-black flex items-center justify-center ${theme.text} shadow-[3px_3px_0px_#000]`}>
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-extrabold text-white">Recovery Mode</h3>
            <p className="text-sm text-zinc-400 leading-relaxed font-medium">
              If life gets busy and you miss days, Recovery Mode dynamically adapts your timeline and reduces your daily load without penalty.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6 bg-[#09090b] border-b-3 border-black">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center gap-16">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-black text-white mb-4">How It Works</h2>
            <p className="text-zinc-400 font-medium">Three simple steps to transition from planning to daily execution.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full relative">
            <div className="glass-panel p-8 flex flex-col items-center gap-4 relative">
              <div className={`w-12 h-12 rounded-xl bg-black border-2 border-black flex items-center justify-center ${theme.text} font-black text-lg shadow-[3px_3px_0px_#000]`}>1</div>
              <h3 className="text-xl font-extrabold text-white">Define Target</h3>
              <p className="text-sm text-zinc-400 font-medium">Select your career goal, skill level, and available time.</p>
            </div>
            <div className="glass-panel p-8 flex flex-col items-center gap-4 relative">
              <div className={`w-12 h-12 rounded-xl bg-black border-2 border-black flex items-center justify-center ${theme.text} font-black text-lg shadow-[3px_3px_0px_#000]`}>2</div>
              <h3 className="text-xl font-extrabold text-white">Get Roadmap</h3>
              <p className="text-sm text-zinc-400 font-medium">Gemini generates a custom, module-by-module execution plan.</p>
            </div>
            <div className="glass-panel p-8 flex flex-col items-center gap-4 relative">
              <div className={`w-12 h-12 rounded-xl bg-black border-2 border-black flex items-center justify-center ${theme.text} font-black text-lg shadow-[3px_3px_0px_#000]`}>3</div>
              <h3 className="text-xl font-extrabold text-white">Execute Daily</h3>
              <p className="text-sm text-zinc-400 font-medium">Log in every day to complete your focused study mission.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Goals */}
      <section id="goals" className="py-24 px-6 bg-[#0c0c0e] border-b-3 border-black">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center gap-12">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-black text-white mb-4">Supported Goal Profiles</h2>
            <p className="text-zinc-400 font-medium">We support learning paths across all major disciplines or custom PDFs.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
            {['Technology', 'Business', 'Creative', 'Academics', 'Health', 'Languages', 'AI & Data', 'Custom PDF'].map(cat => (
              <div key={cat} className="glass-panel p-5 text-center font-extrabold text-zinc-200 cursor-pointer">
                {cat}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 max-w-7xl mx-auto flex flex-col items-center border-t-2 border-white/10 mt-12">
        <div className="flex items-center gap-2.5 mb-3">
          <div className={`p-1.5 rounded bg-black border border-black ${theme.text}`}>
            <Zap className="w-4 h-4" />
          </div>
          <span className="text-lg font-black text-zinc-300 tracking-tight">myMentor</span>
        </div>
        <p className="text-xs text-zinc-500 font-medium mb-6">
          The Learning Operating System. Built for daily execution.
        </p>
        <div className="flex items-center gap-6 text-xs font-bold text-zinc-400">
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
          <a href="#" className="hover:text-white transition-colors">Twitter</a>
          <a href="#" className="hover:text-white transition-colors">GitHub</a>
        </div>
      </footer>
    </div>
  )
}
