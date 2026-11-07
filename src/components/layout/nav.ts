import type { LucideIcon } from 'lucide-react'
import {
  BookOpen,
  ChartNoAxesColumn,
  CircleQuestionMark,
  GalleryVerticalEnd,
  House,
  Scale,
  Settings,
} from 'lucide-react'

export interface NavItem {
  to: string
  label: string
  shortLabel?: string
  icon: LucideIcon
  end?: boolean
  group: 'learn' | 'insights' | 'system'
}

export const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Home', icon: House, end: true, group: 'learn' },
  { to: '/library', label: 'Library', icon: BookOpen, group: 'learn' },
  { to: '/flashcards', label: 'Flashcards', icon: GalleryVerticalEnd, group: 'learn' },
  { to: '/quiz', label: 'Quiz', icon: CircleQuestionMark, group: 'learn' },
  { to: '/distinctions', label: 'Distinctions', icon: Scale, group: 'learn' },
  { to: '/progress', label: 'Progress', icon: ChartNoAxesColumn, group: 'insights' },
  { to: '/settings', label: 'Settings', icon: Settings, group: 'system' },
]

export const MOBILE_NAV_ITEMS = NAV_ITEMS.filter((item) =>
  ['/', '/library', '/flashcards', '/quiz', '/progress'].includes(item.to),
)

export function openSearch() {
  window.dispatchEvent(new CustomEvent('lexicon:search'))
}
