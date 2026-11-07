import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  Clock3,
  GalleryVerticalEnd,
  RotateCcw,
  Shuffle,
  Sparkles,
  Target,
  TriangleAlert,
  Trophy,
} from 'lucide-react'
import type { CategoryId, FlashcardSession, ReviewRating, Term } from '../types'
import { useStudy } from '../context/StudyProvider'
import { useToast } from '../context/ToastProvider'
import { CATEGORIES } from '../data/categories'
import { TERM_BY_ID, TERMS } from '../data/catalog'
import { createEmptyProgress, isDue, isTrouble, previewIntervals } from '../lib/srs'
import { formatDuration, formatRelativeDue } from '../lib/date'
import { buildReviewQueue, createSession, shuffle, type StudyMode } from '../lib/study'
import { troubleTerms, unseenTerms } from '../lib/stats'
import { CategoryIcon } from '../components/ui/CategoryIcon'
import { StatusBadge, TierBadge } from '../components/ui/Badges'
import { BookmarkButton } from '../components/ui/BookmarkButton'
import { SpeakButton } from '../components/ui/SpeakButton'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'
import { ScoreRing } from '../components/ui/ScoreRing'

const SESSION_SIZES = [10, 20, 30]

const MODE_META: Record<StudyMode, { title: string; description: string; icon: typeof Sparkles }> = {
  smart: {
    title: 'Smart review',
    description: 'Due cards first, then trouble spots, then new vocabulary.',
    icon: Sparkles,
  },
  trouble: {
    title: 'Trouble drill',
    description: 'Only the definitions you have missed repeatedly.',
    icon: Target,
  },
  practice: {
    title: 'Free practice',
    description: 'A shuffled set from anywhere in the chosen field.',
    icon: Shuffle,
  },
}

function isStudyMode(value: string | null): value is StudyMode {
  return value === 'smart' || value === 'trouble' || value === 'practice'
}

function isCategoryId(value: string | null): value is CategoryId {
  return CATEGORIES.some((category) => category.id === value)
}

export function FlashcardsPage() {
  const {
    progress,
    prefs,
    flashcardSession,
    setFlashcardSession,
    rateTerm,
    updatePrefs,
  } = useStudy()
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  const [mode, setMode] = useState<StudyMode>(() => {
    const query = searchParams.get('mode')
    return isStudyMode(query) ? query : 'smart'
  })
  const [category, setCategory] = useState<CategoryId | 'all'>(() => {
    const query = searchParams.get('category')
    return isCategoryId(query) ? query : 'all'
  })
  const [size, setSize] = useState(prefs.sessionSize)
  const [flipped, setFlipped] = useState(false)
  const [summary, setSummary] = useState<FlashcardSession | null>(null)
  const [showExit, setShowExit] = useState(false)

  useEffect(() => {
    const query = searchParams.get('mode')
    if (isStudyMode(query)) setMode(query)
    const categoryQuery = searchParams.get('category')
    if (isCategoryId(categoryQuery)) setCategory(categoryQuery)
  }, [searchParams])

  useEffect(() => {
    if (flashcardSession?.completed) setFlashcardSession(null)
    // Only clean up a persisted summary; active cards are intentionally resumable.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    setFlipped(false)
  }, [flashcardSession?.index])

  const scopedTerms = useMemo(
    () =>
      category === 'all'
        ? TERMS
        : TERMS.filter((term) => term.category === category || term.alsoIn?.includes(category)),
    [category],
  )

  const deckStats = useMemo(() => {
    const due = scopedTerms.filter((term) => isDue(progress[term.id])).length
    const trouble = troubleTerms(scopedTerms, progress).length
    const fresh = unseenTerms(scopedTerms, progress).length
    return { due, trouble, fresh, total: scopedTerms.length }
  }, [progress, scopedTerms])

  const potentialSmart = useMemo(() => {
    const ids = new Set<string>()
    for (const term of scopedTerms) {
      const entry = progress[term.id]
      if (isDue(entry) || isTrouble(entry) || !entry || (entry.seen === 0 && entry.status === 'new')) {
        ids.add(term.id)
      }
    }
    return ids.size
  }, [progress, scopedTerms])

  const activeSession =
    flashcardSession && !flashcardSession.completed ? flashcardSession : null
  const sessionTerm = activeSession
    ? TERM_BY_ID.get(activeSession.cards[activeSession.index]?.termId ?? '')
    : undefined

  function startSession(nextMode: StudyMode = mode) {
    if (nextMode === 'trouble' && deckStats.trouble === 0) {
      toast('No trouble spots in this field yet. Keep reviewing first.', 'info')
      return
    }
    if (nextMode === 'smart' && potentialSmart === 0) {
      toast('Nothing due or new right now. Free practice keeps the words warm.', 'info')
      return
    }
    const queue = buildReviewQueue(TERMS, progress, { mode: nextMode, category, size })
    if (queue.length === 0) {
      toast('No cards available for this selection.', 'warning')
      return
    }
    const session = createSession(queue, { mode: nextMode, category, size })
    if (!session) return
    updatePrefs({ sessionSize: size })
    setSummary(null)
    setFlipped(false)
    setFlashcardSession(session)
    setSearchParams({}, { replace: true })
  }

  function startFromTerms(terms: Term[], nextMode: StudyMode = 'practice') {
    if (terms.length === 0) return
    const session = createSession(shuffle(terms), {
      mode: nextMode,
      category: 'all',
      size: terms.length,
    })
    if (!session) return
    setSummary(null)
    setFlipped(false)
    setFlashcardSession(session)
  }

  function finishSession(updated: FlashcardSession) {
    setSummary(updated)
    setFlashcardSession(null)
    setFlipped(false)
  }

  function rate(rating: ReviewRating) {
    if (!activeSession || !sessionTerm) return
    rateTerm(sessionTerm.id, rating)
    const alreadyCorrect = new Set(activeSession.correctIds)
    const alreadyMissed = new Set(activeSession.missedIds)
    if (rating === 'again') alreadyMissed.add(sessionTerm.id)
    else {
      alreadyCorrect.add(sessionTerm.id)
      alreadyMissed.delete(sessionTerm.id)
    }
    const nextIndex = activeSession.index + 1
    const updated: FlashcardSession = {
      ...activeSession,
      index: nextIndex,
      correctIds: [...alreadyCorrect],
      missedIds: [...alreadyMissed],
      completed: nextIndex >= activeSession.cards.length,
    }
    if (updated.completed) finishSession(updated)
    else setFlashcardSession(updated)
  }

  useEffect(() => {
    if (!activeSession || !sessionTerm) return
    function handleKeyDown(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null
      const tag = target?.tagName.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return
      if (!flipped && (event.key === ' ' || event.key === 'Enter')) {
        event.preventDefault()
        setFlipped(true)
        return
      }
      if (!flipped) return
      const ratings: Record<string, ReviewRating> = {
        '1': 'again',
        '2': 'hard',
        '3': 'good',
        '4': 'easy',
      }
      if (ratings[event.key]) {
        event.preventDefault()
        rate(ratings[event.key])
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [activeSession, sessionTerm, flipped, rate])

  if (activeSession && sessionTerm) {
    const currentIndex = activeSession.index
    const entry = progress[sessionTerm.id]
    const intervals = previewIntervals(entry ?? createEmptyProgress())
    const pct = (currentIndex / activeSession.cards.length) * 100
    const categoryMeta = CATEGORIES.find((item) => item.id === sessionTerm.category)
    const trouble = isTrouble(entry)

    return (
      <div className="flash-page flash-page--session">
        <header className="flash-session-header">
          <button type="button" className="flash-back" onClick={() => setShowExit(true)}>
            <ArrowLeft size={17} /> End session
          </button>
          <div className="flash-session-header__center">
            <span className="flash-pill">
              {activeSession.mode === 'smart' ? <Sparkles size={14} /> : activeSession.mode === 'trouble' ? <Target size={14} /> : <Shuffle size={14} />}
              {MODE_META[activeSession.mode].title}
            </span>
            <span>
              {currentIndex + 1} / {activeSession.cards.length}
            </span>
          </div>
          <div className="flash-session-header__score">
            <Check size={15} aria-hidden="true" />
            {activeSession.correctIds.length}
          </div>
        </header>

        <div className="flash-progress" aria-hidden="true">
          <span style={{ width: `${pct}%` }} />
        </div>

        <div className="flash-stage">
          <div className={`flashcard ${flipped ? 'is-flipped' : ''}`}>
            <BookmarkButton termId={sessionTerm.id} className="flashcard__bookmark" />
            <div className="flashcard__inner">
              <div className="flashcard__face flashcard__front" aria-hidden={flipped}>
                <button
                  type="button"
                  className="flashcard__flip-surface"
                  onClick={() => setFlipped(true)}
                  disabled={flipped}
                  aria-label={`Reveal definition of ${sessionTerm.term}`}
                >
                  <div className="flashcard__meta">
                    <span className={`flash-category flash-category--${categoryMeta?.accent ?? 'slate'}`}>
                      {categoryMeta ? <CategoryIcon name={categoryMeta.icon} size={14} /> : null}
                      {categoryMeta?.shortName}
                    </span>
                    <TierBadge tier={sessionTerm.tier} short />
                    {trouble ? <span className="trouble-badge">Trouble spot</span> : null}
                  </div>
                  <span className="flashcard__prompt">Define this term</span>
                  <h1>{sessionTerm.term}</h1>
                  {sessionTerm.aliases?.length ? (
                    <p className="flashcard__aliases">also {sessionTerm.aliases.join(' · ')}</p>
                  ) : null}
                  <span className="flashcard__reveal">
                    <span>Tap to reveal</span>
                    <kbd>space</kbd>
                  </span>
                </button>
              </div>
              <div className="flashcard__face flashcard__back" aria-hidden={!flipped}>
                <div className="flashcard__back-scroll">
                  <div className="flashcard__back-top">
                    <span className="flashcard__prompt">Definition</span>
                    <StatusBadge status={entry?.status ?? 'new'} />
                  </div>
                  <h2>{sessionTerm.term}</h2>
                  <p className="flashcard__definition">{sessionTerm.definition}</p>
                  {prefs.showHints && sessionTerm.keyPoint ? (
                    <div className="flashcard__hint">
                      <span>Remember</span>
                      <p>{sessionTerm.keyPoint}</p>
                    </div>
                  ) : null}
                  {prefs.showHints && sessionTerm.example ? (
                    <div className="flashcard__hint flashcard__hint--example">
                      <span>In context</span>
                      <p>{sessionTerm.example}</p>
                    </div>
                  ) : null}
                  <div className="flashcard__back-tools">
                    <SpeakButton text={`${sessionTerm.term}. ${sessionTerm.definition}`} />
                    <span className="flashcard__due">
                      <Clock3 size={14} />
                      {entry?.dueAt ? formatRelativeDue(entry.dueAt) : 'First review'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {flipped ? (
            <div className="rating-panel">
              <div className="rating-panel__head">
                <p>How well did you know it?</p>
                <span>Your rating schedules the next review.</span>
              </div>
              <div className="rating-grid">
                {intervals.map((preview) => {
                  const meta: Record<ReviewRating, { label: string; icon: typeof Check }> = {
                    again: { label: 'Again', icon: RotateCcw },
                    hard: { label: 'Hard', icon: TriangleAlert },
                    good: { label: 'Good', icon: Check },
                    easy: { label: 'Easy', icon: Sparkles },
                  }
                  const Icon = meta[preview.rating].icon
                  return (
                    <button
                      type="button"
                      key={preview.rating}
                      className={`rating-button rating-button--${preview.rating}`}
                      onClick={() => rate(preview.rating)}
                    >
                      <span className="rating-button__key">{preview.rating === 'again' ? '1' : preview.rating === 'hard' ? '2' : preview.rating === 'good' ? '3' : '4'}</span>
                      <Icon size={17} aria-hidden="true" />
                      <span className="rating-button__label">{meta[preview.rating].label}</span>
                      <span className="rating-button__interval">{preview.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="reveal-panel">
              <button type="button" className="button button--flash-primary" onClick={() => setFlipped(true)}>
                Reveal definition
                <ArrowRight size={17} />
              </button>
              <span>or press <kbd>space</kbd></span>
            </div>
          )}
        </div>

        <div className="flash-session-footer">
          <span>{activeSession.missedIds.length} missed so far</span>
          <span>Ratings use <kbd>1</kbd>–<kbd>4</kbd></span>
        </div>

        <ConfirmDialog
          open={showExit}
          title="End this session?"
          description="Cards you already rated are saved. The remaining cards stay unstudied; you can start again whenever you like."
          confirmLabel="End session"
          onConfirm={() => {
            setFlashcardSession(null)
            setShowExit(false)
            toast('Session ended. Your completed reviews are saved.', 'info')
          }}
          onCancel={() => setShowExit(false)}
        />
      </div>
    )
  }

  if (summary) {
    const total = summary.cards.length
    const correct = summary.correctIds.length
    const missed = summary.missedIds.length
    const missedTerms = summary.missedIds
      .map((id) => TERM_BY_ID.get(id))
      .filter((term): term is Term => Boolean(term))
    const duration = Date.now() - summary.startedAt

    return (
      <div className="flash-page flash-page--summary">
        <div className="flash-summary">
          <div className="flash-summary__top">
            <div>
              <p className="eyebrow">Session complete</p>
              <h1>{correct === total ? 'Every card recalled.' : missed <= 2 ? 'Strong pass.' : 'Useful gaps found.'}</h1>
              <p>
                {correct === total
                  ? 'That is the loop working. The next reviews will return at spaced intervals.'
                  : 'The cards you missed are now marked for extra attention. That is the point of practice.'}
              </p>
            </div>
            <ScoreRing score={correct} total={total} label="recall" size={150} />
          </div>

          <div className="flash-summary__stats">
            <div><strong>{total}</strong><span>cards</span></div>
            <div><strong>{correct}</strong><span>correct</span></div>
            <div><strong>{missed}</strong><span>to revisit</span></div>
            <div><strong>{formatDuration(duration)}</strong><span>time</span></div>
          </div>

          {missedTerms.length > 0 ? (
            <div className="flash-summary__missed">
              <div className="flash-summary__missed-head">
                <div>
                  <p className="eyebrow">Worth another pass</p>
                  <h2>The gap is now visible.</h2>
                </div>
                <span className="flash-missed-count">{missedTerms.length}</span>
              </div>
              <div className="missed-list">
                {missedTerms.slice(0, 8).map((term) => {
                  const entry = progress[term.id]
                  const trouble = isTrouble(entry)
                  return (
                    <Link to={`/terms/${term.id}`} className={`missed-row ${trouble ? 'is-trouble' : ''}`} key={term.id}>
                      <span>
                        <strong>{term.term}</strong>
                        <small>{term.definition}</small>
                      </span>
                      {trouble ? <span className="trouble-badge">Trouble spot</span> : <StatusBadge status={entry?.status ?? 'new'} />}
                    </Link>
                  )
                })}
              </div>
              {missedTerms.length > 8 ? <p className="flash-summary__more">+ {missedTerms.length - 8} more</p> : null}
            </div>
          ) : (
            <div className="flash-summary__clean">
              <Trophy size={20} aria-hidden="true" />
              <p>No misses this session. Try a larger deck or a harder field next.</p>
            </div>
          )}

          <div className="flash-summary__actions">
            {missedTerms.length > 0 ? (
              <button
                type="button"
                className="button button--flash-primary"
                onClick={() => startFromTerms(missedTerms)}
              >
                Review the missed {missedTerms.length} <ArrowRight size={16} />
              </button>
            ) : null}
            <button type="button" className="button button--flash-secondary" onClick={() => setSummary(null)}>
              Set up another deck
            </button>
            <Link to="/library" className="text-link">
              Back to library <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const smartAvailable = Math.min(size, potentialSmart)
  const startDisabled = mode === 'trouble' ? deckStats.trouble === 0 : mode === 'smart' ? potentialSmart === 0 : false
  const ModeIcon = MODE_META[mode].icon

  return (
    <div className="flash-page flash-page--setup">
      <header className="flash-heading">
        <div>
          <p className="eyebrow">Recall mode</p>
          <h1>Flip a card. Find the gap.</h1>
          <p>
            Flashcards use active recall and spaced repetition. The goal is not to reread —
            it is to retrieve the definition before you turn the card.
          </p>
        </div>
        <div className="flash-heading__aside">
          <span><Sparkles size={16} /> Active recall</span>
          <span><Clock3 size={16} /> Spaced review</span>
        </div>
      </header>

      <div className="flash-setup-grid">
        <section className="flash-decks" aria-label="Session modes">
          {(Object.keys(MODE_META) as StudyMode[]).map((key) => {
            const meta = MODE_META[key]
            const Icon = meta.icon
            const active = mode === key
            const count = key === 'smart' ? potentialSmart : key === 'trouble' ? deckStats.trouble : deckStats.total
            return (
              <button
                type="button"
                key={key}
                className={`flash-mode ${active ? 'is-active' : ''}`}
                onClick={() => setMode(key)}
                aria-pressed={active}
              >
                <span className="flash-mode__icon"><Icon size={21} /></span>
                <span className="flash-mode__body">
                  <strong>{meta.title}</strong>
                  <span>{meta.description}</span>
                </span>
                <span className="flash-mode__count">{count}</span>
              </button>
            )
          })}

          <div className="flash-deck-note">
            <TriangleAlert size={17} aria-hidden="true" />
            <p><strong>Trouble spots</strong> are terms you have missed at least twice and are still below 50% recall. They get extra exposure, not shame.</p>
          </div>
        </section>

        <section className="flash-config" aria-label="Session settings">
          <div className="flash-config__head">
            <div>
              <p className="eyebrow">Build a session</p>
              <h2>{mode === 'trouble' ? 'Drill the weak spots.' : mode === 'practice' ? 'Choose a field. Shuffle.' : 'A focused deck.'}</h2>
            </div>
            <span className="flash-config__mode-icon"><ModeIcon size={22} /></span>
          </div>

          <label className="flash-field">
            <span>Field</span>
            <span className="select-field__control select-field__control--flash">
              <select value={category} onChange={(event) => setCategory(event.target.value as CategoryId | 'all')}>
                <option value="all">All fields · {TERMS.length} terms</option>
                {CATEGORIES.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={15} aria-hidden="true" />
            </span>
          </label>

          <div className="flash-field">
            <span>Session length</span>
            <div className="segmented segmented--flash">
              {SESSION_SIZES.map((value) => (
                <button
                  type="button"
                  key={value}
                  className={size === value ? 'is-active' : ''}
                  onClick={() => setSize(value)}
                  aria-pressed={size === value}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          <div className="flash-config__hint">
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={prefs.showHints}
                onChange={(event) => updatePrefs({ showHints: event.target.checked })}
              />
              <span className="toggle-row__track" aria-hidden="true"><span /></span>
              <span>
                <strong>Show context hints</strong>
                <small>Remember/example notes on the back of each card.</small>
              </span>
            </label>
          </div>

          <div className="flash-config__summary">
            <div><span>Scope</span><strong>{category === 'all' ? 'All fields' : CATEGORIES.find((item) => item.id === category)?.shortName}</strong></div>
            <div><span>Available smart cards</span><strong>{Math.min(smartAvailable, potentialSmart)}</strong></div>
            <div><span>Deck size</span><strong>{mode === 'practice' ? Math.min(size, deckStats.total) : Math.min(size, mode === 'trouble' ? deckStats.trouble : potentialSmart)}</strong></div>
          </div>

          <button
            type="button"
            className="button button--flash-primary button--flash-wide"
            onClick={() => startSession()}
            disabled={startDisabled}
          >
            {mode === 'trouble' ? 'Start trouble drill' : mode === 'practice' ? 'Shuffle and start' : 'Start smart review'}
            <ArrowRight size={17} />
          </button>
          {startDisabled ? (
            <p className="flash-config__empty-note">
              {mode === 'trouble'
                ? 'No repeated misses in this field yet. Review a few cards or take a quiz first.'
                : 'Nothing due right now. Switch to free practice to keep the vocabulary warm.'}
            </p>
          ) : null}
        </section>
      </div>

      <section className="flash-deck-stats" aria-label="Deck status">
        <div className="flash-deck-stat">
          <span className="flash-deck-stat__icon"><Clock3 size={18} /></span>
          <div><strong>{deckStats.due}</strong><span>due now</span></div>
        </div>
        <div className="flash-deck-stat">
          <span className="flash-deck-stat__icon"><GalleryVerticalEnd size={18} /></span>
          <div><strong>{deckStats.fresh}</strong><span>not seen yet</span></div>
        </div>
        <div className="flash-deck-stat">
          <span className="flash-deck-stat__icon"><Target size={18} /></span>
          <div><strong>{deckStats.trouble}</strong><span>trouble spots</span></div>
        </div>
        <div className="flash-deck-stat">
          <span className="flash-deck-stat__icon"><Sparkles size={18} /></span>
          <div><strong>{deckStats.total}</strong><span>terms in field</span></div>
        </div>
      </section>

      <footer className="flash-footer">
        <span><kbd>space</kbd> reveal · <kbd>1</kbd>–<kbd>4</kbd> rate</span>
        <span>Your session auto-saves and resumes if you refresh.</span>
      </footer>
    </div>
  )
}
