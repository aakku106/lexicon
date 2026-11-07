import { useEffect, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ChevronDown,
  CircleQuestionMark,
  Clock3,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
  X,
} from 'lucide-react'
import type { CategoryId, QuizAnswer, QuizQuestion, Term, Tier } from '../types'
import { useStudy } from '../context/StudyProvider'
import { useToast } from '../context/ToastProvider'
import { CATEGORIES, CATEGORY_BY_ID } from '../data/categories'
import { TERM_BY_ID, TERMS } from '../data/catalog'
import { quizAverage } from '../lib/stats'
import { generateQuiz } from '../lib/quiz'
import { formatDate } from '../lib/date'
import { CategoryIcon } from '../components/ui/CategoryIcon'
import { ScoreRing } from '../components/ui/ScoreRing'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'

const QUIZ_SIZES = [10, 15, 20]

const TIER_OPTIONS: Array<{ value: Tier | 'all'; label: string }> = [
  { value: 'all', label: 'All tiers' },
  { value: 1, label: 'Tier 1' },
  { value: 2, label: 'Tier 2' },
  { value: 3, label: 'Tier 3' },
]

type Phase = 'setup' | 'active' | 'summary'

function isCategoryId(value: string | null): value is CategoryId {
  return CATEGORIES.some((category) => category.id === value)
}

function scopeLabel(category: CategoryId | 'all', tier: Tier | 'all'): string {
  const field = category === 'all' ? 'All fields' : CATEGORY_BY_ID[category].shortName
  return tier === 'all' ? field : `${field} · Tier ${tier}`
}

export function QuizPage() {
  const { quizHistory, prefs, applyQuiz } = useStudy()
  const { toast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()

  const [category, setCategory] = useState<CategoryId | 'all'>(() => {
    const query = searchParams.get('category')
    return isCategoryId(query) ? query : 'all'
  })
  const [tier, setTier] = useState<Tier | 'all'>('all')
  const [count, setCount] = useState(Math.min(10, prefs.sessionSize))
  const [phase, setPhase] = useState<Phase>('setup')
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [answers, setAnswers] = useState<QuizAnswer[]>([])
  const [questionIndex, setQuestionIndex] = useState(0)
  const [selected, setSelected] = useState<string | null>(null)
  const [quizCategories, setQuizCategories] = useState<CategoryId[]>([])
  const [scope, setScope] = useState('All fields')
  const [showExit, setShowExit] = useState(false)

  useEffect(() => {
    const query = searchParams.get('category')
    if (isCategoryId(query)) setCategory(query)
  }, [searchParams])

  const scopedTerms = useMemo(() => {
    const fieldTerms =
      category === 'all'
        ? TERMS
        : TERMS.filter(
            (term) => term.category === category || term.alsoIn?.includes(category),
          )
    return tier === 'all' ? fieldTerms : fieldTerms.filter((term) => term.tier === tier)
  }, [category, tier])

  const average = quizAverage(quizHistory)
  const recentQuizzes = quizHistory.slice(0, 4)
  const available = Math.min(count, scopedTerms.length)
  const question = questions[questionIndex]
  const scoreSoFar = answers.filter((answer) => answer.correct).length

  function startQuiz(pool: Term[], requested: number, categories: CategoryId[], label: string) {
    if (pool.length === 0) {
      toast('No terms are available for that quiz. Try a different field or tier.', 'warning')
      return
    }
    const nextQuestions = generateQuiz(pool, TERMS, Math.min(requested, pool.length))
    setQuestions(nextQuestions)
    setAnswers([])
    setQuestionIndex(0)
    setSelected(null)
    setQuizCategories(categories)
    setScope(label)
    setPhase('active')
    setSearchParams(category === 'all' ? {} : { category }, { replace: true })
  }

  function startFromSetup() {
    startQuiz(
      scopedTerms,
      count,
      category === 'all' ? [] : [category],
      scopeLabel(category, tier),
    )
  }

  function choose(option: string) {
    if (!question || selected !== null) return
    setSelected(option)
    setAnswers((current) => [
      ...current,
      {
        question,
        chosen: option,
        correct: option === question.answer,
      },
    ])
  }

  function advance() {
    if (selected === null || !question) return
    if (questionIndex + 1 >= questions.length) {
      applyQuiz(answers, quizCategories)
      setPhase('summary')
      return
    }
    setQuestionIndex((current) => current + 1)
    setSelected(null)
  }

  useEffect(() => {
    if (phase !== 'active') return
    function handleKeyDown(event: KeyboardEvent) {
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const target = event.target as HTMLElement | null
      if (target && ['input', 'textarea', 'select'].includes(target.tagName.toLowerCase())) return

      if (selected === null && /^[1-4]$/.test(event.key)) {
        const option = question?.options[Number(event.key) - 1]
        if (option) {
          event.preventDefault()
          choose(option)
        }
      } else if (selected !== null && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault()
        advance()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [phase, selected, question, questionIndex, answers, questions.length, quizCategories, applyQuiz])

  if (phase === 'active' && question) {
    const progressPct = (questionIndex / questions.length) * 100
    const questionTerm = TERM_BY_ID.get(question.termId)
    const categoryMeta = questionTerm ? CATEGORY_BY_ID[questionTerm.category] : undefined
    const kindLabel =
      question.kind === 'term-to-definition' ? 'Term → definition' : 'Definition → term'
    const isCorrect = selected === question.answer

    return (
      <div className="quiz-page quiz-page--active">
        <header className="quiz-session-header">
          <button type="button" className="quiz-back" onClick={() => setShowExit(true)}>
            <ArrowLeft size={17} /> Leave quiz
          </button>
          <div className="quiz-session-header__center">
            <span className="quiz-pill">
              <CircleQuestionMark size={14} /> {scope}
            </span>
            <span>
              {questionIndex + 1} / {questions.length}
            </span>
          </div>
          <span className="quiz-session-header__score">
            <Check size={15} aria-hidden="true" /> {scoreSoFar}
          </span>
        </header>

        <div className="quiz-progress" aria-hidden="true">
          <span style={{ width: `${progressPct}%` }} />
        </div>

        <main className="quiz-card">
          <div className="quiz-card__meta">
            <span className="quiz-kind">{kindLabel}</span>
            {categoryMeta ? (
              <span className={`quiz-category quiz-category--${categoryMeta.accent}`}>
                <CategoryIcon name={categoryMeta.icon} size={14} />
                {categoryMeta.shortName}
              </span>
            ) : null}
            <span className="quiz-card__number">
              Question {String(questionIndex + 1).padStart(2, '0')}
            </span>
          </div>

          <div className="quiz-card__prompt">
            <span className="quiz-prompt-label">
              {question.kind === 'term-to-definition'
                ? 'Choose the precise definition'
                : 'Choose the term for this definition'}
            </span>
            {question.kind === 'term-to-definition' ? (
              <h1>{question.prompt}</h1>
            ) : (
              <p className="quiz-definition-prompt">{question.prompt}</p>
            )}
          </div>

          <div className="quiz-options" role="group" aria-label="Answer choices">
            {question.options.map((option, index) => {
              const isAnswer = option === question.answer
              const isChosen = option === selected
              const state =
                selected === null
                  ? ''
                  : isAnswer
                    ? 'is-correct'
                    : isChosen
                      ? 'is-wrong'
                      : 'is-muted'
              return (
                <button
                  type="button"
                  key={`${question.id}-${option}`}
                  className={`quiz-option ${state}`}
                  onClick={() => choose(option)}
                  disabled={selected !== null}
                  aria-label={`Option ${index + 1}: ${option}`}
                >
                  <span className="quiz-option__key">{index + 1}</span>
                  <span className="quiz-option__text">{option}</span>
                  {selected !== null && isAnswer ? (
                    <Check className="quiz-option__icon" size={18} aria-hidden="true" />
                  ) : null}
                  {selected !== null && isChosen && !isAnswer ? (
                    <X className="quiz-option__icon" size={18} aria-hidden="true" />
                  ) : null}
                </button>
              )
            })}
          </div>

          {selected !== null ? (
            <div className={`quiz-feedback ${isCorrect ? 'quiz-feedback--correct' : 'quiz-feedback--wrong'}`}>
              <span className="quiz-feedback__icon" aria-hidden="true">
                {isCorrect ? <Check size={18} /> : <X size={18} />}
              </span>
              <div className="quiz-feedback__body">
                <strong>{isCorrect ? 'Correct.' : `Not quite — the answer is “${question.answer}”.`}</strong>
                <p>{question.definition}</p>
              </div>
            </div>
          ) : null}

          <footer className="quiz-card__footer">
            <span className="quiz-card__hint">
              {selected === null
                ? 'Select an answer, or press 1–4.'
                : 'Read the definition once more, then continue.'}
            </span>
            {selected !== null ? (
              <button type="button" className="button button--primary" onClick={advance}>
                {questionIndex + 1 >= questions.length ? 'See results' : 'Next question'}
                <ArrowRight size={17} />
              </button>
            ) : (
              <span className="quiz-card__waiting">
                <Clock3 size={15} /> {question.options.length} choices
              </span>
            )}
          </footer>
        </main>

        <ConfirmDialog
          open={showExit}
          title="Leave this quiz?"
          description="This quiz is scored at the end. Leaving now discards the answers you have given so far."
          confirmLabel="Discard quiz"
          tone="warning"
          onConfirm={() => {
            setShowExit(false)
            setQuestions([])
            setAnswers([])
            setQuestionIndex(0)
            setSelected(null)
            setPhase('setup')
          }}
          onCancel={() => setShowExit(false)}
        />
      </div>
    )
  }

  if (phase === 'summary') {
    const correct = answers.filter((answer) => answer.correct).length
    const missed = answers.filter((answer) => !answer.correct)
    const percentage = answers.length ? Math.round((correct / answers.length) * 100) : 0
    const missedTerms = missed
      .map((answer) => TERM_BY_ID.get(answer.question.termId))
      .filter((term): term is Term => Boolean(term))

    function retryMissed() {
      if (missedTerms.length === 0) return
      const uniqueCategories = [
        ...new Set(missedTerms.map((term) => term.category)),
      ] as CategoryId[]
      startQuiz(missedTerms, missedTerms.length, uniqueCategories, 'Missed terms')
    }

    return (
      <div className="quiz-page quiz-page--summary">
        <div className="quiz-summary">
          <div className="quiz-summary__top">
            <div>
              <p className="eyebrow">Quiz complete</p>
              <h1>
                {percentage === 100
                  ? 'A clean sweep.'
                  : percentage >= 80
                    ? 'The vocabulary is holding.'
                    : percentage >= 60
                      ? 'A solid pass with visible gaps.'
                      : 'Now the gaps have names.'}
              </h1>
              <p>
                {percentage === 100
                  ? 'Every answer landed. These terms are now marked in your progress and will return on the review schedule.'
                  : 'Each miss was recorded against its term, so the flashcards and trouble-spot drill can target it next.'}
              </p>
            </div>
            <ScoreRing score={correct} total={answers.length} label="correct" size={154} />
          </div>

          <div className="quiz-summary__stats">
            <div><strong>{answers.length}</strong><span>questions</span></div>
            <div><strong>{correct}</strong><span>correct</span></div>
            <div><strong>{missed.length}</strong><span>to revisit</span></div>
            <div><strong>{scope}</strong><span>scope</span></div>
          </div>

          {missed.length > 0 ? (
            <section className="quiz-summary__review">
              <div className="quiz-summary__review-head">
                <div>
                  <p className="eyebrow">Worth another pass</p>
                  <h2>The answers you missed.</h2>
                </div>
                <span className="quiz-missed-count">{missed.length}</span>
              </div>
              <div className="quiz-review-list">
                {missed.map((answer) => {
                  const term = TERM_BY_ID.get(answer.question.termId)
                  if (!term) return null
                  return (
                    <Link to={`/terms/${term.id}`} className="quiz-review-row" key={answer.question.id}>
                      <span className="quiz-review-row__mark">
                        <X size={14} />
                      </span>
                      <span className="quiz-review-row__body">
                        <strong>{term.term}</strong>
                        <span>
                          You chose “{answer.chosen}” · Correct: “{answer.question.answer}”
                        </span>
                      </span>
                      <ArrowRight size={15} aria-hidden="true" />
                    </Link>
                  )
                })}
              </div>
            </section>
          ) : (
            <div className="quiz-summary__clean">
              <Trophy size={20} aria-hidden="true" />
              <p>No misses. Raise the difficulty with a bigger set or a deeper tier.</p>
            </div>
          )}

          <section className="quiz-summary__log">
            <div className="quiz-summary__log-head">
              <p className="eyebrow">Question by question</p>
              <span>{correct} of {answers.length} correct</span>
            </div>
            <ol>
              {answers.map((answer, index) => {
                const term = TERM_BY_ID.get(answer.question.termId)
                return (
                  <li key={answer.question.id} className={answer.correct ? 'is-correct' : 'is-wrong'}>
                    <span className="quiz-log__number">{String(index + 1).padStart(2, '0')}</span>
                    <span className="quiz-log__body">
                      <strong>{term?.term ?? answer.question.prompt.slice(0, 60)}</strong>
                      <span>{answer.question.answer}</span>
                    </span>
                    {answer.correct ? (
                      <Check size={16} aria-label="Correct" />
                    ) : (
                      <X size={16} aria-label="Incorrect" />
                    )}
                  </li>
                )
              })}
            </ol>
          </section>

          <div className="quiz-summary__actions">
            {missedTerms.length > 0 ? (
              <button type="button" className="button button--primary" onClick={retryMissed}>
                <RotateCcw size={16} /> Retry the {missedTerms.length} missed
              </button>
            ) : null}
            <button type="button" className="button button--ghost" onClick={() => setPhase('setup')}>
              Build another quiz
            </button>
            {missedTerms.length > 0 ? (
              <Link to="/flashcards?mode=trouble" className="text-link">
                Drill trouble spots <ArrowRight size={14} />
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="quiz-page quiz-page--setup">
      <header className="page-heading quiz-heading">
        <p className="eyebrow">Quiz mode</p>
        <div className="page-heading__row">
          <div>
            <h1>Retrieval, not recognition.</h1>
            <p>
              Answer from memory. Every quiz updates your per-term recall record, so misses
              feed directly into flashcards and the trouble-spot drill.
            </p>
          </div>
          <div className="page-heading__stat">
            <strong>{TERMS.length}</strong>
            <span>terms in scope</span>
          </div>
        </div>
      </header>

      <div className="quiz-setup-grid">
        <section className="quiz-plan">
          <div className="quiz-plan__head">
            <div>
              <p className="eyebrow">Build a quiz</p>
              <h2>Choose what to test.</h2>
            </div>
            <span className="quiz-plan__icon"><CircleQuestionMark size={22} /></span>
          </div>

          <label className="quiz-field">
            <span>Field</span>
            <span className="select-field__control select-field__control--quiz">
              <select
                value={category}
                onChange={(event) => {
                  const value = event.target.value
                  setCategory(isCategoryId(value) ? value : 'all')
                }}
              >
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

          <div className="quiz-field">
            <span>Priority</span>
            <div className="segmented segmented--quiz">
              {TIER_OPTIONS.map((option) => (
                <button
                  type="button"
                  key={option.value}
                  className={tier === option.value ? 'is-active' : ''}
                  aria-pressed={tier === option.value}
                  onClick={() => setTier(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="quiz-field">
            <span>Questions</span>
            <div className="segmented segmented--quiz">
              {QUIZ_SIZES.map((value) => (
                <button
                  type="button"
                  key={value}
                  className={count === value ? 'is-active' : ''}
                  aria-pressed={count === value}
                  onClick={() => setCount(value)}
                >
                  {value}
                </button>
              ))}
            </div>
          </div>

          <div className="quiz-plan__summary">
            <div><span>Scope</span><strong>{scopeLabel(category, tier)}</strong></div>
            <div><span>Available terms</span><strong>{scopedTerms.length}</strong></div>
            <div><span>Quiz length</span><strong>{available}</strong></div>
            <div><span>Format</span><strong>Alternating</strong></div>
          </div>

          <button
            type="button"
            className="button button--primary button--wide"
            onClick={startFromSetup}
            disabled={scopedTerms.length === 0}
          >
            Start quiz <ArrowRight size={17} />
          </button>
          {scopedTerms.length === 0 ? (
            <p className="quiz-plan__empty">
              No terms match that combination. Try all tiers or a broader field.
            </p>
          ) : null}
        </section>

        <aside className="quiz-aside">
          <section className="quiz-aside__card quiz-aside__card--tip">
            <span className="quiz-aside__icon"><Sparkles size={19} /></span>
            <div>
              <p className="eyebrow">Why it works</p>
              <h2>Answer first. Look second.</h2>
              <p>
                The effort of retrieving a definition is what strengthens memory. If you are
                guessing, choose anyway — a miss becomes a useful signal, not a failure.
              </p>
            </div>
          </section>

          <section className="quiz-aside__card">
            <div className="quiz-aside__head">
              <div>
                <p className="eyebrow">Your record</p>
                <h2>{average === null ? 'No history yet.' : `${average}% average.`}</h2>
              </div>
              <span className="quiz-aside__count">{quizHistory.length}</span>
            </div>
            {recentQuizzes.length > 0 ? (
              <div className="quiz-recent">
                {recentQuizzes.map((entry) => {
                  const pct = Math.round((entry.score / entry.total) * 100)
                  const label = entry.categories.length
                    ? entry.categories.map((id) => CATEGORY_BY_ID[id].shortName).join(' · ')
                    : 'All fields'
                  return (
                    <div className="quiz-recent__row" key={entry.id}>
                      <span className="quiz-recent__date">{formatDate(entry.date)}</span>
                      <span className="quiz-recent__body">
                        <strong>{entry.score}/{entry.total}</strong>
                        <span>{label}</span>
                      </span>
                      <span className={`quiz-recent__pct ${pct < 60 ? 'is-low' : ''}`}>{pct}%</span>
                    </div>
                  )
                })}
              </div>
            ) : (
              <p className="quiz-aside__empty">
                Your first quiz will appear here. Results feed the review schedule even when the
                score is low.
              </p>
            )}
            <Link to="/progress" className="text-link quiz-aside__link">
              Full progress report <ArrowRight size={14} />
            </Link>
          </section>

          <section className="quiz-aside__card quiz-aside__card--focus">
            <span className="quiz-aside__icon"><Target size={19} /></span>
            <div>
              <p className="eyebrow">Targeted practice</p>
              <h2>Miss it twice, see it more.</h2>
              <p>
                Terms missed repeatedly collect in your trouble spots. The danger is not a wrong
                answer; it is an answer you never check.
              </p>
            </div>
          </section>
        </aside>
      </div>

      <footer className="page-footer">
        <span>{TERMS.length} terms · {quizHistory.length} quizzes recorded</span>
        <span>Every answer updates your local recall record</span>
      </footer>
    </div>
  )
}
