import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ErrorBoundary from './components/ErrorBoundary'
import LandingPage from './pages/LandingPage'
import LoginPage from './components/Auth/LoginPage'
import AuthGuard from './components/Auth/AuthGuard'
import HomePage from './components/HomePage'
import HistoryPage from './components/Dashboard/HistoryPage'

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Routes>
          <Route path="/"          element={<LandingPage />} />
          <Route path="/login"     element={<LoginPage />} />
          <Route path="/dashboard" element={<AuthGuard><HomePage /></AuthGuard>} />
          <Route path="/history"   element={<AuthGuard><HistoryPage /></AuthGuard>} />
          <Route path="*"          element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </ErrorBoundary>
  )
}
