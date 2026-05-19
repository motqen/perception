import React, { Suspense, lazy, useState, useEffect } from 'react';
import { NavLink, useNavigate, useLocation, Navigate, Routes, Route } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { 
  Users, 
  Calendar, 
  Video, 
  Settings, 
  LogOut,
  LayoutDashboard,
  Menu,
  FileText,
  Eye,
  X as CloseIcon
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';
import './DashboardLayout.css';

// LAZY LOAD DASHBOARD PAGES
const ManageBookings = lazy(() => import('../components/dashboard/ManageBookings'));
const ManageAvailability = lazy(() => import('../components/dashboard/ManageAvailability'));
const ManageWebinars = lazy(() => import('../components/dashboard/ManageWebinars'));
const SiteSettings = lazy(() => import('../components/dashboard/SiteSettings'));
const ManageContent = lazy(() => import('../components/dashboard/ManageContent'));

const Sidebar = ({ isMobileMenuOpen, setIsMobileMenuOpen, navItems, user, handleLogout, t }) => (
  <>
    {isMobileMenuOpen && (
      <div className="sidebar-overlay" onClick={() => setIsMobileMenuOpen(false)} />
    )}
    <aside className={`dashboard-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
      <div className="sidebar-header">
        <div className="sidebar-header-top">
          <img 
            src={`${import.meta.env.BASE_URL}logo.svg`} 
            alt="Wiqaiah" 
            className="sidebar-logo" 
            height="50"
            style={{ height: '50px' }}
          />
          <button className="close-sidebar-btn" onClick={() => setIsMobileMenuOpen(false)}>
            <CloseIcon size={24} />
          </button>
        </div>
        <span className="badge-admin">ADMIN</span>
      </div>
      
      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <NavLink 
            key={item.path} 
            to={item.path} 
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <p className="user-email">{user?.email}</p>
        </div>
        <button onClick={handleLogout} className="logout-btn">
          <LogOut size={18} />
          <span>{t('dashboard_nav.logout')}</span>
        </button>
      </div>
    </aside>
  </>
);

const Header = ({ setIsMobileMenuOpen, currentLabel, t, i18n }) => (
  <header className="dashboard-header">
    <div className="header-breadcrumbs">
      <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(true)}>
        <Menu size={24} />
      </button>
      <span className="breadcrumb-root hide-mobile">{t('dashboard_nav.root')}</span>
      <span className="breadcrumb-sep hide-mobile">/</span>
      <span className="breadcrumb-current">{currentLabel}</span>
    </div>
    
    <div className="header-actions">
      <button 
        onClick={() => window.open(import.meta.env.BASE_URL, '_blank')}
        className="preview-pill"
        title={i18n.language === 'ar' ? 'معاينة الموقع' : 'Preview Site'}
      >
        <Eye size={18} />
        <span>{i18n.language === 'ar' ? 'معاينة' : 'Preview'}</span>
      </button>
      <button 
        onClick={() => i18n.changeLanguage(i18n.language === 'ar' ? 'en' : 'ar')}
        className="lang-pill"
      >
        {i18n.language === 'ar' ? 'English' : 'العربية'}
      </button>
    </div>
  </header>
);

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navItems = [
    { path: '/dashboard/bookings', icon: Users, label: t('dashboard_nav.bookings') },
    { path: '/dashboard/availability', icon: Calendar, label: t('dashboard_nav.availability') },
    { path: '/dashboard/webinars', icon: Video, label: t('dashboard_nav.webinars') },
    { path: '/dashboard/content', icon: FileText, label: t('dashboard_nav.content') },
    { path: '/dashboard/settings', icon: Settings, label: t('dashboard_nav.settings') },
  ];

  const currentLabel = navItems.find(i => location.pathname.startsWith(i.path))?.label 
    || t('dashboard_nav.root');

  return (
    <div className="dashboard-wrapper">
      <Sidebar 
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
        navItems={navItems}
        user={user}
        handleLogout={handleLogout}
        t={t}
      />

      <main className="dashboard-main">
        <Header 
          setIsMobileMenuOpen={setIsMobileMenuOpen}
          currentLabel={currentLabel}
          t={t}
          i18n={i18n}
        />

        <div className="dashboard-content">
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route index element={<Navigate to="bookings" replace />} />
              <Route path="bookings" element={<ManageBookings />} />
              <Route path="availability" element={<ManageAvailability />} />
              <Route path="webinars" element={<ManageWebinars />} />
              <Route path="content" element={<ManageContent />} />
              <Route path="settings" element={<SiteSettings />} />
              <Route path="*" element={<Navigate to="bookings" replace />} />
            </Routes>
          </Suspense>
        </div>
      </main>
    </div>
  );
};

export default DashboardLayout;
