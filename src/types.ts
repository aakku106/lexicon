export const CATEGORY_IDS = [
  'foundations',
  'algorithms',
  'hashing',
  'operating-systems',
  'go-concurrency',
  'networking',
  'http-backend',
  'databases',
  'distributed-systems',
  'caching',
  'architecture',
  'patterns',
  'reliability',
  'security',
  'git',
  'testing',
  'web-architecture',
  'cloud',
  'devops',
  'ai',
] as const

export type CategoryId = (typeof CATEGORY_IDS)[number]

export type Tier = 1 | 2 | 3

export type IconName =
  | 'layers'
  | 'binary'
  | 'fingerprint'
  | 'cpu'
  | 'workflow'
  | 'network'
  | 'server'
  | 'database'
  | 'share'
  | 'zap'
  | 'building'
  | 'puzzle'
  | 'activity'
  | 'shield'
  | 'git-branch'
  | 'flask'
  | 'globe'
  | 'cloud'
  | 'infinity'
  | 'sparkles'

export interface Category {
  id: CategoryId
  name: string
  shortName: string
  description: string
  icon: IconName
  accent: 'blue' | 'sage' | 'amber'
  order: number
}

export interface TermInput {
  term: string
  definition: string
  /** Extra categories this term belongs to, in addition to its primary category. */
  alsoIn?: CategoryId[]
  aliases?: string[]
  tier?: Tier
  /** Optional sub-group, e.g. Creational, Structural, Behavioral. */
  group?: string
  /** Why the concept exists / what problem it addresses. */
  purpose?: string
  /** A precise nuance, rule, or mental model worth remembering. */
  keyPoint?: string
  /** A concrete usage or scenario. */
  example?: string
}

export interface Term extends TermInput {
  id: string
  category: CategoryId
}

export interface TermProgress {
  status: 'new' | 'learning' | 'known'
  /** Successful reviews (Hard, Good or Easy). */
  reps: number
  lapses: number
  intervalDays: number
  ease: number
  dueAt: number | null
  lastReviewedAt: number | null
  seen: number
  correct: number
  missed: number
  lastMissedAt: number | null
}

export type ReviewRating = 'again' | 'hard' | 'good' | 'easy'

export interface DayActivity {
  reviews: number
  quiz: number
  learned: number
}

export interface QuizHistoryEntry {
  id: string
  date: number
  score: number
  total: number
  categories: CategoryId[]
  missedTermIds: string[]
}

export interface Preferences {
  name: string
  dailyGoal: number
  /** Maximum number of reviews in a smart session. */
  sessionSize: number
  showHints: boolean
  /** Multiplier for authored font sizes. 1.1 = 110%. */
  textScale: number
}

export interface FlashcardSessionCard {
  termId: string
  /** Whether this card was already re-shown after an Again rating. */
  retried: boolean
}

export interface FlashcardSession {
  id: string
  mode: 'smart' | 'trouble' | 'practice'
  category: CategoryId | 'all'
  cards: FlashcardSessionCard[]
  index: number
  startedAt: number
  /** termId -> number of cards rated correct at least once. */
  correctIds: string[]
  missedIds: string[]
  completed: boolean
}

export interface DistinctionItem {
  term?: string
  label: string
  text: string
}

export interface Distinction {
  id: string
  title: string
  topic: string
  summary: string
  items: DistinctionItem[]
  rule: string
}

export interface QuizQuestion {
  id: string
  termId: string
  kind: 'term-to-definition' | 'definition-to-term'
  prompt: string
  options: string[]
  answer: string
  definition: string
}

export interface QuizAnswer {
  question: QuizQuestion
  chosen: string
  correct: boolean
}
