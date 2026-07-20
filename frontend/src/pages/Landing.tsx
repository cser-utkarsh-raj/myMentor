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

export const Landing: React.FC = () => {
  const navigate = useNavigate()
  const { session, isDemoMode } = useAuthStore()
  
  // Standard SaaS behavior: redirect logged-in users to the app
  React.useEffect(() => {
    if (session || isDemoMode) {
      navigate('/app')
    }
  }, [session, isDemoMode, navigate])

  const fadeIn: any = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
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
    <div className="min-h-screen bg-[#000000] text-zinc-300 selection:bg-purple-500/30 selection:text-white font-sans overflow-x-hidden">
      
      {/* Dynamic Background Glow */}
      <div 
        className="fixed w-[800px] h-[800px] rounded-full blur-[150px] -z-10 pointer-events-none opacity-20"
        style={{
          background: `radial-gradient(circle, #a855f7 0%, transparent 70%)`,
          top: '-10%',
          left: '50%',
          transform: 'translateX(-50%)'
        }}
      />

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-black/50 backdrop-blur-md border-b border-white/5">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
            <Zap className="w-5 h-5 text-white" />
            <span className="text-lg font-bold text-white tracking-tight">myMentor</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-medium">
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
              className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
            >
              Log in
            </button>
            <button 
              onClick={() => navigate('/setup')}
              className="text-sm font-semibold bg-white text-black px-4 py-2 rounded-full hover:bg-zinc-200 transition-colors flex items-center gap-1.5"
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
          <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-semibold text-zinc-400 uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-purple-500 animate-pulse" />
            v3.0 Execution Engine
          </motion.div>
          
          <motion.h1 variants={fadeIn} className="text-5xl md:text-7xl font-extrabold text-white tracking-tight leading-[1.1]">
            Don't track your goals.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">
              Execute them.
            </span>
          </motion.h1>
          
          <motion.p variants={fadeIn} className="text-lg md:text-xl text-zinc-400 max-w-2xl leading-relaxed">
            myMentor is a Goal Execution Platform. Tell us where you are, where you want to go, and how much time you have. We build the exact roadmap to get you there.
          </motion.p>
          
          <motion.div variants={fadeIn} className="flex items-center gap-4 mt-4">
            <button 
              onClick={() => navigate('/setup')}
              className="text-base font-semibold bg-white text-black px-8 py-4 rounded-full hover:scale-105 hover:bg-zinc-200 transition-all flex items-center gap-2"
            >
              Start Your Journey <ArrowRight className="w-5 h-5" />
            </button>
            <button 
              onClick={() => navigate('/login?demo=true')}
              className="text-base font-semibold bg-zinc-900 text-white px-8 py-4 rounded-full border border-white/10 hover:bg-zinc-800 transition-all flex items-center gap-2"
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
          className="w-full max-w-6xl mt-20 relative"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10 pointer-events-none" />
          <div className="rounded-2xl border border-white/10 overflow-hidden shadow-2xl shadow-purple-900/20 bg-zinc-950/50 backdrop-blur-sm">
            <img 
              src="https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?q=80&w=2088&auto=format&fit=crop" 
              alt="Dashboard Preview" 
              className="w-full h-auto opacity-70 filter saturate-50 contrast-125"
            />
          </div>
        </motion.div>
      </main>

      {/* Problem / Solution */}
      <section id="features" className="py-24 px-6 bg-zinc-950 border-t border-b border-white/5">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12">
          <div className="flex flex-col gap-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center">
              <Target className="w-6 h-6 text-purple-400" />
            </div>
            <h3 className="text-xl font-bold text-white">Dynamic Roadmaps</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Stop guessing what to study next. myMentor generates a structured module-by-module curriculum tailored exactly to your outcome and timeline.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center">
              <Clock className="w-6 h-6 text-cyan-400" />
            </div>
            <h3 className="text-xl font-bold text-white">Focus Sessions</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Don't just check boxes. Engage in deep-work Focus Sessions with built-in timers that log your exact effort against specific resources.
            </p>
          </div>
          <div className="flex flex-col gap-4">
            <div className="w-12 h-12 rounded-2xl bg-zinc-900 border border-white/5 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-xl font-bold text-white">Recovery Mode</h3>
            <p className="text-sm text-zinc-400 leading-relaxed">
              Life happens. If you miss days, myMentor never punishes you. It triggers Recovery Mode to adapt your timeline and reduce your daily load instantly.
            </p>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-24 px-6 bg-zinc-950 border-b border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center gap-16">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold text-white mb-4">How it works</h2>
            <p className="text-zinc-400">Three simple steps to transition from planning to execution.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full relative">
            {/* Connection Line */}
            <div className="hidden md:block absolute top-6 left-1/6 right-1/6 h-0.5 bg-gradient-to-r from-purple-500/0 via-purple-500/20 to-purple-500/0" />
            
            <div className="flex flex-col items-center gap-4 relative">
              <div className="w-12 h-12 rounded-full bg-zinc-900 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold z-10">1</div>
              <h3 className="text-xl font-bold text-white">Define Target</h3>
              <p className="text-sm text-zinc-400">Select your career goal, skill level, and available time.</p>
            </div>
            <div className="flex flex-col items-center gap-4 relative">
              <div className="w-12 h-12 rounded-full bg-zinc-900 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold z-10">2</div>
              <h3 className="text-xl font-bold text-white">Get Roadmap</h3>
              <p className="text-sm text-zinc-400">We generate a custom, module-by-module execution plan.</p>
            </div>
            <div className="flex flex-col items-center gap-4 relative">
              <div className="w-12 h-12 rounded-full bg-zinc-900 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold z-10">3</div>
              <h3 className="text-xl font-bold text-white">Execute Daily</h3>
              <p className="text-sm text-zinc-400">Log in every day to complete your focused mission.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Supported Goals */}
      <section id="goals" className="py-24 px-6 bg-[#000000] border-b border-white/5">
        <div className="max-w-7xl mx-auto flex flex-col items-center text-center gap-12">
          <div className="max-w-2xl">
            <h2 className="text-3xl font-bold text-white mb-4">Supported Goals</h2>
            <p className="text-zinc-400">We support learning paths across all major disciplines, or you can write your own.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full">
            {['Technology', 'Business', 'Creative', 'Academics', 'Health', 'Languages', 'AI & Data', 'Custom'].map(cat => (
              <div key={cat} className="p-4 rounded-xl bg-zinc-900/50 border border-white/5 font-semibold text-zinc-300 hover:border-white/20 transition-colors">
                {cat}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ & Footer */}
      <footer className="py-12 px-6 max-w-7xl mx-auto flex flex-col items-center border-t border-white/5 mt-20">
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-zinc-500" />
          <span className="text-lg font-bold text-zinc-500 tracking-tight">myMentor</span>
        </div>
        <p className="text-sm text-zinc-600 mb-8">
          The Learning Operating System. Built for daily execution.
        </p>
        <div className="flex items-center gap-6 text-sm font-medium text-zinc-500">
          <a href="#" className="hover:text-white transition-colors">Privacy</a>
          <a href="#" className="hover:text-white transition-colors">Terms</a>
          <a href="#" className="hover:text-white transition-colors">Twitter</a>
          <a href="#" className="hover:text-white transition-colors">GitHub</a>
        </div>
      </footer>
    </div>
  )
}
