export const FEEDBACK_EMAIL = 'aakku@adarashagaihre.com.np'

export const FEEDBACK_ENDPOINT = `https://formsubmit.co/ajax/${FEEDBACK_EMAIL}`

export const FEEDBACK_TYPES = [
  { value: 'correction', label: 'A correction or typo' },
  { value: 'improvement', label: 'An improvement to an existing entry' },
  { value: 'new-term', label: 'Suggest a new term or topic' },
  { value: 'bug', label: 'A bug in the site' },
  { value: 'other', label: 'Something else' },
] as const

export type FeedbackType = typeof FEEDBACK_TYPES[number]['value']

export function buildFeedbackSubject(type: FeedbackType, termOrTopic?: string): string {
  const label = FEEDBACK_TYPES.find((t) => t.value === type)?.label ?? 'Feedback'
  return termOrTopic ? `Lexicon ${label}: ${termOrTopic}` : `Lexicon ${label}`
}

export function buildFeedbackMailtoUrl(type: FeedbackType, termOrTopic?: string, message?: string): string {
  const subject = encodeURIComponent(buildFeedbackSubject(type, termOrTopic))
  const bodyLines = [
    `Type: ${FEEDBACK_TYPES.find((t) => t.value === type)?.label ?? type}`,
    termOrTopic ? `Term or topic: ${termOrTopic}` : '',
    message ? `Message:\n${message}` : '',
    '',
    'Sent from Lexicon feedback page.',
  ].filter(Boolean).join('\n')
  const body = encodeURIComponent(bodyLines)
  return `mailto:${FEEDBACK_EMAIL}?subject=${subject}&body=${body}`
}