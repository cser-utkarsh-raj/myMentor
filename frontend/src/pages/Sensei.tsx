import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  Sparkles,
  Bot,
  User,
  Loader2,
  Lightbulb,
  BookOpen,
  Zap,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react'
import { useSenseiChat, useAIStatus, useActiveGoal } from '../hooks/useApi'
import { useUIStore } from '../store/uiStore'

interface Message {
  role: 'user' | 'model'
  text: string
  timestamp: Date
}

export const Sensei: React.FC = () => {
  const { accentColor, senseiPersonality } = useUIStore()
  const { data: activeGoal } = useActiveGoal()
  const { data: aiStatus } = useAIStatus()
  const chatMutation = useSenseiChat()

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const getColorClass = (type: 'text' | 'bg' | 'border' | 'btn' | 'gradient') => {
    switch (accentColor) {
      case 'cyan':
        if (type === 'text') return 'text-cyan-400'
        if (type === 'bg') return 'bg-cyan-500/10'
        if (type === 'border') return 'border-cyan-500/30'
        if (type === 'btn') return 'bg-cyan-500 hover:bg-cyan-400 text-black'
        return 'from-cyan-500/20 to-blue-500/20'
      case 'emerald':
        if (type === 'text') return 'text-emerald-400'
        if (type === 'bg') return 'bg-emerald-500/10'
        if (type === 'border') return 'border-emerald-500/30'
        if (type === 'btn') return 'bg-emerald-500 hover:bg-emerald-400 text-black'
        return 'from-emerald-500/20 to-teal-500/20'
      case 'blue':
        if (type === 'text') return 'text-blue-400'
        if (type === 'bg') return 'bg-blue-500/10'
        if (type === 'border') return 'border-blue-500/30'
        if (type === 'btn') return 'bg-blue-500 hover:bg-blue-400 text-black'
        return 'from-blue-500/20 to-sky-500/20'
      default:
        if (type === 'text') return 'text-purple-400'
        if (type === 'bg') return 'bg-purple-500/10'
        if (type === 'border') return 'border-purple-500/30'
        if (type === 'btn') return 'bg-purple-500 hover:bg-purple-400 text-black'
        return 'from-purple-500/20 to-indigo-500/20'
    }
  }

  const handleSendPrompt = async (promptText: string) => {
    const trimmed = promptText.trim()
    if (!trimmed || chatMutation.isPending) return

    const userMessage: Message = { role: 'user', text: trimmed, timestamp: new Date() }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')

    try {
      const chatHistory = newMessages.map(m => ({ role: m.role, text: m.text }))
      const result = await chatMutation.mutateAsync({
        messages: chatHistory,
        goal_context: activeGoal?.title || undefined,
        personality: senseiPersonality
      })

      setMessages(prev => [
        ...prev,
        { role: 'model', text: result.response, timestamp: new Date() }
      ])
    } catch {
      setMessages(prev => [
        ...prev,
        { role: 'model', text: 'Sorry, I encountered an error. Please try again.', timestamp: new Date() }
      ])
    }
  }

  const handleSend = () => {
    handleSendPrompt(input)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleCopy = (text: string, idx: number) => {
    navigator.clipboard.writeText(text)
    setCopiedIdx(idx)
    setTimeout(() => setCopiedIdx(null), 2000)
  }

  const quickPrompts = [
    { 
      text: 'Explain Today\'s Key Concept', 
      prompt: `Explain the key concepts I should focus on for ${activeGoal?.title || 'my learning goal'}`, 
      icon: Lightbulb 
    },
    { 
      text: 'Quiz Me On My Roadmap', 
      prompt: `Give me 3 practice quiz questions based on ${activeGoal?.title || 'my active topics'} to test my knowledge`, 
      icon: BookOpen 
    },
    { 
      text: 'Study & Retention Tips', 
      prompt: 'What are the most effective study strategies for deep learning and active recall retention?', 
      icon: Zap 
    },
    { 
      text: 'Summarize My Materials', 
      prompt: 'Summarize the core takeaways and key concepts from my uploaded study documents and PDFs', 
      icon: RefreshCw 
    },
  ]

  const renderMarkdown = (text: string) => {
    let html = text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code class="px-1.5 py-0.5 rounded bg-white/10 text-sm font-mono">$1</code>')
      .replace(/^### (.+)$/gm, '<h3 class="text-base font-bold text-white mt-3 mb-1">$1</h3>')
      .replace(/^## (.+)$/gm, '<h2 class="text-lg font-bold text-white mt-3 mb-1">$1</h2>')
      .replace(/^# (.+)$/gm, '<h1 class="text-xl font-bold text-white mt-3 mb-1">$1</h1>')
      .replace(/^- (.+)$/gm, '<li class="ml-4 list-disc text-zinc-300">$1</li>')
      .replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal text-zinc-300">$1</li>')
      .replace(/\n/g, '<br/>')
    return html
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-h-[calc(100vh-4rem)]">
      {/* Header - Clean persona subtitle */}
      <div className="flex items-center justify-between pb-6 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${getColorClass('bg')} border ${getColorClass('border')}`}>
            <Sparkles className={`w-6 h-6 ${getColorClass('text')}`} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Sensei</h1>
            <p className="text-sm text-zinc-400 font-semibold mt-0.5">
              Persona: {senseiPersonality}
            </p>
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto py-6 space-y-4 custom-scrollbar">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-8">
            <div className="text-center">
              <div className={`inline-flex p-5 rounded-3xl ${getColorClass('bg')} border ${getColorClass('border')} mb-4`}>
                <Bot className={`w-10 h-10 ${getColorClass('text')}`} />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Sensei</h2>
              <p className="text-sm text-zinc-400 max-w-md">
                Your AI learning companion. Ask me anything about your studies,
                get explanations, study tips, or quiz yourself on your roadmap.
              </p>
            </div>

            {/* Quick prompts - Styled cards with text that execute on click */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-xl">
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendPrompt(qp.prompt)}
                  className="flex items-center gap-3.5 p-4 rounded-2xl bg-zinc-900/60 border border-white/5 hover:bg-zinc-800/80 hover:border-white/20 transition-all text-left group cursor-pointer"
                >
                  <div className={`p-2.5 rounded-xl ${getColorClass('bg')} border ${getColorClass('border')} group-hover:scale-105 transition-transform shrink-0`}>
                    <qp.icon className={`w-5 h-5 ${getColorClass('text')}`} />
                  </div>
                  <span className="text-xs font-bold text-zinc-200 group-hover:text-white transition-colors">{qp.text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <AnimatePresence>
            {messages.map((msg, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'model' && (
                  <div className={`w-8 h-8 rounded-xl ${getColorClass('bg')} border ${getColorClass('border')} flex items-center justify-center shrink-0 mt-1`}>
                    <Bot className={`w-4 h-4 ${getColorClass('text')}`} />
                  </div>
                )}

                <div className={`group relative max-w-[80%] rounded-2xl p-4 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? `${getColorClass('btn')} text-black font-medium rounded-br-none`
                    : 'bg-zinc-900/90 border border-white/10 text-zinc-200 rounded-bl-none'
                }`}>
                  {msg.role === 'model' ? (
                    <div 
                      className="prose prose-invert prose-sm max-w-none text-zinc-200"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }}
                    />
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                  )}

                  {msg.role === 'model' && (
                    <button
                      onClick={() => handleCopy(msg.text, idx)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg bg-zinc-800/80 border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-zinc-700 cursor-pointer"
                      title="Copy response"
                    >
                      {copiedIdx === idx ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-zinc-400" />
                      )}
                    </button>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center shrink-0 mt-1">
                    <User className="w-4 h-4 text-zinc-400" />
                  </div>
                )}
              </motion.div>
            ))}

            {chatMutation.isPending && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 justify-start"
              >
                <div className={`w-8 h-8 rounded-xl ${getColorClass('bg')} border ${getColorClass('border')} flex items-center justify-center shrink-0`}>
                  <Bot className={`w-4 h-4 ${getColorClass('text')}`} />
                </div>
                <div className="bg-zinc-900/90 border border-white/10 rounded-2xl rounded-bl-none p-4 flex items-center gap-3 text-zinc-400 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin text-zinc-400" />
                  <span>Sensei is thinking...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="pt-4 border-t border-white/5">
        <div className="relative flex items-center">
          <textarea
            ref={inputRef}
            rows={1}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask Sensei anything about your learning journey..."
            className="w-full bg-zinc-950/60 border border-white/10 rounded-2xl py-3.5 pl-4 pr-12 text-sm text-white placeholder-zinc-500 outline-none focus:border-white/20 transition-colors resize-none"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || chatMutation.isPending}
            className={`absolute right-2 p-2 rounded-xl transition-all cursor-pointer ${
              input.trim() && !chatMutation.isPending
                ? `${getColorClass('btn')}`
                : 'text-zinc-650 cursor-not-allowed'
            }`}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
        <p className="text-[10px] text-zinc-650 text-center mt-2">
          Sensei is powered by Gemini AI. Responses may not always be accurate.
        </p>
      </div>
    </div>
  )
}
