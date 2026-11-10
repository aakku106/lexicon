import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Bookmark,
  Clock3,
  Flame,
  GraduationCap,
  Search,
  Sparkles,
  Target,
  Trophy,
} from 'lucide-react'
import { useStudy } from '../context/StudyProvider'
import { TERMS } from '../data/catalog'
import { CATEGORY_BY_ID, TIER_META } from '../data/categories'
import type { CategoryId } from '../types'
import { DISTINCTIONS } from '../data/distinctions'
import {
  categoryProgress,
  computeStats,
  dailyDistinction,
  dailyTerm,
  streakLabel,
  tierProgress,
  troubleTerms,
} from '../lib/stats'
import { formatFullDate, greeting } from '../lib/date'
import { ProgressBar } from '../components/ui/ProgressBar'
import { CategoryIcon } from '../components/ui/CategoryIcon'
import { ScoreRing } from '../components/ui/ScoreRing'
import { StatusBadge, TierBadge } from '../components/ui/Badges'
import { openSearch } from '../components/layout/nav'
import { DistinctionCard } from '../components/terms/DistinctionCard'

const FEATURED_CATEGORIES: CategoryId[] = [
  'foundations',
  'operating-systems',
  'networking',
  'http-backend',
  'databases',
  'distributed-systems',
  'security',
  'patterns',
]

export function HomePage() {
  const { progress, activity, bookmarks, prefs } = useStudy()
  const now = new Date()

  const stats = useMemo(
    () => computeStats(TERMS, progress, activity, bookmarks, prefs.dailyGoal),
    [progress, activity, bookmarks, prefs.dailyGoal],
  )
  const categories = useMemo(() => categoryProgress(progress), [progress])
  const tiers = useMemo(() => tierProgress(progress), [progress])
  const trouble = useMemo(() => troubleTerms(TERMS, progress).slice(0, 4), [progress])
  const word = useMemo(() => dailyTerm(TERMS, now), [now.toDateString()])
  const distinction = useMemo(() => dailyDistinction(DISTINCTIONS, now), [now.toDateString()])
  const wordProgress = word ? progress[word.id] : undefined
  const wordStatus = wordProgress?.status ?? 'new'
  const categoryLookup = useMemo(
    () => new Map(categories.map((entry) => [entry.category.id, entry])),
    [categories],
  )

  const goalPct = Math.min(100, Math.round((stats.todayReps / Math.max(1, prefs.dailyGoal)) * 100))
  const goalLeft = Math.max(0, prefs.dailyGoal - stats.todayReps)
  const reviewLabel = stats.dueTerms
    ? `Review ${stats.dueTerms} due`
    : stats.newTerms
      ? 'Learn something new'
      : 'Practice a set'

  return (
    <div className="home-page">
      <section className="home-hero">
        <div className="home-hero__pattern" aria-hidden="true" />
        <div className="home-hero__copy">
          <p className="eyebrow eyebrow--light">
            {greeting(now)}
            {prefs.name ? `, ${prefs.name}` : ''} · {formatFullDate(now.getTime())}
          </p>
          <h1>
            Know the name of the thing <em>you already understand.</em>
          </h1>
          <p className="home-hero__lede">
            {TERMS.length} precise definitions from foundations to frontier AI. Stop
            describing the mechanism. Start using the term.
          </p>
          <div className="home-hero__actions">
            <Link to="/flashcards" className="button button--amber">
              {reviewLabel}
              <ArrowRight size={17} aria-hidden="true" />
            </Link>
            <Link to="/library" className="button button--ghost-light">
              Browse the library
            </Link>
          </div>
          <div className="home-hero__meta">
            <span><Bookmark size={14} aria-hidden="true" /> Local-first progress</span>
            <span><Sparkles size={14} aria-hidden="true" /> Spaced repetition</span>
            <span><GraduationCap size={14} aria-hidden="true" /> No sign-up</span>
          </div>
        </div>

        {word ? (
          <aside className="daily-word" aria-label="Word of the day">
            <div className="daily-word__top">
              <span className="daily-word__eyebrow">Word of the day</span>
              <span className="daily-word__index">
                {String(TERMS.findIndex((term) => term.id === word.id) + 1).padStart(3, '0')}
              </span>
            </div>
            <div className="daily-word__category">
              <CategoryIcon name={CATEGORY_BY_ID[word.category].icon} size={15} />
              {CATEGORY_BY_ID[word.category].shortName}
              <StatusBadge status={wordStatus} />
            </div>
            <h2>{word.term}</h2>
            <p>{word.definition}</p>
            <div className="daily-word__footer">
              <TierBadge tier={word.tier} short />
              <Link to={`/terms/${word.id}`} className="text-link">
                Open the card <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
            <span className="daily-word__corner" aria-hidden="true">Aa</span>
          </aside>
        ) : null}
      </section>

      <section className="home-stats" aria-label="Study overview">
        <article className="stat-card">
          <span className="stat-card__icon stat-card__icon--blue"><Bookmark size={19} /></span>
          <div>
            <span className="stat-card__label">Explored</span>
            <strong>{stats.seenTerms} <small>/ {TERMS.length}</small></strong>
          </div>
          <div className="stat-card__foot">
            <ProgressBar value={(stats.seenTerms / TERMS.length) * 100} tone="blue" size="sm" />
            <span>{Math.round((stats.seenTerms / TERMS.length) * 100)}%</span>
          </div>
        </article>
        <article className="stat-card stat-card--amber">
          <span className="stat-card__icon stat-card__icon--amber"><Clock3 size={19} /></span>
          <div>
            <span className="stat-card__label">Due now</span>
            <strong>{stats.dueTerms}</strong>
          </div>
          <div className="stat-card__foot">
            <span className="stat-card__hint">{stats.dueTerms ? 'Clear the queue' : 'Nothing waiting'}</span>
          </div>
        </article>
        <article className="stat-card">
          <span className="stat-card__icon stat-card__icon--sage"><Flame size={19} /></span>
          <div>
            <span className="stat-card__label">Streak</span>
            <strong>{stats.currentStreak} <small>days</small></strong>
          </div>
          <div className="stat-card__foot">
            <span className="stat-card__hint">Best: {streakLabel(stats.longestStreak)}</span>
          </div>
        </article>
        <article className="stat-card">
          <span className="stat-card__icon stat-card__icon--blue"><Target size={19} /></span>
          <div>
            <span className="stat-card__label">Recall accuracy</span>
            <strong>{stats.accuracyPct === null ? '—' : `${stats.accuracyPct}%`}</strong>
          </div>
          <div className="stat-card__foot">
            <span className="stat-card__hint">{stats.troubleTerms} trouble spot{stats.troubleTerms === 1 ? '' : 's'}</span>
          </div>
        </article>
      </section>

      <section className="home-dashboard">
        <article className="goal-card">
          <div className="goal-card__copy">
            <p className="eyebrow">Today’s practice</p>
            <h2>{goalLeft === 0 ? 'Daily goal met.' : `${goalLeft} rep${goalLeft === 1 ? '' : 's'} to go.`}</h2>
            <p>
              {goalLeft === 0
                ? 'You showed up. A few more cards will make the words stick.'
                : 'Small, repeated recall beats one heroic study session. Keep the loop going.'}
            </p>
            <div className="goal-card__actions">
              <Link to="/flashcards" className="button button--primary button--small">
                {stats.todayReps === 0 ? 'Start today’s session' : 'Keep going'}
                <ArrowRight size={16} aria-hidden="true" />
              </Link>
              <Link to="/quiz" className="button button--ghost button--small">
                Take a quiz
              </Link>
            </div>
          </div>
          <div className="goal-card__ring">
            <ScoreRing score={stats.todayReps} total={prefs.dailyGoal} label="daily reps" size={136} />
            <span>{goalPct}% of today’s goal</span>
          </div>
        </article>

        <article className="tier-panel">
          <div className="tier-panel__head">
            <div>
              <p className="eyebrow">Priority path</p>
              <h2>Start with the words that pay off everywhere.</h2>
            </div>
            <Link to="/library?tier=1" className="text-link">
              View all <ArrowRight size={14} aria-hidden="true" />
            </Link>
          </div>
          <div className="tier-panel__list">
            {tiers.map((entry) => {
              const meta = TIER_META[entry.tier]
              return (
                <Link
                  to={`/library?tier=${entry.tier}`}
                  className={`tier-row tier-row--${meta.color}`}
                  key={entry.tier}
                >
                  <span className="tier-row__badge">
                    <TierBadge tier={entry.tier} />
                  </span>
                  <span className="tier-row__body">
                    <strong>{meta.title}</strong>
                    <span>{meta.description}</span>
                  </span>
                  <span className="tier-row__progress">
                    <span>{entry.seen}/{entry.total}</span>
                    <ProgressBar value={entry.seenPct} tone={meta.color === 'blue' ? 'blue' : meta.color === 'sage' ? 'sage' : 'amber'} size="sm" />
                  </span>
                </Link>
              )
            })}
          </div>
        </article>
      </section>

      <section className="home-section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">The field guide</p>
            <h2>One place for the whole stack.</h2>
          </div>
          <Link to="/library" className="text-link">
            All {categories.length} fields <ArrowRight size={14} aria-hidden="true" />
          </Link>
        </div>
        <div className="category-grid">
          {FEATURED_CATEGORIES.map((id) => {
            const category = CATEGORY_BY_ID[id]
            const entry = categoryLookup.get(id)
            if (!entry) return null
            return (
              <Link
                key={id}
                to={`/library?category=${id}`}
                className={`category-card category-card--${category.accent}`}
              >
                <div className="category-card__top">
                  <span className={`category-card__icon category-card__icon--${category.accent}`}>
                    <CategoryIcon name={category.icon} size={20} />
                  </span>
                  <span className="category-card__count">{entry.total}</span>
                </div>
                <h3>{category.shortName}</h3>
                <p>{category.description}</p>
                <div className="category-card__footer">
                  <ProgressBar
                    value={entry.seenPct}
                    tone={category.accent}
                    size="sm"
                    label={`${category.shortName} explored`}
                  />
                  <span>{entry.seenPct}% seen</span>
                </div>
                {entry.due > 0 ? <span className="category-card__due">{entry.due} due</span> : null}
              </Link>
            )
          })}
        </div>
        <div className="category-shortcuts">
          {categories
            .filter((entry) => !FEATURED_CATEGORIES.includes(entry.category.id))
            .map((entry) => (
              <Link key={entry.category.id} to={`/library?category=${entry.category.id}`} className="category-shortcut">
                <CategoryIcon name={entry.category.icon} size={14} />
                {entry.category.shortName}
              </Link>
            ))}
        </div>
      </section>

      <section className="home-bottom-grid">
        {trouble.length > 0 ? (
          <article className="trouble-panel">
            <div className="trouble-panel__head">
              <span className="trouble-panel__icon"><Target size={18} aria-hidden="true" /></span>
              <div>
                <p className="eyebrow">Trouble spots</p>
                <h2>Worth another pass.</h2>
              </div>
              <Link to="/flashcards?mode=trouble" className="text-link text-link--nowrap">
                Drill these <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
            <div className="trouble-panel__list">
              {trouble.map((term) => {
                const entry = progress[term.id]
                return (
                  <Link to={`/terms/${term.id}`} className="trouble-row" key={term.id}>
                    <span className="trouble-row__marker" aria-hidden="true" />
                    <span className="trouble-row__body">
                      <strong>{term.term}</strong>
                      <span>{entry?.missed ?? 0} missed · {entry?.correct ?? 0} correct</span>
                    </span>
                    <StatusBadge status={entry?.status ?? 'new'} />
                  </Link>
                )
              })}
            </div>
            <p className="trouble-panel__note">
              A term lands here after repeated misses. That is not failure; it is a useful signal.
            </p>
          </article>
        ) : (
          <article className="trouble-panel trouble-panel--empty">
            <div className="trouble-panel__head">
              <span className="trouble-panel__icon"><Trophy size={18} aria-hidden="true" /></span>
              <div>
                <p className="eyebrow">Trouble spots</p>
                <h2>No repeated misses yet.</h2>
              </div>
            </div>
            <p className="trouble-panel__empty-text">
              As you review, terms you keep missing will collect here so you can target them
              deliberately instead of rereading everything.
            </p>
            <Link to="/quiz" className="button button--ghost button--small">
              Test yourself <ArrowRight size={15} />
            </Link>
          </article>
        )}

        {distinction ? (
          <div className="home-distinction">
            <div className="section-heading section-heading--compact">
              <div>
                <p className="eyebrow">A distinction worth keeping</p>
                <h2>Similar words, different mechanics.</h2>
              </div>
              <Link to="/distinctions" className="text-link">
                All distinctions <ArrowRight size={14} aria-hidden="true" />
              </Link>
            </div>
            <DistinctionCard distinction={distinction} />
          </div>
        ) : null}
      </section>

      <section className="home-search-cta">
        <div>
          <p className="eyebrow">Looking for a specific term?</p>
          <h2>Search {TERMS.length} definitions in one keystroke.</h2>
        </div>
        <button type="button" className="search-launch" onClick={openSearch}>
          <Search size={19} aria-hidden="true" />
          <span>Search vocabulary</span>
          <kbd>/</kbd>
        </button>
      </section>

      <footer className="page-footer">
        <span>Lexicon · the vocabulary layer behind good systems.</span>
        <span>Progress stays in this browser.</span>
      </footer>
    </div>
  )
}
