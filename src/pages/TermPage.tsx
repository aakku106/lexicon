import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  Clock3,
  Copy,
  Lightbulb,
  MessageSquarePlus,
  NotebookPen,
  Scale,
  Target,
} from 'lucide-react'
import { useStudy } from '../context/StudyProvider'
import { useToast } from '../context/ToastProvider'
import { findTermByName, relatedTerms, TERM_BY_ID, TERMS_BY_CATEGORY } from '../data/catalog'
import { CATEGORY_BY_ID } from '../data/categories'
import { DISTINCTIONS } from '../data/distinctions'
import { formatRelativeDue } from '../lib/date'
import { accuracy, isTrouble } from '../lib/srs'
import { CategoryIcon } from '../components/ui/CategoryIcon'
import { StatusBadge, TierBadge } from '../components/ui/Badges'
import { BookmarkButton } from '../components/ui/BookmarkButton'
import { SpeakButton } from '../components/ui/SpeakButton'
import { EmptyState } from '../components/ui/EmptyState'
import { ProgressBar } from '../components/ui/ProgressBar'

type SaveState = 'saved' | 'saving'

export function TermPage() {
  const { termId } = useParams()
  const term = termId ? TERM_BY_ID.get(termId) : undefined
  const { progress, notes, setNote, setKnown } = useStudy()
  const { toast } = useToast()
  const [draft, setDraft] = useState('')
  const [saveState, setSaveState] = useState<SaveState>('saved')
  const [copied, setCopied] = useState(false)

  const termNotes = term ? notes[term.id] ?? '' : ''

  useEffect(() => {
    setDraft(termNotes)
    setSaveState('saved')
  }, [term?.id])

  useEffect(() => {
    if (!term) return
    document.title = `${term.term} · Lexicon`
    return () => {
      document.title = 'Lexicon — Tech vocabulary, mastered.'
    }
  }, [term])

  useEffect(() => {
    if (!term) return
    if (draft === termNotes) {
      setSaveState('saved')
      return
    }
    setSaveState('saving')
    const timer = window.setTimeout(() => {
      setNote(term.id, draft)
      setSaveState('saved')
    }, 450)
    return () => window.clearTimeout(timer)
  }, [draft, term, termNotes, setNote])

  const distinctions = useMemo(
    () =>
      term
        ? DISTINCTIONS.filter((distinction) =>
            distinction.items.some((item) => item.term && findTermByName(item.term)?.id === term.id),
          )
        : [],
    [term],
  )

  const related = useMemo(() => (term ? relatedTerms(term, 4) : []), [term])

  if (!term) {
    return (
      <EmptyState
        icon={BookOpen}
        title="That term is not in the library."
        message="The link may be out of date. Search the library or pick a field to keep exploring."
        action={<Link to="/library" className="button button--primary button--small">Back to the library</Link>}
      />
    )
  }

  const category = CATEGORY_BY_ID[term.category]
  const allCategories = [term.category, ...(term.alsoIn ?? [])].filter(
    (id, index, all) => all.indexOf(id) === index,
  )
  const entry = progress[term.id]
  const status = entry?.status ?? 'new'
  const termAccuracy = accuracy(entry)
  const trouble = isTrouble(entry)
  const categoryTerms = TERMS_BY_CATEGORY[term.category]
  const position = categoryTerms.findIndex((item) => item.id === term.id)
  const nextTerm = position >= 0 ? categoryTerms[(position + 1) % categoryTerms.length] : undefined

  function copyDefinition() {
    if (!term) return
    const text = `${term.term} — ${term.definition}`
    if (!navigator.clipboard) {
      toast('Copy is not available in this browser.', 'warning')
      return
    }
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied(true)
        toast('Definition copied. Say it precisely.', 'success')
        window.setTimeout(() => setCopied(false), 1800)
      })
      .catch(() => toast('Copy failed in this browser.', 'warning'))
  }

  return (
    <div className="term-page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link to="/library">Library</Link>
        <span aria-hidden="true">/</span>
        <Link to={`/library?category=${category.id}`}>{category.shortName}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{term.term}</span>
      </nav>

      <header className="term-detail__header">
        <div className="term-detail__intro">
          <div className="term-detail__meta">
            <Link to={`/library?category=${category.id}`} className={`term-detail__category term-detail__category--${category.accent}`}>
              <CategoryIcon name={category.icon} size={16} />
              {category.name}
            </Link>
            <TierBadge tier={term.tier} />
            {term.group ? <span className="term-detail__group">{term.group}</span> : null}
            {trouble ? <span className="trouble-badge">Trouble spot</span> : null}
          </div>

          <div className="term-detail__title-row">
            <div>
              <h1>{term.term}</h1>
              {term.aliases?.length ? (
                <p className="term-detail__aliases">
                  also called {term.aliases.join(' · ')}
                </p>
              ) : null}
            </div>
            <StatusBadge status={status} />
          </div>

          <div className="term-detail__toolbar">
            <BookmarkButton termId={term.id} label="Save" />
            <SpeakButton text={`${term.term}. ${term.definition}`} label="Read definition aloud" />
            <button type="button" className="icon-button text-button" onClick={copyDefinition}>
              {copied ? <Check size={18} /> : <Copy size={18} />}
              <span className="text-button__label">{copied ? 'Copied' : 'Copy'}</span>
            </button>
            <button
              type="button"
              className={`button button--small ${status === 'known' ? 'button--ghost' : 'button--primary'}`}
              onClick={() => {
                setKnown(term.id, status !== 'known')
                toast(
                  status === 'known' ? 'Moved back to learning.' : 'Marked as known. It will return later for review.',
                  'success',
                )
              }}
            >
              {status === 'known' ? 'Still learning' : 'I know this'}
            </button>
          </div>
        </div>
      </header>

      <div className="term-detail__layout">
        <div className="term-detail__main">
          <section className="definition-card">
            <p className="eyebrow">Precise definition</p>
            <p className="definition-card__text">{term.definition}</p>
            {term.keyPoint ? (
              <p className="definition-card__key">
                <Lightbulb size={16} aria-hidden="true" />
                {term.keyPoint}
              </p>
            ) : null}
          </section>

          {term.purpose || term.example ? (
            <div className="term-detail__blocks">
              {term.purpose ? (
                <section className="detail-block">
                  <span className="detail-block__icon detail-block__icon--blue"><Target size={18} /></span>
                  <div>
                    <h2>Why it exists</h2>
                    <p>{term.purpose}</p>
                  </div>
                </section>
              ) : null}
              {term.example ? (
                <section className="detail-block">
                  <span className="detail-block__icon detail-block__icon--sage"><NotebookPen size={18} /></span>
                  <div>
                    <h2>In context</h2>
                    <p>{term.example}</p>
                  </div>
                </section>
              ) : null}
            </div>
          ) : null}

          <section className="term-progress-card">
            <div className="term-progress-card__head">
              <div>
                <p className="eyebrow">Your memory</p>
                <h2>{status === 'new' ? 'Not reviewed yet.' : status === 'known' ? 'This one is sticking.' : 'Still in rotation.'}</h2>
              </div>
              <Clock3 size={20} aria-hidden="true" />
            </div>
            <div className="term-progress-card__stats">
              <div>
                <span>Status</span>
                <StatusBadge status={status} />
              </div>
              <div>
                <span>Next review</span>
                <strong>{entry?.dueAt ? formatRelativeDue(entry.dueAt) : 'After first review'}</strong>
              </div>
              <div>
                <span>Accuracy</span>
                <strong>{termAccuracy === null ? '—' : `${termAccuracy}%`}</strong>
              </div>
              <div>
                <span>Encounters</span>
                <strong>{entry?.seen ?? 0}</strong>
              </div>
            </div>
            <div className="term-progress-card__actions">
              <Link to="/flashcards" className="button button--primary button--small">
                Review with flashcards <ArrowRight size={15} />
              </Link>
              <Link to={term ? `/quiz?category=${term.category}` : '/quiz'} className="text-link">
                Test this field <ArrowRight size={14} />
              </Link>
            </div>
          </section>

          {distinctions.length > 0 ? (
            <section className="term-confusions">
              <div className="section-heading section-heading--compact">
                <div>
                  <p className="eyebrow">Don’t confuse it</p>
                  <h2>The nearby words.</h2>
                </div>
                <Scale size={20} aria-hidden="true" />
              </div>
              {distinctions.map((distinction) => {
                const ownItem = distinction.items.find(
                  (item) => item.term && findTermByName(item.term)?.id === term.id,
                )
                const otherItems = distinction.items.filter((item) => item !== ownItem)
                return (
                  <Link to={`/distinctions#${distinction.id}`} className="confusion-link" key={distinction.id}>
                    <div>
                      <strong>{distinction.title}</strong>
                      <p>{otherItems.map((item) => item.label).join(' · ')}</p>
                    </div>
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>
                )
              })}
            </section>
          ) : null}

          <section className="notes-card">
            <div className="notes-card__head">
              <div>
                <p className="eyebrow">Your notes</p>
                <h2>Make it yours.</h2>
              </div>
              <span className={`save-indicator ${saveState === 'saving' ? 'is-saving' : ''}`}>
                <span />
                {saveState === 'saving' ? 'Saving' : 'Saved locally'}
              </span>
            </div>
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              onBlur={() => setNote(term.id, draft)}
              placeholder="Your own example, a viva answer, a mnemonic…"
              rows={4}
              aria-label={`Notes for ${term.term}`}
            />
            <p className="notes-card__hint">Notes are stored only in this browser.</p>
          </section>
        </div>

        <aside className="term-detail__aside">
          <section className="aside-card">
            <p className="eyebrow">Filed under</p>
            <div className="category-chip-list">
              {allCategories.map((id) => {
                const item = CATEGORY_BY_ID[id]
                return (
                  <Link to={`/library?category=${id}`} className="category-chip" key={id}>
                    <CategoryIcon name={item.icon} size={14} />
                    {item.shortName}
                  </Link>
                )
              })}
            </div>
          </section>

          {related.length > 0 ? (
            <section className="aside-card">
              <p className="eyebrow">Adjacent vocabulary</p>
              <div className="related-list">
                {related.map((item) => (
                  <Link to={`/terms/${item.id}`} className="related-item" key={item.id}>
                    <span>
                      <strong>{item.term}</strong>
                      <small>{CATEGORY_BY_ID[item.category].shortName}</small>
                    </span>
                    <ArrowRight size={14} aria-hidden="true" />
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <section className="aside-card aside-card--quote">
            <p className="eyebrow">Say it precisely</p>
            <p>
              “{term.term} — {term.definition}”
            </p>
          </section>

          {nextTerm ? (
            <Link to={`/terms/${nextTerm.id}`} className="next-term-card">
              <span>
                <small>Next in {category.shortName}</small>
                <strong>{nextTerm.term}</strong>
              </span>
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
          ) : null}

          <Link
            to={`/feedback?type=correction&term=${encodeURIComponent(term.term)}`}
            className="term-feedback-link"
          >
            <MessageSquarePlus size={17} aria-hidden="true" />
            <span>Report a mistake</span>
          </Link>
        </aside>
      </div>

      <div className="term-detail__back-row">
        <Link to={`/library?category=${category.id}`} className="text-link">
          <ArrowLeft size={15} /> Back to {category.shortName}
        </Link>
        <div className="term-detail__progress-note">
          <ProgressBar value={entry?.intervalDays ? Math.min(100, (entry.intervalDays / 21) * 100) : 0} tone="sage" size="sm" />
          <span>{entry?.intervalDays ? `${entry.intervalDays} day interval` : 'New card'}</span>
        </div>
      </div>
    </div>
  )
}
