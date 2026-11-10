import { Bookmark, BookmarkCheck } from 'lucide-react'
import { useStudy } from '../../context/StudyProvider'

export function BookmarkButton({
  termId,
  className = '',
  label,
}: {
  termId: string
  className?: string
  label?: string
}) {
  const { bookmarkSet, toggleBookmark } = useStudy()
  const active = bookmarkSet.has(termId)
  const hasLabel = Boolean(label)
  return (
    <button
      type="button"
      className={`icon-button bookmark-button ${hasLabel ? 'bookmark-button--labeled' : ''} ${active ? 'is-active' : ''} ${className}`.trim()}
      aria-pressed={active}
      aria-label={active ? 'Remove bookmark' : 'Save to bookmarks'}
      title={active ? 'Remove bookmark' : 'Save to bookmarks'}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        toggleBookmark(termId)
      }}
    >
      {active ? <BookmarkCheck size={18} /> : <Bookmark size={18} />}
      {label ? <span>{label}</span> : null}
    </button>
  )
}
