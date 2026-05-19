import React, { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useSiteSettings } from './hooks/useSiteSettings'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import LoadingSpinner from './components/LoadingSpinner'
import { Toaster } from 'react-hot-toast'
import './App.css'

import { useLocation } from 'react-router-dom'

// Scroll to top on route change
function ScrollToTop() {
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

const LandingPage = lazy(() => import('./pages/LandingPage'));
const BookingPage = lazy(() => import('./pages/BookingPage'));
const WebinarRegistrationPage = lazy(() => import('./pages/WebinarRegistrationPage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const DashboardLayout = lazy(() => import('./pages/DashboardLayout'));
const ProtectedRoute = lazy(() => import('./components/ProtectedRoute'));

function App() {
  const { i18n } = useTranslation();
  const { site_title_ar, site_title_en } = useSiteSettings();

  React.useEffect(() => {
    const lang = i18n.language || 'en';
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    
    document.documentElement.lang = lang;
    document.documentElement.dir = dir;
    
    const title = lang === 'ar' ? site_title_ar : site_title_en;
    if (title) {
      document.title = title;
    }
  }, [i18n.language, site_title_ar, site_title_en]);

  return (
    <div className="app-container">
      <ScrollToTop />
      <Toaster 
        position="top-center"
        toastOptions={{
          style: {
            background: 'var(--brand-dark)',
            color: 'var(--white)',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: '600',
            border: '1px solid rgba(255,255,255,0.1)',
            padding: '12px 24px',
          },
          success: {
            iconTheme: {
              primary: 'var(--brand-primary)',
              secondary: 'var(--white)',
            },
          },
        }}
      />
      <Suspense fallback={<div className="section-padding"><LoadingSpinner /></div>}>
        <Routes>
          {/* PUBLIC ROUTES */}
          <Route path="/" element={<><Navbar /><main><LandingPage /></main><Footer /></>} />
          <Route path="/book" element={<><Navbar /><main><BookingPage /></main><Footer /></>} />
          <Route path="/register/:webinarId" element={<><Navbar /><main><WebinarRegistrationPage /></main><Footer /></>} />
          
          {/* AUTH ROUTES */}
          <Route path="/dashboard/login" element={<LoginPage />} />
          
          {/* PROTECTED DASHBOARD ROUTES */}
          <Route element={<ProtectedRoute />}>
             <Route path="/dashboard/*" element={<DashboardLayout />} />
          </Route>

          {/* FALLBACK */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </div>
  )
}

export default App
