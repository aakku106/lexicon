import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  BookOpen,
  CheckCheck,
  Clock3,
  Flame,
  Target,
  TrendingUp,
  Trophy,
} from 'lucide-react'
import { useStudy } from '../context/StudyProvider'
import { TERMS } from '../data/catalog'
import { CATEGORY_BY_ID, TIER_META } from '../data/categories'
import {
  categoryProgress,
  computeStats,
  getHeatmapWeeks,
  quizAverage,
  recentDays,
  streakLabel,
  tierProgress,
  troubleTerms,
} from '../lib/stats'
import { formatDate } from '../lib/date'
import { accuracy } from '../lib/srs'
import { ProgressBar } from '../components/ui/ProgressBar'
import { CategoryIcon } from '../components/ui/CategoryIcon'
import { ScoreRing } from '../components/ui/ScoreRing'
import { StatusBadge, TierBadge } from '../components/ui/Badges'
import { EmptyState } from '../components/ui/EmptyState'

function dateLabel(key: string): string {
  const [year, month, day] = key.split('-').map(Number)
  return formatDate(new Date(year, month - 1, day).getTime())
}

function weekdayLabel(key: string): string {
  const [year, month, day] = key.split('-').map(Number)
  return new Intl.DateTimeFormat('en', { weekday: 'short' }).format(
    new Date(year, month - 1, day),
  )
}

function heatLevel(count: number): number {
  if (count === 0) return 0
  if (count <= 2) return 1
  if (count <= 5) return 2
  if (count <= 11) return 3
  return 4
}

const WEEKDAY_LABELS = ['', 'Mon', '', 'Wed', '', 'Fri', '']

export function ProgressPage() {
  const { progress, activity, bookmarks, prefs, quizHistory } = useStudy()

  const stats = useMemo(
    () => computeStats(TERMS, progress, activity, bookmarks, prefs.dailyGoal),
    [progress, activity, bookmarks, prefs.dailyGoal],
  )
  const categories = useMemo(() => categoryProgress(progress), [progress])
  const tiers = useMemo(() => tierProgress(progress), [progress])
  const heatmap = useMemo(() => getHeatmapWeeks(activity, 17), [activity])
  const recent = useMemo(() => recentDays(activity, 7), [activity])
  const trouble = useMemo(() => troubleTerms(TERMS, progress).slice(0, 6), [progress])
  const average = quizAverage(quizHistory)
  const recentQuizzes = quizHistory.slice(0, 8)
  const goalPct = Math.min(
    100,
    Math.round((stats.todayReps / Math.max(1, prefs.dailyGoal)) * 100),
  )
  const maxRecent = Math.max(1, ...recent.map((day) => day.total))
  const isEmpty = stats.seenTerms === 0 && stats.totalReviews === 0 && quizHistory.length === 0

  const focusCategories = [...categories]
    .filter((entry) => entry.total > 0)
    .sort(
      (a, b) =>
        b.due - a.due ||
        b.trouble - a.trouble ||
        a.knownPct - b.knownPct ||
        a.category.order - b.category.order,
    )
    .slice(0, 3)

  const totalHeat = heatmap
    .flat()
    .reduce((sum, cell) => sum + (cell.future ? 0 : cell.count), 0)

  return (
    <div className="progress-page">
      <header className="page-heading progress-heading">
        <p className="eyebrow">Your record</p>
        <div className="page-heading__row">
          <div>
            <h1>Progress is a memory, not a score.</h1>
            <p>
              The numbers below describe what your brain has had a chance to retrieve. Misses
              are recorded on purpose — they are the raw material for the next review.
            </p>
          </div>
          <div className="progress-heading__streak">
            <span className="progress-heading__flame"><Flame size={20} /></span>
            <div>
              <strong>{streakLabel(stats.currentStreak)}</strong>
              <span>best · {streakLabel(stats.longestStreak)}</span>
            </div>
          </div>
        </div>
      </header>

      {isEmpty ? (
        <section className="progress-onboarding">
          <span className="progress-onboarding__icon"><BookOpen size={21} /></span>
          <div>
            <p className="eyebrow">A blank page</p>
            <h2>Nothing studied yet. Choose a first move.</h2>
            <p>
              Start with a smart review to meet the Tier 1 vocabulary, or take a short quiz to
              see which terms are already familiar.
            </p>
          </div>
          <div className="progress-onboarding__actions">
            <Link to="/flashcards" className="button button--primary button--small">
              Start reviewing <ArrowRight size={15} />
            </Link>
            <Link to="/quiz" className="button button--ghost button--small">
              Take a quiz
            </Link>
          </div>
        </section>
      ) : null}

      <section className="progress-overview" aria-label="Study overview">
        <article className="progress-stat">
          <span className="progress-stat__icon progress-stat__icon--sage"><CheckCheck size={19} /></span>
          <div className="progress-stat__body">
            <span>Known</span>
            <strong>{stats.knownTerms} <small>/ {stats.totalTerms}</small></strong>
            <ProgressBar value={(stats.knownTerms / stats.totalTerms) * 100} tone="sage" size="sm" />
          </div>
        </article>
        <article className="progress-stat">
          <span className="progress-stat__icon progress-stat__icon--amber"><Clock3 size={19} /></span>
          <div className="progress-stat__body">
            <span>Due now</span>
            <strong>{stats.dueTerms}</strong>
            <Link to="/flashcards" className="progress-stat__link">
              Open the queue <ArrowRight size={13} />
            </Link>
          </div>
        </article>
        <article className="progress-stat">
          <span className="progress-stat__icon progress-stat__icon--blue"><Target size={19} /></span>
          <div className="progress-stat__body">
            <span>Recall accuracy</span>
            <strong>{stats.accuracyPct === null ? '—' : `${stats.accuracyPct}%`}</strong>
            <span className="progress-stat__hint">
              {stats.totalCorrect} correct · {stats.totalMissed} missed
            </span>
          </div>
        </article>
        <article className="progress-stat">
          <span className="progress-stat__icon progress-stat__icon--blue"><Activity size={19} /></span>
          <div className="progress-stat__body">
            <span>Total reps</span>
            <strong>{stats.totalReviews}</strong>
            <span className="progress-stat__hint">
              + {stats.totalQuizAnswers} quiz answers
            </span>
          </div>
        </article>
      </section>

      {focusCategories.some((entry) => entry.due > 0 || entry.trouble > 0 || entry.seenPct < 100) ? (
        <section className="progress-focus">
          <span className="progress-focus__label">
            <TrendingUp size={16} /> Where to go next
          </span>
          <div className="progress-focus__list">
            {focusCategories.map((entry) => (
              <Link
                to={`/library?category=${entry.category.id}`}
                className="progress-focus__item"
                key={entry.category.id}
              >
                <CategoryIcon name={entry.category.icon} size={14} />
                <span>{entry.category.shortName}</span>
                <strong>
                  {entry.due > 0 ? `${entry.due} due` : `${entry.knownPct}% known`}
                </strong>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <div className="progress-main-grid">
        <section className="progress-panel heatmap-panel">
          <div className="progress-panel__head">
            <div>
              <p className="eyebrow">Activity</p>
              <h2>{totalHeat} reps in the last 17 weeks.</h2>
            </div>
            <span className="heatmap-total">
              <Flame size={15} /> {stats.activeDays} active day{stats.activeDays === 1 ? '' : 's'}
            </span>
          </div>

          <div className="heatmap-scroll">
            <div className="heatmap">
              <div className="heatmap__daylabels" aria-hidden="true">
                {WEEKDAY_LABELS.map((label, index) => (
                  <span key={`${label}-${index}`}>{label}</span>
                ))}
              </div>
              <div className="heatmap__weeks">
                {heatmap.map((week, weekIndex) => (
                  <div className="heatmap__week" key={week[0]?.key ?? weekIndex}>
                    {week.map((cell) => (
                      <span
                        key={cell.key}
                        className={`heatmap__cell heatmap__cell--${heatLevel(cell.count)} ${cell.future ? 'is-future' : ''}`}
                        title={
                          cell.future
                            ? dateLabel(cell.key)
                            : `${dateLabel(cell.key)} · ${cell.count} rep${cell.count === 1 ? '' : 's'} (${cell.reviews} review${cell.reviews === 1 ? '' : 's'}, ${cell.quiz} quiz)`
                        }
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="heatmap__legend">
            <span>Less</span>
            {[0, 1, 2, 3, 4].map((level) => (
              <span key={level} className={`heatmap__cell heatmap__cell--${level}`} aria-hidden="true" />
            ))}
            <span>More</span>
            <span className="heatmap__legend-note">Each cell is a local calendar day</span>
          </div>
        </section>

        <aside className="progress-side">
          <section className="progress-panel goal-panel">
            <div className="progress-panel__head">
              <div>
                <p className="eyebrow">Today</p>
                <h2>{goalPct >= 100 ? 'Goal met.' : 'Keep the loop going.'}</h2>
              </div>
            </div>
            <div className="goal-panel__ring">
              <ScoreRing score={stats.todayReps} total={prefs.dailyGoal} label="of daily goal" size={128} />
            </div>
            <p className="goal-panel__note">
              {stats.todayReps} of {prefs.dailyGoal} reps today · {goalPct}%
            </p>
            <Link to="/flashcards" className="text-link">
              Start a session <ArrowRight size={14} />
            </Link>
          </section>

          <section className="progress-panel recent-panel">
            <div className="progress-panel__head progress-panel__head--compact">
              <div>
                <p className="eyebrow">Last 7 days</p>
                <h2>Consistency.</h2>
              </div>
            </div>
            <div className="recent-bars" aria-label="Activity over the last seven days">
              {recent.map((day, index) => (
                <div
                  className={`recent-bar ${index === recent.length - 1 ? 'is-today' : ''}`}
                  key={day.key}
                  title={`${dateLabel(day.key)} · ${day.total} reps`}
                >
                  <span className="recent-bar__track">
                    <span
                      className="recent-bar__fill"
                      style={{ height: `${Math.max(day.total > 0 ? 10 : 3, (day.total / maxRecent) * 100)}%` }}
                    />
                  </span>
                  <strong>{day.total}</strong>
                  <span>{weekdayLabel(day.key).slice(0, 1)}</span>
                </div>
              ))}
            </div>
          </section>
        </aside>
      </div>

      <div className="progress-split">
        <section className="progress-panel category-panel">
          <div className="progress-panel__head">
            <div>
              <p className="eyebrow">Field by field</p>
              <h2>The whole stack, in view.</h2>
            </div>
            <Link to="/library" className="text-link">
              Open library <ArrowRight size={14} />
            </Link>
          </div>
          <div className="category-progress-list">
            {categories.map((entry) => (
              <Link
                to={`/library?category=${entry.category.id}`}
                className="category-progress-row"
                key={entry.category.id}
              >
                <span className={`category-progress-row__icon category-progress-row__icon--${entry.category.accent}`}>
                  <CategoryIcon name={entry.category.icon} size={18} />
                </span>
                <span className="category-progress-row__body">
                  <span className="category-progress-row__top">
                    <strong>{entry.category.shortName}</strong>
                    <span>{entry.seen}/{entry.total} seen · {entry.known} known</span>
                  </span>
                  <ProgressBar
                    value={entry.seenPct}
                    tone={entry.category.accent}
                    size="sm"
                    label={`${entry.category.shortName} explored`}
                  />
                </span>
                <span className="category-progress-row__meta">
                  {entry.due > 0 ? <span className="category-progress-row__due">{entry.due} due</span> : null}
                  {entry.trouble > 0 ? <span className="category-progress-row__trouble">{entry.trouble} weak</span> : null}
                  {entry.due === 0 && entry.trouble === 0 ? <span className="category-progress-row__ok">{entry.knownPct}%</span> : null}
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="progress-panel tier-panel-progress">
          <div className="progress-panel__head">
            <div>
              <p className="eyebrow">Priority path</p>
              <h2>Depth, by tier.</h2>
            </div>
          </div>
          <div className="tier-progress-list">
            {tiers.map((entry) => {
              const meta = TIER_META[entry.tier]
              return (
                <Link
                  to={`/library?tier=${entry.tier}`}
                  className={`tier-progress-card tier-progress-card--${meta.color}`}
                  key={entry.tier}
                >
                  <div className="tier-progress-card__top">
                    <TierBadge tier={entry.tier} />
                    <span>{entry.seen}/{entry.total}</span>
                  </div>
                  <strong>{meta.title}</strong>
                  <ProgressBar
                    value={entry.seenPct}
                    tone={meta.color === 'blue' ? 'blue' : meta.color === 'sage' ? 'sage' : 'amber'}
                    size="sm"
                  />
                  <span className="tier-progress-card__foot">
                    {entry.known} known · {entry.seenPct}% explored
                  </span>
                </Link>
              )
            })}
          </div>
        </section>
      </div>

      <div className="progress-bottom-grid">
        <section className="progress-panel">
          <div className="progress-panel__head">
            <div>
              <p className="eyebrow">Quiz history</p>
              <h2>{average === null ? 'No quizzes yet.' : `${average}% average.`}</h2>
            </div>
            <Link to="/quiz" className="text-link">
              Take a quiz <ArrowRight size={14} />
            </Link>
          </div>
          {recentQuizzes.length > 0 ? (
            <div className="quiz-history-list">
              {recentQuizzes.map((entry) => {
                const pct = Math.round((entry.score / entry.total) * 100)
                const fieldLabel = entry.categories.length
                  ? entry.categories.map((id) => CATEGORY_BY_ID[id].shortName).join(' · ')
                  : 'All fields'
                return (
                  <div className="quiz-history-row" key={entry.id}>
                    <span className="quiz-history-row__date">{formatDate(entry.date)}</span>
                    <span className="quiz-history-row__body">
                      <strong>{entry.score}/{entry.total} correct</strong>
                      <span>{fieldLabel} · {entry.missedTermIds.length} missed</span>
                    </span>
                    <span className={`quiz-history-row__score ${pct < 60 ? 'is-low' : ''}`}>{pct}%</span>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyState
              icon={Trophy}
              title="No quiz record yet."
              message="A short quiz will show which terms are already familiar and which need a review."
              action={
                <Link to="/quiz" className="button button--primary button--small">
                  Take the first quiz
                </Link>
              }
            />
          )}
        </section>

        <section className="progress-panel">
          <div className="progress-panel__head">
            <div>
              <p className="eyebrow">Trouble spots</p>
              <h2>{trouble.length > 0 ? 'Worth another pass.' : 'Nothing stuck yet.'}</h2>
            </div>
            {trouble.length > 0 ? (
              <Link to="/flashcards?mode=trouble" className="text-link text-link--nowrap">
                Drill these <ArrowRight size={14} />
              </Link>
            ) : null}
          </div>
          {trouble.length > 0 ? (
            <div className="trouble-panel__list">
              {trouble.map((term) => {
                const entry = progress[term.id]
                return (
                  <Link to={`/terms/${term.id}`} className="trouble-row" key={term.id}>
                    <span className="trouble-row__marker" aria-hidden="true" />
                    <span className="trouble-row__body">
                      <strong>{term.term}</strong>
                      <span>
                        {entry?.missed ?? 0} missed · {entry?.correct ?? 0} correct ·{' '}
                        {entry ? `${accuracy(entry) ?? 0}% accuracy` : 'No record'}
                      </span>
                    </span>
                    <StatusBadge status={entry?.status ?? 'new'} />
                  </Link>
                )
              })}
            </div>
          ) : (
            <div className="progress-empty">
              <Target size={21} aria-hidden="true" />
              <p>
                A term appears here after repeated misses. Keep answering; the list will build
                itself honestly.
              </p>
              <Link to="/quiz" className="button button--ghost button--small">
                Test yourself <ArrowRight size={14} />
              </Link>
            </div>
          )}
        </section>
      </div>

      <footer className="page-footer">
        <span>{stats.seenTerms} terms explored · {stats.bookmarkedTerms} bookmarked</span>
        <span>Everything is stored locally in this browser</span>
      </footer>
    </div>
  )
}
