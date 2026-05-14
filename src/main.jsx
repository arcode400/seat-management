import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import './index.css'
import App from './App.jsx'
import LoginPage from './pages/LoginPage.jsx'
import LandingPage from './pages/LandingPage.jsx'
import PublicBAPPage from './pages/PublicBAPPage.jsx'
import PublicBASTSignPage from './pages/PublicBASTSignPage.jsx'
import PublicBAPSignPage from './pages/PublicBAPSignPage.jsx'
import PublicKomplainSignPage from './pages/PublicKomplainSignPage.jsx'
import ProtectedRoute from './components/ProtectedRoute.jsx'
import { AuthProvider } from './context/AuthContext.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/bap/:id" element={<PublicBAPPage />} />
          <Route path="/bast-sign/:id" element={<PublicBASTSignPage />} />
          <Route path="/bap-sign/:id" element={<PublicBAPSignPage />} />
          <Route path="/komplain-sign/:id" element={<PublicKomplainSignPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <App />
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
)
