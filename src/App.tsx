import { useEffect } from 'react'
import { HashRouter, Route, Routes, useLocation } from 'react-router-dom'
import { StudyProvider } from './context/StudyProvider'
import { ToastProvider } from './context/ToastProvider'
import { AppShell } from './components/layout/AppShell'
import { HomePage } from './pages/HomePage'
import { LibraryPage } from './pages/LibraryPage'
import { TermPage } from './pages/TermPage'
import { FlashcardsPage } from './pages/FlashcardsPage'
import { QuizPage } from './pages/QuizPage'
import { DistinctionsPage } from './pages/DistinctionsPage'
import { ProgressPage } from './pages/ProgressPage'
import { SettingsPage } from './pages/SettingsPage'
import { FeedbackPage } from './pages/FeedbackPage'
import { NotFoundPage } from './pages/NotFoundPage'

const ROUTE_TITLES: Record<string, string> = {
  '/': 'Lexicon — Tech vocabulary, mastered.',
  '/library': 'Library · Lexicon',
  '/flashcards': 'Flashcards · Lexicon',
  '/quiz': 'Quiz · Lexicon',
  '/distinctions': 'Distinctions · Lexicon',
  '/progress': 'Progress · Lexicon',
  '/settings': 'Settings · Lexicon',
  '/feedback': 'Feedback & ideas · Lexicon',
}

function RouteTitle() {
  const { pathname } = useLocation()

  useEffect(() => {
    if (pathname.startsWith('/terms/')) return
    document.title = ROUTE_TITLES[pathname] ?? 'Page not found · Lexicon'
  }, [pathname])

  return null
}

export default function App() {
  return (
    <StudyProvider>
      <ToastProvider>
        <HashRouter>
          <RouteTitle />
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<HomePage />} />
              <Route path="library" element={<LibraryPage />} />
              <Route path="terms/:termId" element={<TermPage />} />
              <Route path="flashcards" element={<FlashcardsPage />} />
              <Route path="quiz" element={<QuizPage />} />
              <Route path="distinctions" element={<DistinctionsPage />} />
              <Route path="progress" element={<ProgressPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="feedback" element={<FeedbackPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Route>
          </Routes>
        </HashRouter>
      </ToastProvider>
    </StudyProvider>
  )
}
