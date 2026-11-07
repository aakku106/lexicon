export function Highlight({ text, query }: { text: string; query?: string }) {
  const trimmed = query?.trim()
  if (!trimmed || trimmed.length < 2) return <>{text}</>
  const escaped = trimmed.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  let parts: string[]
  try {
    parts = text.split(new RegExp(`(${escaped})`, 'ig'))
  } catch {
    return <>{text}</>
  }
  return (
    <>
      {parts.map((part, index) =>
        part.toLowerCase() === trimmed.toLowerCase() ? (
          <mark key={`${part}-${index}`}>{part}</mark>
        ) : (
          part
        ),
      )}
    </>
  )
}
