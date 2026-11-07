import { useEffect, useRef, useState } from 'react'
import { Volume2 } from 'lucide-react'

export function SpeakButton({ text, label = 'Read aloud' }: { text: string; label?: string }) {
  const [speaking, setSpeaking] = useState(false)
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
      if (supported) window.speechSynthesis.cancel()
    }
  }, [supported])

  if (!supported) return null

  function speak() {
    if (!text.trim()) return
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'en-US'
    utterance.rate = 0.92
    utterance.onend = () => {
      if (mounted.current) setSpeaking(false)
    }
    utterance.onerror = () => {
      if (mounted.current) setSpeaking(false)
    }
    setSpeaking(true)
    window.speechSynthesis.speak(utterance)
  }

  return (
    <button
      type="button"
      className={`icon-button text-button ${speaking ? 'is-active' : ''}`}
      onClick={speak}
      aria-label={label}
      title={label}
    >
      <Volume2 size={18} />
      <span className="text-button__label">{speaking ? 'Speaking' : 'Listen'}</span>
    </button>
  )
}
