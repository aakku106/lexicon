import { useMemo, useRef, useState, type ChangeEvent } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  Bookmark,
  Database,
  Download,
  HardDrive,
  Mail,
  MessageSquarePlus,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Trash2,
  Type,
  Upload,
  UserRound,
} from 'lucide-react'
import { useStudy } from '../context/StudyProvider'
import { useToast } from '../context/ToastProvider'
import { TERMS } from '../data/catalog'
import { FEEDBACK_EMAIL } from '../lib/feedback'
import {
  TEXT_SCALE_DEFAULT,
  TEXT_SCALE_MAX,
  TEXT_SCALE_MIN,
  TEXT_SCALE_STEP,
  textScaleLabel,
} from '../lib/textScale'
import {
  STORAGE_KEYS,
  applyImportBundle,
  createExportBundle,
  validateImportBundle,
  type ExportBundle,
} from '../lib/storage'
import { toDateKey } from '../lib/date'
import { ProgressBar } from '../components/ui/ProgressBar'
import { ConfirmDialog } from '../components/ui/ConfirmDialog'

const GOAL_OPTIONS = [5, 10, 20, 30]
const SESSION_OPTIONS = [10, 20, 30]

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

type ResetMode = 'learning' | 'all'

interface PendingImport {
  bundle: ExportBundle
  fileName: string
}

export function SettingsPage() {
  const {
    progress,
    bookmarks,
    notes,
    quizHistory,
    prefs,
    updatePrefs,
    resetLearning,
    resetAll,
  } = useStudy()
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [pendingImport, setPendingImport] = useState<PendingImport | null>(null)
  const [resetMode, setResetMode] = useState<ResetMode | null>(null)

  const seenTerms = useMemo(
    () =>
      TERMS.filter((term) => {
        const entry = progress[term.id]
        return entry && (entry.seen > 0 || entry.status !== 'new')
      }).length,
    [progress],
  )
  const knownTerms = useMemo(
    () => TERMS.filter((term) => progress[term.id]?.status === 'known').length,
    [progress],
  )
  const textScalePct = Math.round(prefs.textScale * 100)

  // The provider persists state in an effect, so this is a display-time estimate.
  let usageBytes = 0
  for (const key of Object.values(STORAGE_KEYS)) {
    usageBytes += (window.localStorage.getItem(key)?.length ?? 0) * 2
  }

  function exportData() {
    const bundle = createExportBundle()
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = `lexicon-backup-${toDateKey()}.json`
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    URL.revokeObjectURL(url)
    toast('Backup downloaded. Keep it somewhere you will find again.', 'success')
  }

  function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (!file) return
    if (file.size > 5_000_000) {
      toast('That file is too large to be a Lexicon backup.', 'warning')
      return
    }
    file
      .text()
      .then((text) => {
        let parsed: unknown
        try {
          parsed = JSON.parse(text)
        } catch {
          toast('That file is not valid JSON.', 'warning')
          return
        }
        if (!validateImportBundle(parsed)) {
          toast('That is not a Lexicon version 1 backup.', 'warning')
          return
        }
        setPendingImport({ bundle: parsed, fileName: file.name })
      })
      .catch(() => {
        toast('The file could not be read.', 'warning')
      })
  }

  function confirmImport() {
    if (!pendingImport) return
    const result = applyImportBundle(pendingImport.bundle)
    setPendingImport(null)
    toast(`Imported ${result.applied} data sets. Reloading…`, 'success')
    window.setTimeout(() => window.location.reload(), 500)
  }

  function confirmReset() {
    if (resetMode === 'learning') {
      resetLearning()
      toast('Learning data cleared. Your preferences are intact.', 'success')
    } else if (resetMode === 'all') {
      resetAll()
      toast('Everything reset to a clean start.', 'success')
    }
    setResetMode(null)
  }

  return (
    <div className="settings-page">
      <header className="page-heading settings-heading">
        <p className="eyebrow">Preferences</p>
        <div className="page-heading__row">
          <div>
            <h1>Make the practice fit you.</h1>
            <p>
              Lexicon has no account and no server. These settings, like your progress, live
              only in this browser — export a backup before you clear site data or change
              machines.
            </p>
          </div>
          <span className="settings-heading__badge">
            <ShieldCheck size={16} /> Local-first
          </span>
        </div>
      </header>

      <div className="settings-layout">
        <div className="settings-main">
          <section className="settings-card">
            <div className="settings-card__head">
              <span className="settings-card__icon settings-card__icon--blue"><UserRound size={19} /></span>
              <div>
                <h2>Study profile</h2>
                <p>Small details that shape your daily loop.</p>
              </div>
            </div>

            <label className="settings-field">
              <span>What should we call you?</span>
              <input
                type="text"
                value={prefs.name}
                maxLength={40}
                placeholder="Your name — optional"
                onChange={(event) => updatePrefs({ name: event.target.value })}
              />
              <small>Only used in the greeting on the home page.</small>
            </label>

            <div className="settings-row">
              <div className="settings-row__label">
                <strong>Daily goal</strong>
                <span>Reviews and quiz answers that count toward today.</span>
              </div>
              <div className="segmented segmented--settings">
                {GOAL_OPTIONS.map((value) => (
                  <button
                    type="button"
                    key={value}
                    className={prefs.dailyGoal === value ? 'is-active' : ''}
                    aria-pressed={prefs.dailyGoal === value}
                    onClick={() => updatePrefs({ dailyGoal: value })}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <div className="settings-row">
              <div className="settings-row__label">
                <strong>Smart session size</strong>
                <span>The maximum number of cards in a smart review.</span>
              </div>
              <div className="segmented segmented--settings">
                {SESSION_OPTIONS.map((value) => (
                  <button
                    type="button"
                    key={value}
                    className={prefs.sessionSize === value ? 'is-active' : ''}
                    aria-pressed={prefs.sessionSize === value}
                    onClick={() => updatePrefs({ sessionSize: value })}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <label className="toggle-row settings-toggle">
              <input
                type="checkbox"
                checked={prefs.showHints}
                onChange={(event) => updatePrefs({ showHints: event.target.checked })}
              />
              <span className="toggle-row__track" aria-hidden="true"><span /></span>
              <span>
                <strong>Show context hints on flashcards</strong>
                <small>The “Remember” and “In context” notes on the back of each card.</small>
              </span>
            </label>
          </section>

          <section className="settings-card" id="reading-comfort">
            <div className="settings-card__head">
              <span className="settings-card__icon settings-card__icon--sage"><Type size={19} /></span>
              <div>
                <h2>Reading comfort</h2>
                <p>Scale every label, definition, and control across Lexicon.</p>
              </div>
            </div>

            <div className="reading-size">
              <div className="reading-size__head">
                <div>
                  <strong>Text size</strong>
                  <span>{textScaleLabel(prefs.textScale)}</span>
                </div>
                <span className="reading-size__value">{textScalePct}%</span>
              </div>

              <input
                type="range"
                className="reading-size__range"
                min={TEXT_SCALE_MIN * 100}
                max={TEXT_SCALE_MAX * 100}
                step={TEXT_SCALE_STEP * 100}
                value={textScalePct}
                aria-label="Text size"
                aria-valuetext={`${textScalePct}% — ${textScaleLabel(prefs.textScale)}`}
                onChange={(event) => updatePrefs({ textScale: Number(event.target.value) / 100 })}
              />

              <div className="reading-size__marks" aria-hidden="true">
                <span>Compact</span>
                <span>Default</span>
                <span>Largest</span>
              </div>

              <div className="reading-size__preview">
                <span className="eyebrow">Live preview</span>
                <p>
                  <strong>Precise language compounds.</strong> Larger text applies to
                  definitions, flashcard backs, quizzes, and every label in between.
                </p>
              </div>

              {textScalePct !== Math.round(TEXT_SCALE_DEFAULT * 100) ? (
                <button
                  type="button"
                  className="text-link reading-size__reset"
                  onClick={() => updatePrefs({ textScale: TEXT_SCALE_DEFAULT })}
                >
                  <RotateCcw size={13} /> Reset to {Math.round(TEXT_SCALE_DEFAULT * 100)}%
                </button>
              ) : null}
            </div>
          </section>

          <section className="settings-card">
            <div className="settings-card__head">
              <span className="settings-card__icon settings-card__icon--sage"><Database size={19} /></span>
              <div>
                <h2>Your data</h2>
                <p>Everything the library remembers about your learning.</p>
              </div>
            </div>

            <div className="settings-data-grid">
              <div><strong>{seenTerms}</strong><span>terms explored</span></div>
              <div><strong>{knownTerms}</strong><span>known</span></div>
              <div><strong>{bookmarks.length}</strong><span>bookmarks</span></div>
              <div><strong>{Object.keys(notes).length}</strong><span>notes</span></div>
              <div><strong>{quizHistory.length}</strong><span>quizzes</span></div>
              <div><strong>{usageBytes ? formatBytes(usageBytes) : 'Empty'}</strong><span>storage used</span></div>
            </div>

            <div className="settings-actions">
              <button type="button" className="button button--primary button--small" onClick={exportData}>
                <Download size={16} /> Export backup
              </button>
              <button
                type="button"
                className="button button--ghost button--small"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload size={16} /> Import backup
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="application/json,.json"
                className="settings-file-input"
                onChange={handleFileChange}
                aria-label="Choose a Lexicon backup file"
              />
            </div>
            <p className="settings-note">
              Backups are a plain JSON file. Importing replaces the matching data sets; the
              library itself is never changed.
            </p>
          </section>

          <section className="settings-card settings-card--danger">
            <div className="settings-card__head">
              <span className="settings-card__icon settings-card__icon--amber"><RotateCcw size={19} /></span>
              <div>
                <h2>Start over</h2>
                <p>Reset locally stored learning data. This cannot be undone.</p>
              </div>
            </div>

            <div className="settings-danger-row">
              <div>
                <strong>Reset learning data</strong>
                <span>Progress, bookmarks, notes, activity, and quiz history. Preferences stay.</span>
              </div>
              <button
                type="button"
                className="button button--ghost button--small"
                onClick={() => setResetMode('learning')}
              >
                Reset learning
              </button>
            </div>

            <div className="settings-danger-row">
              <div>
                <strong>Reset everything</strong>
                <span>All learning data plus your name, text size, goal, and session preferences.</span>
              </div>
              <button
                type="button"
                className="button button--danger button--small"
                onClick={() => setResetMode('all')}
              >
                <Trash2 size={15} /> Reset all
              </button>
            </div>
          </section>
        </div>

        <aside className="settings-side">
          <section className="settings-card settings-card--about">
            <span className="settings-card__icon settings-card__icon--blue"><HardDrive size={19} /></span>
            <h2>No account. No cloud.</h2>
            <p>
              Your learning data is stored under the <code>lexicon.v1</code> namespace in
              this browser’s localStorage. Study progress never leaves this device. If you
              send a feedback note, only that note is emailed through FormSubmit. That also
              means clearing site data deletes your progress.
            </p>
            <ul>
              <li><Bookmark size={14} /> Import/export moves between browsers.</li>
              <li><ShieldCheck size={14} /> No tracking or ads. Feedback leaves only when you send it.</li>
              <li><Database size={14} /> The vocabulary itself ships with the site.</li>
            </ul>
            <div className="settings-about__usage">
              <div className="settings-about__usage-head">
                <span>Local storage</span>
                <strong>{formatBytes(usageBytes)}</strong>
              </div>
              <ProgressBar value={Math.min(100, (usageBytes / (5 * 1024 * 1024)) * 100)} tone="sage" size="sm" />
              <span className="settings-about__usage-note">Approximate, against a typical 5 MB browser quota.</span>
            </div>
            <Link to="/progress" className="text-link">
              View progress <ArrowRight size={14} />
            </Link>
          </section>

          <section className="settings-card">
            <div className="settings-card__head">
              <span className="settings-card__icon settings-card__icon--amber"><Sparkles size={19} /></span>
              <div>
                <h2>Keyboard</h2>
                <p>Move without reaching for the mouse.</p>
              </div>
            </div>
            <div className="settings-shortcuts">
              <div><span>Search vocabulary</span><span><kbd>⌘K</kbd> or <kbd>/</kbd></span></div>
              <div><span>Reveal a flashcard</span><kbd>space</kbd></div>
              <div><span>Rate a flashcard</span><span><kbd>1</kbd>–<kbd>4</kbd></span></div>
              <div><span>Answer a quiz</span><span><kbd>1</kbd>–<kbd>4</kbd></span></div>
              <div><span>Continue a quiz</span><kbd>↵</kbd></div>
              <div><span>Close a dialog</span><kbd>esc</kbd></div>
            </div>
          </section>

          <section className="settings-card settings-card--feedback">
            <div className="settings-card__head">
              <span className="settings-card__icon settings-card__icon--blue"><MessageSquarePlus size={19} /></span>
              <div>
                <h2>Feedback & ideas</h2>
                <p>Spotted a typo or a missing term?</p>
              </div>
            </div>
            <p className="settings-feedback__copy">
              Corrections, clearer examples, new vocabulary, and site bugs are all
              welcome. Send a note without leaving the app.
            </p>
            <Link to="/feedback" className="button button--primary button--small settings-feedback__button">
              Open feedback <ArrowRight size={15} />
            </Link>
            <a href={`mailto:${FEEDBACK_EMAIL}`} className="text-link settings-feedback__mail">
              <Mail size={14} /> {FEEDBACK_EMAIL}
            </a>
          </section>

          <section className="settings-card settings-card--version">
            <span>Lexicon</span>
            <strong>v1.0</strong>
            <p>{TERMS.length} terms · 19 fields · local-first</p>
          </section>
        </aside>
      </div>

      <ConfirmDialog
        open={pendingImport !== null}
        title="Import this backup?"
        description={
          pendingImport
            ? `“${pendingImport.fileName}” will replace your current progress, bookmarks, notes, activity, quiz history, and preferences where present. The page will reload afterwards.`
            : ''
        }
        confirmLabel="Replace my data"
        tone="warning"
        onConfirm={confirmImport}
        onCancel={() => setPendingImport(null)}
      />

      <ConfirmDialog
        open={resetMode !== null}
        title={resetMode === 'all' ? 'Reset everything?' : 'Reset learning data?'}
        description={
          resetMode === 'all'
            ? 'Every Lexicon preference and every learning record in this browser will be erased. Export a backup first if there is any chance you will want it back.'
            : 'Progress, bookmarks, notes, activity, quiz history, and any in-progress flashcard session will be erased. Your name and study preferences stay.'
        }
        confirmLabel={resetMode === 'all' ? 'Erase everything' : 'Clear learning data'}
        tone="warning"
        onConfirm={confirmReset}
        onCancel={() => setResetMode(null)}
      />

      <footer className="page-footer">
        <span>Lexicon settings · stored locally</span>
        <span>Export a backup before clearing browser data</span>
      </footer>
    </div>
  )
}
