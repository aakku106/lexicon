import { useEffect, useMemo, useRef, useState, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { createPortal } from 'react-dom'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Search } from 'lucide-react'
import { TERMS_ALPHABETICAL } from '../../data/catalog'
import { CATEGORY_BY_ID } from '../../data/categories'
import { searchTerms } from '../../lib/search'
import type { Term } from '../../types'
import { CategoryIcon } from '../ui/CategoryIcon'
import { Highlight } from '../ui/Highlight'
import { NAV_ITEMS } from './nav'

type PaletteItem =
  | { kind: 'nav'; id: string; label: string; to: string; icon: (typeof NAV_ITEMS)[number]['icon'] }
  | { kind: 'term'; id: string; term: Term }

function isTypingTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false
  const tag = target.tagName.toLowerCase()
  return tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable
}

export function CommandPalette() {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const navigate = useNavigate()

  useEffect(() => {
    function handleOpen() {
      setOpen(true)
    }
    function handleKeyDown(event: KeyboardEvent) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setOpen(true)
        return
      }
      if (event.key === '/' && !isTypingTarget(event.target) && !event.metaKey && !event.ctrlKey && !event.altKey) {
        event.preventDefault()
        setOpen(true)
      }
    }
    window.addEventListener('lexicon:search', handleOpen)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('lexicon:search', handleOpen)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    const originalOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    setQuery('')
    setActiveIndex(0)
    const timer = window.setTimeout(() => inputRef.current?.focus(), 20)
    return () => {
      window.clearTimeout(timer)
      document.body.style.overflow = originalOverflow
    }
  }, [open])

  const navMatches = useMemo(() => {
    if (!query.trim()) return NAV_ITEMS
    const normalized = query.toLowerCase()
    return NAV_ITEMS.filter((item) => item.label.toLowerCase().includes(normalized))
  }, [query])

  const termMatches = useMemo(() => {
    if (!query.trim()) return []
    return searchTerms(TERMS_ALPHABETICAL, query, 8).map((entry) => entry.term)
  }, [query])

  const items = useMemo<PaletteItem[]>(
    () => [
      ...navMatches.map((item) => ({
        kind: 'nav' as const,
        id: `nav-${item.to}`,
        label: item.label,
        to: item.to,
        icon: item.icon,
      })),
      ...termMatches.map((term) => ({
        kind: 'term' as const,
        id: `term-${term.id}`,
        term,
      })),
    ],
    [navMatches, termMatches],
  )

  useEffect(() => {
    setActiveIndex((current) => Math.min(current, Math.max(0, items.length - 1)))
  }, [items.length])

  function close() {
    setOpen(false)
  }

  function select(item: PaletteItem | undefined) {
    if (!item) return
    if (item.kind === 'nav') navigate(item.to)
    else navigate(`/terms/${item.term.id}`)
    close()
  }

  function handleInputKeyDown(event: ReactKeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setActiveIndex((current) => (items.length ? (current + 1) % items.length : 0))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setActiveIndex((current) => (items.length ? (current - 1 + items.length) % items.length : 0))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      select(items[activeIndex])
    } else if (event.key === 'Escape') {
      event.preventDefault()
      close()
    }
  }

  const navCount = navMatches.length

  if (!open) return null

  return createPortal(
    <div className="command-backdrop" role="presentation" onMouseDown={close}>
      <div
        className="command"
        role="dialog"
        aria-modal="true"
        aria-label="Search vocabulary and navigate"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="command__search">
          <Search size={21} aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value)
              setActiveIndex(0)
            }}
            onKeyDown={handleInputKeyDown}
            placeholder="Search a term, definition, or page…"
            aria-label="Search a term, definition, or page"
            autoComplete="off"
            spellCheck={false}
          />
          <kbd>esc</kbd>
        </div>

        <div className="command__results" role="listbox" aria-label="Search results">
          {query.trim() && navMatches.length > 0 ? (
            <p className="command__label">Jump to</p>
          ) : null}
          {navMatches.map((item, index) => {
            const Icon = item.icon
            const ordinal = index
            return (
              <button
                key={`${item.to}-${item.label}`}
                type="button"
                className={`command-item ${activeIndex === ordinal ? 'is-active' : ''}`}
                onMouseEnter={() => setActiveIndex(ordinal)}
                onClick={() => select(items[ordinal])}
                role="option"
                aria-selected={activeIndex === ordinal}
              >
                <span className="command-item__icon">
                  <Icon size={18} aria-hidden="true" />
                </span>
                <span className="command-item__body">
                  <strong>{item.label}</strong>
                  <span>{item.to === '/' ? 'Overview and daily word' : 'Open page'}</span>
                </span>
                <ArrowRight size={16} className="command-item__arrow" aria-hidden="true" />
              </button>
            )
          })}

          {termMatches.length > 0 ? <p className="command__label">Terms</p> : null}
          {termMatches.map((term, index) => {
            const ordinal = navCount + index
            const category = CATEGORY_BY_ID[term.category]
            return (
              <button
                key={term.id}
                type="button"
                className={`command-item command-item--term ${activeIndex === ordinal ? 'is-active' : ''}`}
                onMouseEnter={() => setActiveIndex(ordinal)}
                onClick={() => select(items[ordinal])}
                role="option"
                aria-selected={activeIndex === ordinal}
              >
                <span className={`command-item__icon command-item__icon--${category.accent}`}>
                  <CategoryIcon name={category.icon} size={18} />
                </span>
                <span className="command-item__body">
                  <strong>
                    <Highlight text={term.term} query={query} />
                  </strong>
                  <span>{category.shortName} · {term.definition.slice(0, 88)}{term.definition.length > 88 ? '…' : ''}</span>
                </span>
                <ArrowRight size={16} className="command-item__arrow" aria-hidden="true" />
              </button>
            )
          })}

          {items.length === 0 ? (
            <div className="command__empty">
              <p>No matches for “{query}”.</p>
              <span>Try a term like “mutex”, “idempotency”, or “consensus”.</span>
            </div>
          ) : null}
        </div>

        <div className="command__footer">
          <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span><kbd>↵</kbd> open</span>
          <span><kbd>esc</kbd> close</span>
          <span className="command__count">{TERMS_ALPHABETICAL.length} terms indexed</span>
        </div>
      </div>
    </div>,
    document.body,
  )
}
