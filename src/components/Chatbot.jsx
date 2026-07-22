import { useState, useRef, useEffect } from 'react'
import { MessageCircle, Send, X } from 'lucide-react'
import { getChatbotResponse } from '../lib/ai'
import { addLog } from '../lib/db'
import { useAuth } from '../context/AuthContext'

export default function Chatbot({ onClose }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState([
    { role: 'bot', text: "Bonjour ! Je suis l'assistant GESTOCOM CI. Posez-moi vos questions sur les ventes, le stock, les clients, la sécurité..." },
  ])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = () => {
    const q = input.trim()
    if (!q) return

    setMessages(prev => [...prev, { role: 'user', text: q }])
    setInput('')
    setTyping(true)

    addLog('Assistant question', q.slice(0, 100), user?.id, user?.nom)

    setTimeout(() => {
      const response = getChatbotResponse(q)
      setMessages(prev => [...prev, { role: 'bot', text: response }])
      setTyping(false)
    }, 400 + Math.random() * 600)
  }

  const quickQuestions = [
    'Ventes aujourd\'hui',
    'Produits en rupture',
    'Score sécurité',
    'CA du mois',
    'Meilleur caissier',
    'Aide',
  ]

  return (
    <div className="fixed bottom-0 right-0 z-50 w-full sm:w-[400px] h-[550px] bg-white dark:bg-dark-800 border border-gray-200 dark:border-dark-600 rounded-t-2xl shadow-2xl flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-orange-500 to-green-600 text-white">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <MessageCircle className="w-4 h-4" />
          </div>
          <div>
            <div className="text-sm font-semibold">Assistant GESTOCOM</div>
            <div className="text-[10px] opacity-80">Guide interactif</div>
          </div>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/20 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm whitespace-pre-line break-all ${
              msg.role === 'user'
                ? 'bg-orange-500 text-white rounded-br-md'
                : 'bg-gray-100 dark:bg-dark-700 text-gray-800 dark:text-gray-200 rounded-bl-md'
            }`}>
              {msg.text}
            </div>
          </div>
        ))}
        {typing && (
          <div className="flex justify-start">
            <div className="bg-gray-100 dark:bg-dark-700 px-4 py-2 rounded-2xl rounded-bl-md">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Quick questions */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {quickQuestions.map(q => (
            <button key={q} onClick={() => { setInput(q); setTimeout(() => { setInput(''); handleSendQuick(q) }, 100) }}
              className="px-3 py-1 rounded-full text-[11px] bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 hover:bg-orange-100 dark:hover:bg-orange-900/30 font-medium transition-colors">
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-3 border-t dark:border-dark-600">
        <form onSubmit={e => { e.preventDefault(); handleSend() }} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Tapez votre question..."
            className="flex-1 px-4 py-2.5 bg-gray-100 dark:bg-dark-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            autoFocus
          />
          <button type="submit" disabled={!input.trim()}
            className="p-2.5 bg-orange-500 text-white rounded-xl hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  )

  function handleSendQuick(q) {
    setMessages(prev => [...prev, { role: 'user', text: q }])
    setTyping(true)
    addLog('Assistant question', q.slice(0, 100), user?.id, user?.nom)
    setTimeout(() => {
      const response = getChatbotResponse(q)
      setMessages(prev => [...prev, { role: 'bot', text: response }])
      setTyping(false)
    }, 400 + Math.random() * 600)
  }
}
