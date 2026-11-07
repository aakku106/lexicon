import { Link, NavLink } from 'react-router-dom'
import { Flame, Search, Settings } from 'lucide-react'
import { useMemo } from 'react'
import { useStudy } from '../../context/StudyProvider'
import { TERMS } from '../../data/catalog'
import { computeStats, computeStreak, streakLabel } from '../../lib/stats'
import { Brand } from './Brand'
import { NAV_ITEMS, openSearch } from './nav'
import { ProgressBar } from '../ui/ProgressBar'

function NavGroup({
  label,
  group,
  dueCount,
}: {
  label: string
  group: 'learn' | 'insights'
  dueCount: number
}) {
  const items = NAV_ITEMS.filter((item) => item.group === group)
  return (
    <div className="sidebar__group">
      <p className="sidebar__label">{label}</p>
      <nav className="sidebar__nav" aria-label={label}>
        {items.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `sidebar-link ${isActive ? 'is-active' : ''}`}
            >
              <Icon size={19} strokeWidth={1.8} aria-hidden="true" />
              <span>{item.label}</span>
              {item.to === '/flashcards' && dueCount > 0 ? (
                <span className="sidebar-link__count">{dueCount}</span>
              ) : null}
            </NavLink>
          )
        })}
      </nav>
    </div>
  )
}

export function Sidebar() {
  const { progress, activity, bookmarks, prefs } = useStudy()
  const stats = useMemo(
    () => computeStats(TERMS, progress, activity, bookmarks, prefs.dailyGoal),
    [progress, activity, bookmarks, prefs.dailyGoal],
  )
  const streak = computeStreak(activity)
  const dailyPct = Math.min(100, Math.round((stats.todayReps / Math.max(1, prefs.dailyGoal)) * 100))

  return (
    <aside className="sidebar">
      <div className="sidebar__inner">
        <Brand />

        <button type="button" className="sidebar-search" onClick={openSearch}>
          <Search size={17} aria-hidden="true" />
          <span>Search vocabulary</span>
          <kbd>/</kbd>
        </button>

        <div className="sidebar__groups">
          <NavGroup label="Learn" group="learn" dueCount={stats.dueTerms} />
          <NavGroup label="Insights" group="insights" dueCount={stats.dueTerms} />
        </div>

        <div className="sidebar__bottom">
          <Link to="/progress" className="sidebar-streak">
            <span className="sidebar-streak__icon">
              <Flame size={19} aria-hidden="true" />
            </span>
            <span className="sidebar-streak__body">
              <span className="sidebar-streak__top">
                <strong>{streakLabel(streak)}</strong>
                <span>
                  {stats.todayReps}/{prefs.dailyGoal} today
                </span>
              </span>
              <ProgressBar value={dailyPct} tone="amber" size="sm" label="Daily goal progress" />
            </span>
          </Link>

          <NavLink
            to="/settings"
            className={({ isActive }) => `sidebar-link sidebar-link--settings ${isActive ? 'is-active' : ''}`}
          >
            <Settings size={19} strokeWidth={1.8} aria-hidden="true" />
            <span>Settings</span>
          </NavLink>

          <p className="sidebar__note">
            Your progress lives in this browser.
            <br />
            No account. No cloud.
          </p>
        </div>
      </div>
    </aside>
  )
}
