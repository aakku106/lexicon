import { useLayoutEffect, useMemo } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Flame, MessageSquarePlus, Search, Settings } from 'lucide-react'
import { useStudy } from '../../context/StudyProvider'
import { TERMS } from '../../data/catalog'
import { computeStats, computeStreak, streakLabel } from '../../lib/stats'
import { Brand } from './Brand'
import { CommandPalette } from './CommandPalette'
import { MOBILE_NAV_ITEMS, openSearch } from './nav'
import { Sidebar } from './Sidebar'

function ScrollToTop() {
  const { pathname } = useLocation()
  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])
  return null
}

export function AppShell() {
  const location = useLocation()
  const { progress, activity, bookmarks, prefs } = useStudy()
  const stats = useMemo(
    () => computeStats(TERMS, progress, activity, bookmarks, prefs.dailyGoal),
    [progress, activity, bookmarks, prefs.dailyGoal],
  )
  const streak = computeStreak(activity)
  const isFlashcards = location.pathname.startsWith('/flashcards')

  return (
    <div className="app-shell">
      <a className="skip-link" href="#main-content">
        Skip to content
      </a>
      <ScrollToTop />
      <Sidebar />

      <div className={`app-main ${isFlashcards ? 'app-main--flashcards' : ''}`}>
        <header className="mobile-header">
          <Brand compact />
          <div className="mobile-header__actions">
            <Link to="/progress" className="mobile-streak" aria-label={`${streakLabel(streak)} study streak`}>
              <Flame size={17} aria-hidden="true" />
              <span>{streak}</span>
            </Link>
            <button type="button" className="icon-button" onClick={openSearch} aria-label="Search vocabulary">
              <Search size={20} />
            </button>
            <NavLink to="/feedback" className="icon-button" aria-label="Feedback and suggestions">
              <MessageSquarePlus size={20} />
            </NavLink>
            <NavLink to="/settings" className="icon-button" aria-label="Settings">
              <Settings size={20} />
            </NavLink>
          </div>
        </header>

        <main key={location.pathname} id="main-content" className="page">
          <Outlet />
        </main>

        <nav className="mobile-nav" aria-label="Primary navigation">
          {MOBILE_NAV_ITEMS.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) => `mobile-nav__link ${isActive ? 'is-active' : ''}`}
              >
                <span className="mobile-nav__icon">
                  <Icon size={20} strokeWidth={1.9} aria-hidden="true" />
                  {item.to === '/flashcards' && stats.dueTerms > 0 ? (
                    <span className="mobile-nav__count">{stats.dueTerms}</span>
                  ) : null}
                </span>
                <span>{item.label}</span>
              </NavLink>
            )
          })}
        </nav>
      </div>

      <CommandPalette />
    </div>
  )
}
