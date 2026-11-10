export const TEXT_SCALE_DEFAULT = 1.1
export const TEXT_SCALE_MIN = 0.9
export const TEXT_SCALE_MAX = 1.4
export const TEXT_SCALE_STEP = 0.05

export function normalizeTextScale(value: unknown): number {
  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric)) return TEXT_SCALE_DEFAULT
  const bounded = Math.min(TEXT_SCALE_MAX, Math.max(TEXT_SCALE_MIN, numeric))
  return Math.round(bounded / TEXT_SCALE_STEP) * TEXT_SCALE_STEP
}

export function applyTextScale(value: number): void {
  if (typeof document === 'undefined') return
  document.documentElement.style.setProperty('--text-scale', String(normalizeTextScale(value)))
}

export function textScaleLabel(value: number): string {
  const percent = Math.round(normalizeTextScale(value) * 100)
  if (percent <= 95) return 'Compact'
  if (percent <= 105) return 'Default'
  if (percent <= 115) return 'Comfortable'
  if (percent <= 125) return 'Large'
  if (percent <= 135) return 'Extra large'
  return 'Largest'
}
