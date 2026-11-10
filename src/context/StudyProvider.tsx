import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type ReactNode,
} from 'react'
import type {
  DayActivity,
  FlashcardSession,
  Preferences,
  QuizAnswer,
  QuizHistoryEntry,
  ReviewRating,
  TermProgress,
} from '../types'
import {
  STORAGE_KEYS,
  clearAllData,
  clearStudyData,
  usePersistentState,
} from '../lib/storage'
import {
  applyQuizOutcome,
  markAsKnown,
  markAsLearning,
  reviewProgress,
} from '../lib/srs'
import { toDateKey } from '../lib/date'
import {
  TEXT_SCALE_DEFAULT,
  applyTextScale,
  normalizeTextScale,
} from '../lib/textScale'

export const DEFAULT_PREFERENCES: Preferences = {
  name: '',
  dailyGoal: 10,
  sessionSize: 20,
  showHints: true,
  textScale: TEXT_SCALE_DEFAULT,
}

interface StudyContextValue {
  progress: Record<string, TermProgress>
  bookmarks: string[]
  bookmarkSet: Set<string>
  notes: Record<string, string>
  activity: Record<string, DayActivity>
  quizHistory: QuizHistoryEntry[]
  prefs: Preferences
  flashcardSession: FlashcardSession | null
  rateTerm: (termId: string, rating: ReviewRating) => void
  applyQuiz: (answers: QuizAnswer[], categories: QuizHistoryEntry['categories']) => void
  toggleBookmark: (termId: string) => void
  setNote: (termId: string, note: string) => void
  setKnown: (termId: string, known: boolean) => void
  updatePrefs: (patch: Partial<Preferences>) => void
  setFlashcardSession: (
    value: FlashcardSession | null | ((previous: FlashcardSession | null) => FlashcardSession | null),
  ) => void
  resetLearning: () => void
  resetAll: () => void
}

const StudyContext = createContext<StudyContextValue | null>(null)

function bumpActivity(
  activity: Record<string, DayActivity>,
  patch: Partial<DayActivity>,
  now = Date.now(),
): Record<string, DayActivity> {
  const key = toDateKey(now)
  const current = activity[key] ?? { reviews: 0, quiz: 0, learned: 0 }
  return {
    ...activity,
    [key]: {
      reviews: current.reviews + (patch.reviews ?? 0),
      quiz: current.quiz + (patch.quiz ?? 0),
      learned: current.learned + (patch.learned ?? 0),
    },
  }
}

export function StudyProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = usePersistentState<Record<string, TermProgress>>(
    STORAGE_KEYS.progress,
    {},
  )
  const [bookmarks, setBookmarks] = usePersistentState<string[]>(STORAGE_KEYS.bookmarks, [])
  const [notes, setNotesState] = usePersistentState<Record<string, string>>(STORAGE_KEYS.notes, {})
  const [activity, setActivity] = usePersistentState<Record<string, DayActivity>>(
    STORAGE_KEYS.activity,
    {},
  )
  const [quizHistory, setQuizHistory] = usePersistentState<QuizHistoryEntry[]>(
    STORAGE_KEYS.quizHistory,
    [],
  )
  const [storedPrefs, setPrefs] = usePersistentState<Preferences>(
    STORAGE_KEYS.prefs,
    DEFAULT_PREFERENCES,
  )
  const prefs = useMemo<Preferences>(
    () => ({
      ...DEFAULT_PREFERENCES,
      ...storedPrefs,
      textScale: normalizeTextScale(storedPrefs.textScale),
    }),
    [storedPrefs],
  )
  const [flashcardSession, setFlashcardSession] = usePersistentState<FlashcardSession | null>(
    STORAGE_KEYS.flashcardSession,
    null,
  )

  useEffect(() => {
    applyTextScale(prefs.textScale)
  }, [prefs.textScale])

  const bookmarkSet = useMemo(() => new Set(bookmarks), [bookmarks])

  const rateTerm = useCallback(
    (termId: string, rating: ReviewRating) => {
      const now = Date.now()
      const existing = progress[termId]
      const wasNew = !existing || (existing.seen === 0 && existing.status === 'new')
      setProgress((current) => ({
        ...current,
        [termId]: reviewProgress(current[termId], rating, now),
      }))
      setActivity((current) =>
        bumpActivity(current, { reviews: 1, learned: wasNew ? 1 : 0 }, now),
      )
    },
    [progress, setActivity, setProgress],
  )

  const applyQuiz = useCallback(
    (answers: QuizAnswer[], categories: QuizHistoryEntry['categories']) => {
      if (answers.length === 0) return
      const now = Date.now()
      const learned = answers.filter((answer) => {
        const existing = progress[answer.question.termId]
        return !existing || (existing.seen === 0 && existing.status === 'new')
      }).length
      setProgress((current) => {
        const next = { ...current }
        for (const answer of answers) {
          const existing = next[answer.question.termId]
          next[answer.question.termId] = applyQuizOutcome(existing, answer.correct, now)
        }
        return next
      })
      setActivity((current) =>
        bumpActivity(current, { quiz: answers.length, learned }, now),
      )
      const score = answers.filter((answer) => answer.correct).length
      const entry: QuizHistoryEntry = {
        id: `quiz-${now}`,
        date: now,
        score,
        total: answers.length,
        categories,
        missedTermIds: answers.filter((answer) => !answer.correct).map((answer) => answer.question.termId),
      }
      setQuizHistory((current) => [entry, ...current].slice(0, 100))
    },
    [progress, setActivity, setProgress, setQuizHistory],
  )

  const toggleBookmark = useCallback(
    (termId: string) => {
      setBookmarks((current) =>
        current.includes(termId) ? current.filter((id) => id !== termId) : [termId, ...current],
      )
    },
    [setBookmarks],
  )

  const setNote = useCallback(
    (termId: string, note: string) => {
      setNotesState((current) => {
        const next = { ...current }
        if (note.trim()) next[termId] = note
        else delete next[termId]
        return next
      })
    },
    [setNotesState],
  )

  const setKnown = useCallback(
    (termId: string, known: boolean) => {
      const now = Date.now()
      setProgress((current) => {
        const existing = current[termId]
        return {
          ...current,
          [termId]: known ? markAsKnown(existing, now) : markAsLearning(existing, now),
        }
      })
    },
    [setProgress],
  )

  const updatePrefs = useCallback(
    (patch: Partial<Preferences>) => {
      setPrefs((current) => {
        const next = { ...current, ...patch }
        if (patch.textScale !== undefined) {
          next.textScale = normalizeTextScale(patch.textScale)
        }
        return next
      })
    },
    [setPrefs],
  )

  const clearSession = useCallback(() => {
    setFlashcardSession(null)
  }, [setFlashcardSession])

  const resetLearning = useCallback(() => {
    clearStudyData()
    setProgress({})
    setBookmarks([])
    setNotesState({})
    setActivity({})
    setQuizHistory([])
    clearSession()
  }, [clearSession, setActivity, setBookmarks, setNotesState, setProgress, setQuizHistory])

  const resetAll = useCallback(() => {
    clearAllData()
    setProgress({})
    setBookmarks([])
    setNotesState({})
    setActivity({})
    setQuizHistory([])
    setPrefs(DEFAULT_PREFERENCES)
    clearSession()
  }, [
    clearSession,
    setActivity,
    setBookmarks,
    setNotesState,
    setPrefs,
    setProgress,
    setQuizHistory,
  ])

  const value = useMemo<StudyContextValue>(
    () => ({
      progress,
      bookmarks,
      bookmarkSet,
      notes,
      activity,
      quizHistory,
      prefs,
      flashcardSession,
      rateTerm,
      applyQuiz,
      toggleBookmark,
      setNote,
      setKnown,
      updatePrefs,
      setFlashcardSession,
      resetLearning,
      resetAll,
    }),
    [
      progress,
      bookmarks,
      bookmarkSet,
      notes,
      activity,
      quizHistory,
      prefs,
      flashcardSession,
      rateTerm,
      applyQuiz,
      toggleBookmark,
      setNote,
      setKnown,
      updatePrefs,
      setFlashcardSession,
      resetLearning,
      resetAll,
    ],
  )

  return <StudyContext.Provider value={value}>{children}</StudyContext.Provider>
}

export function useStudy(): StudyContextValue {
  const context = useContext(StudyContext)
  if (!context) {
    throw new Error('useStudy must be used inside StudyProvider')
  }
  return context
}
