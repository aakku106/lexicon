import { useState, type ChangeEvent, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Mail,
  MessageSquarePlus,
  Send,
  ShieldCheck,
} from 'lucide-react'
import { useStudy } from '../context/StudyProvider'
import { useToast } from '../context/ToastProvider'
import {
  FEEDBACK_EMAIL,
  FEEDBACK_ENDPOINT,
  FEEDBACK_TYPES,
  type FeedbackType,
  buildFeedbackMailtoUrl,
} from '../lib/feedback'

type FormStatus = 'idle' | 'sending' | 'sent' | 'error'

export function FeedbackPage() {
  const { prefs } = useStudy()
  const { toast } = useToast()
  const [searchParams] = useSearchParams()

  const [type, setType] = useState<FeedbackType>(() => {
    const fromUrl = searchParams.get('type')
    return FEEDBACK_TYPES.some((t) => t.value === fromUrl) ? (fromUrl as FeedbackType) : 'correction'
  })
  const [termOrTopic, setTermOrTopic] = useState(() => searchParams.get('term') ?? '')
  const [message, setMessage] = useState('')
  const [name, setName] = useState(() => prefs.name ?? '')
  const [email, setEmail] = useState('')
  const [honey, setHoney] = useState('')
  const [status, setStatus] = useState<FormStatus>('idle')
  const [errorMessage, setErrorMessage] = useState('')

  const canSubmit = message.trim().length >= 20

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!canSubmit || status === 'sending') return
    if (honey) {
      setStatus('sent')
      return
    }
    setStatus('sending')
    setErrorMessage('')

    try {
      const subject = FEEDBACK_TYPES.find((t) => t.value === type)?.label ?? 'Feedback'
      const res = await fetch(FEEDBACK_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          _subject: `Lexicon ${subject}: ${termOrTopic || 'general'}`,
          _template: 'table',
          _captcha: 'false',
          _honey: honey,
          type,
          term_or_topic: termOrTopic,
          message,
          name: name || undefined,
          email: email || undefined,
          _replyto: email || undefined,
          submitted_at: new Date().toLocaleString(),
        }),
      })
      if (!res.ok) throw new Error('Network response was not ok')
      const data = await res.json().catch(() => null)
      const success = data?.success === true || data?.success === 'true' || data?.message
      if (success) {
        setStatus('sent')
        toast('Feedback sent — thank you.', 'success')
      } else {
        throw new Error(data?.message ?? 'Submission was not accepted')
      }
    } catch {
      setStatus('error')
      setErrorMessage(
        "We couldn't send the note automatically. You can still email it directly using the link below.",
      )
    }
  }

  function handleInputChange(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name: fieldName, value } = event.target
    switch (fieldName) {
      case 'type':
        setType(value as FeedbackType)
        break
      case 'termOrTopic':
        setTermOrTopic(value)
        break
      case 'message':
        setMessage(value)
        break
      case 'name':
        setName(value)
        break
      case 'email':
        setEmail(value)
        break
    }
  }

  const mailtoUrl = buildFeedbackMailtoUrl(type, termOrTopic || undefined, message || undefined)

  return (
    <div className="feedback-page">
      <header className="page-heading">
        <p className="eyebrow">Help improve the library</p>
        <div className="page-heading__row">
          <div>
            <h1>Feedback & ideas</h1>
            <p>
              Spotted a typo, a fuzzy definition, or a missing topic? Send a note and
              it will be emailed directly to the maintainer. No account required.
            </p>
          </div>
        </div>
      </header>

      <div className="feedback-layout">
        <section className="feedback-form-card">
          {status === 'sent' ? (
            <div className="feedback-success">
              <div className="feedback-success__icon">
                <ShieldCheck size={28} />
              </div>
              <h2>Sent successfully</h2>
              <p>Your feedback has been delivered. We read every note.</p>
              <button
                type="button"
                className="button button--primary button--small"
                onClick={() => {
                  setStatus('idle')
                  setMessage('')
                  setTermOrTopic('')
                }}
              >
                <Send size={15} /> Send another
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div className="feedback-field">
                <label htmlFor="type" className="feedback-label">
                  What kind of note is this?
                </label>
                <select
                  id="type"
                  name="type"
                  value={type}
                  onChange={handleInputChange}
                  className="feedback-select"
                >
                  {FEEDBACK_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>

              <div className="feedback-field">
                <label htmlFor="termOrTopic" className="feedback-label">
                  Term or topic (optional)
                </label>
                <input
                  id="termOrTopic"
                  name="termOrTopic"
                  type="text"
                  value={termOrTopic}
                  onChange={handleInputChange}
                  placeholder="e.g. Consistent hashing"
                  className="feedback-input"
                  aria-describedby="term-hint"
                />
                <small id="term-hint">The term you saw, or a new one you want to suggest.</small>
              </div>

              <div className="feedback-field">
                <label htmlFor="message" className="feedback-label">
                  Your message
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={message}
                  onChange={handleInputChange}
                  rows={6}
                  placeholder="Describe the correction, improvement, or new term in detail…"
                  className="feedback-textarea"
                  aria-describedby="message-hint"
                />
                <small id="message-hint">
                  {message.length < 20 ? `At least 20 characters (${message.length}/20)` : 'Ready to send'}
                </small>
              </div>

              <div className="feedback-field">
                <label htmlFor="name" className="feedback-label">
                  Your name (optional)
                </label>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={name}
                  onChange={handleInputChange}
                  placeholder="Jane Doe"
                  className="feedback-input"
                />
              </div>

              <div className="feedback-field">
                <label htmlFor="email" className="feedback-label">
                  Your email (optional)
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={email}
                  onChange={handleInputChange}
                  placeholder="you@example.com"
                  className="feedback-input"
                />
                <small>Used only to reply if you would like a response.</small>
              </div>

              <input
                type="text"
                name="website"
                value={honey}
                onChange={(e) => setHoney(e.target.value)}
                tabIndex={-1}
                autoComplete="off"
                style={{ position: 'absolute', left: '-9999px' }}
                aria-hidden="true"
              />

              {status === 'error' && (
                <div className="feedback-error">
                  <p>{errorMessage}</p>
                  <a href={mailtoUrl} className="button button--ghost button--small" target="_blank" rel="noopener">
                    <Mail size={14} /> Open in email instead
                  </a>
                </div>
              )}

              <button
                type="submit"
                className={`button button--primary feedback-submit ${!canSubmit ? 'is-disabled' : ''}`}
                disabled={!canSubmit || status === 'sending'}
              >
                {status === 'sending' ? (
                  <>
                    <span className="spinner" aria-hidden="true" />
                    Sending…
                  </>
                ) : (
                  <>
                    <MessageSquarePlus size={15} /> Send feedback
                  </>
                )}
              </button>
            </form>
          )}
        </section>

        <aside className="feedback-info">
          <div className="feedback-info__card">
            <div className="feedback-info__icon">
              <MessageSquarePlus size={22} />
            </div>
            <h3>What happens next?</h3>
            <ul>
              <li>Your note goes straight to <code>{FEEDBACK_EMAIL}</code> via FormSubmit.</li>
              <li>The first submission triggers a one-time activation email to the owner — after that, notes arrive instantly.</li>
              <li>We never share your email with anyone else.</li>
            </ul>
          </div>

          <div className="feedback-info__card">
            <div className="feedback-info__icon">
              <ShieldCheck size={22} />
            </div>
            <h3>Privacy</h3>
            <p>
              Lexicon is local-first. Your study data never leaves this browser. Only the
              feedback you choose to send is transmitted, and only the fields you fill in
              are included in the email.
            </p>
          </div>

          <div className="feedback-info__card feedback-info__card--direct">
            <a href={mailtoUrl} className="button button--ghost" target="_blank" rel="noopener">
              <Mail size={17} /> Email directly
            </a>
            <p className="feedback-info__direct-note">
              Opens your mail app with the same details prefilled.
            </p>
          </div>
        </aside>
      </div>
    </div>
  )
}