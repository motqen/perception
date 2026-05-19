import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Globe, Menu, X } from 'lucide-react';
import { useSiteSettings } from '../hooks/useSiteSettings';
import './Navbar.css';

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { site_logo_url, site_title_ar, site_title_en } = useSiteSettings();
  const siteTitle = i18n.language === 'ar' ? site_title_ar : site_title_en;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navigate = useNavigate();

  const toggleLanguage = () => {
    const nextLang = i18n.language === 'en' ? 'ar' : 'en';
    i18n.changeLanguage(nextLang);
  };

  const handleNavClick = (e, targetId) => {
    e.preventDefault();
    setMenuOpen(false);
    if (location.pathname === '/') {
      const element = document.getElementById(targetId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    } else {
      navigate('/', { state: { scrollTo: targetId } });
    }
  };

  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
      <div className="container nav-content">
        <Link to="/" className="logo-link">
          <img 
            src={site_logo_url || `${import.meta.env.BASE_URL}logo.svg`} 
            alt={siteTitle} 
            className="nav-logo-img" 
          />
        </Link>

        <div className={`nav-links ${menuOpen ? 'mobile-open' : ''}`}>
          <button onClick={(e) => handleNavClick(e, 'how')} className="nav-link nav-btn">{t('nav.process')}</button>
          <button onClick={(e) => handleNavClick(e, 'questions')} className="nav-link nav-btn">{t('nav.faq')}</button>
          <button onClick={(e) => handleNavClick(e, 'sessions')} className="nav-link nav-btn">{t('nav.sessions')}</button>
          
          <button onClick={() => {toggleLanguage(); setMenuOpen(false);}} className="lang-switcher">
            <Globe size={18} />
            <span>{i18n.language === 'en' ? 'العربية' : 'English'}</span>
          </button>

          <Link to="/book" onClick={() => setMenuOpen(false)} className="cta-button">{t('nav.book_now')}</Link>
        </div>

        <button className="mobile-menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
          {menuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
