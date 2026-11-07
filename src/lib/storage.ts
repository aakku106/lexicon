import { useEffect, useRef, useState, useCallback } from 'react'

export const STORAGE_PREFIX = 'lexicon.v1'

export const STORAGE_KEYS = {
  progress: `${STORAGE_PREFIX}.progress`,
  bookmarks: `${STORAGE_PREFIX}.bookmarks`,
  notes: `${STORAGE_PREFIX}.notes`,
  activity: `${STORAGE_PREFIX}.activity`,
  quizHistory: `${STORAGE_PREFIX}.quizHistory`,
  prefs: `${STORAGE_PREFIX}.prefs`,
  flashcardSession: `${STORAGE_PREFIX}.flashcardSession`,
} as const

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS]

export function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback
  try {
    const raw = window.localStorage.getItem(key)
    if (raw === null) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function writeStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Quota or privacy-mode failures should not break the study session.
  }
}

export function removeStorage(key: string): void {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(key)
  } catch {
    // Ignore storage failures.
  }
}

/**
 * State that survives reloads and stays in sync across tabs.
 * The initial value is read once; updates are persisted automatically.
 */
export function usePersistentState<T>(
  key: string,
  initialValue: T,
): [T, (value: T | ((previous: T) => T)) => void, () => void] {
  const initialRef = useRef(initialValue)
  const [state, setState] = useState<T>(() => readStorage(key, initialRef.current))

  useEffect(() => {
    writeStorage(key, state)
  }, [key, state])

  useEffect(() => {
    function handleStorage(event: StorageEvent) {
      if (event.key !== key || event.storageArea !== window.localStorage) return
      if (event.newValue === null) {
        setState(initialRef.current)
        return
      }
      try {
        setState(JSON.parse(event.newValue) as T)
      } catch {
        // Ignore malformed external updates.
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [key])

  const update = useCallback(
    (value: T | ((previous: T) => T)) => {
      setState((previous) =>
        typeof value === 'function' ? (value as (previous: T) => T)(previous) : value,
      )
    },
    [],
  )

  const reset = useCallback(() => {
    removeStorage(key)
    setState(initialRef.current)
  }, [key])

  return [state, update, reset]
}

export interface ExportBundle {
  app: 'lexicon'
  version: 1
  exportedAt: number
  data: Record<string, unknown>
}

const EXPORTABLE_KEYS: StorageKey[] = [
  STORAGE_KEYS.progress,
  STORAGE_KEYS.bookmarks,
  STORAGE_KEYS.notes,
  STORAGE_KEYS.activity,
  STORAGE_KEYS.quizHistory,
  STORAGE_KEYS.prefs,
]

export function createExportBundle(): ExportBundle {
  const data: Record<string, unknown> = {}
  for (const key of EXPORTABLE_KEYS) {
    data[key] = readStorage(key, null)
  }
  return {
    app: 'lexicon',
    version: 1,
    exportedAt: Date.now(),
    data,
  }
}

export function validateImportBundle(value: unknown): value is ExportBundle {
  if (!value || typeof value !== 'object') return false
  const bundle = value as Partial<ExportBundle>
  return bundle.app === 'lexicon' && bundle.version === 1 && Boolean(bundle.data)
}

export function applyImportBundle(bundle: ExportBundle): { applied: number; skipped: number } {
  let applied = 0
  let skipped = 0
  for (const key of EXPORTABLE_KEYS) {
    const value = bundle.data[key]
    if (value === undefined || value === null) {
      skipped += 1
      continue
    }
    if (key === STORAGE_KEYS.bookmarks && !Array.isArray(value)) {
      skipped += 1
      continue
    }
    writeStorage(key, value)
    applied += 1
  }
  return { applied, skipped }
}

export function clearStudyData(): void {
  removeStorage(STORAGE_KEYS.progress)
  removeStorage(STORAGE_KEYS.bookmarks)
  removeStorage(STORAGE_KEYS.notes)
  removeStorage(STORAGE_KEYS.activity)
  removeStorage(STORAGE_KEYS.quizHistory)
  removeStorage(STORAGE_KEYS.flashcardSession)
}

export function clearAllData(): void {
  for (const key of Object.values(STORAGE_KEYS)) {
    removeStorage(key)
  }
}
