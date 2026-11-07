export function ScoreRing({
  score,
  total,
  label = 'score',
  size = 148,
}: {
  score: number
  total: number
  label?: string
  size?: number
}) {
  const percentage = total ? Math.round((score / total) * 100) : 0
  const radius = 60
  const circumference = 2 * Math.PI * radius
  const dash = (percentage / 100) * circumference
  return (
    <div className="score-ring" style={{ width: size, height: size }}>
      <svg viewBox="0 0 140 140" width={size} height={size} aria-hidden="true">
        <circle className="score-ring__track" cx="70" cy="70" r={radius} />
        <circle
          className="score-ring__value"
          cx="70"
          cy="70"
          r={radius}
          strokeDasharray={`${dash} ${circumference - dash}`}
          transform="rotate(-90 70 70)"
        />
      </svg>
      <div className="score-ring__label">
        <strong>{percentage}%</strong>
        <span>{label}</span>
      </div>
    </div>
  )
}
