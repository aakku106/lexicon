export function ProgressBar({
  value,
  tone = 'blue',
  label,
  size = 'md',
}: {
  value: number
  tone?: 'blue' | 'sage' | 'amber' | 'slate'
  label?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const clamped = Math.max(0, Math.min(100, value))
  return (
    <div
      className={`progress progress--${tone} progress--${size}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(clamped)}
      aria-label={label}
    >
      <span className="progress__fill" style={{ width: `${clamped}%` }} />
    </div>
  )
}
