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
  const { accentColor } = useUIStore()
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

  const handleSend = async () => {
    const trimmed = input.trim()
    if (!trimmed || chatMutation.isPending) return

    const userMessage: Message = { role: 'user', text: trimmed, timestamp: new Date() }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput('')

    try {
      const chatHistory = newMessages.map(m => ({ role: m.role, text: m.text }))
      const result = await chatMutation.mutateAsync({
        messages: chatHistory,
        goal_context: activeGoal?.title || undefined
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
    { icon: Lightbulb, text: 'Explain my current topic', prompt: `Explain the key concepts I should focus on for ${activeGoal?.title || 'my learning goal'}` },
    { icon: BookOpen, text: 'Study strategy tips', prompt: 'What are the most effective study strategies for deep learning and retention?' },
    { icon: Zap, text: 'Motivation boost', prompt: 'I\'m feeling unmotivated today. Give me a quick pep talk and help me get started.' },
    { icon: RefreshCw, text: 'Review techniques', prompt: 'What are the best spaced repetition and active recall techniques I should use?' },
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
      {/* Header */}
      <div className="flex items-center justify-between pb-6 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-2xl ${getColorClass('bg')} border ${getColorClass('border')}`}>
            <Sparkles className={`w-6 h-6 ${getColorClass('text')}`} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Sensei</h1>
            <p className="text-sm text-zinc-500">
              {aiStatus?.ai_available
                ? 'AI-powered learning mentor • Gemini 3.5 Flash'
                : 'AI not configured — add GEMINI_API_KEY to backend .env'}
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
              <h2 className="text-xl font-bold text-white mb-2">Hey there! I'm Sensei 👋</h2>
              <p className="text-sm text-zinc-400 max-w-md">
                Your AI learning companion. Ask me anything about your studies,
                get explanations, study tips, or just chat about your progress.
              </p>
            </div>

            {/* Quick prompts */}
            <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
              {quickPrompts.map((qp, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setInput(qp.prompt)
                    inputRef.current?.focus()
                  }}
                  className="flex items-center gap-3 p-4 rounded-xl bg-zinc-900/60 border border-white/5 hover:bg-zinc-800/60 hover:border-white/10 transition-all text-left group"
                >
                  <qp.icon className={`w-5 h-5 ${getColorClass('text')} group-hover:scale-110 transition-transform`} />
                  <span className="text-sm text-zinc-300 font-medium">{qp.text}</span>
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
                  <div className={`w-8 h-8 rounded-xl ${getColorClass('bg')} border ${getColorClass('border')} flex items-center justify-center flex-shrink-0 mt-1`}>
                    <Bot className={`w-4 h-4 ${getColorClass('text')}`} />
                  </div>
                )}
                <div className={`max-w-[70%] ${msg.role === 'user'
                  ? 'bg-zinc-800 border border-white/10 rounded-2xl rounded-br-md'
                  : `bg-gradient-to-br ${getColorClass('gradient')} border ${getColorClass('border')} rounded-2xl rounded-bl-md`
                } p-4`}>
                  {msg.role === 'model' ? (
                    <div
                      className="text-sm text-zinc-200 leading-relaxed prose-invert"
                      dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }}
                    />
                  ) : (
                    <p className="text-sm text-zinc-200 leading-relaxed">{msg.text}</p>
                  )}
                  {msg.role === 'model' && (
                    <div className="flex justify-end mt-2">
                      <button
                        onClick={() => handleCopy(msg.text, idx)}
                        className="text-zinc-500 hover:text-zinc-300 transition-colors p-1"
                      >
                        {copiedIdx === idx ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  )}
                </div>
                {msg.role === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-zinc-800 border border-white/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <User className="w-4 h-4 text-zinc-400" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        )}

        {chatMutation.isPending && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex gap-3 items-start"
          >
            <div className={`w-8 h-8 rounded-xl ${getColorClass('bg')} border ${getColorClass('border')} flex items-center justify-center`}>
              <Bot className={`w-4 h-4 ${getColorClass('text')}`} />
            </div>
            <div className={`p-4 rounded-2xl rounded-bl-md bg-gradient-to-br ${getColorClass('gradient')} border ${getColorClass('border')}`}>
              <div className="flex items-center gap-2">
                <Loader2 className={`w-4 h-4 animate-spin ${getColorClass('text')}`} />
                <span className="text-sm text-zinc-400">Sensei is thinking...</span>
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-white/5 pt-4">
        <div className="flex gap-3 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask Sensei anything about your learning journey..."
              rows={1}
              className="w-full bg-zinc-900/80 border border-white/10 rounded-xl px-4 py-3 pr-12 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-white/20 resize-none"
              style={{ minHeight: '48px', maxHeight: '120px' }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement
                target.style.height = 'auto'
                target.style.height = Math.min(target.scrollHeight, 120) + 'px'
              }}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={!input.trim() || chatMutation.isPending}
            className={`p-3 rounded-xl ${getColorClass('btn')} transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <p className="text-[10px] text-zinc-600 mt-2 text-center">
          Sensei is powered by Gemini AI. Responses may not always be accurate.
        </p>
      </div>
    </div>
  )
}
