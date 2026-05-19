import React from 'react';
import { useTranslation } from 'react-i18next';
import { usePageContent } from '../hooks/usePageContent';
import './Footer.css';

const Footer = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language === 'ar' ? 'ar' : 'en';
  const { get } = usePageContent('footer');

  return (
    <footer className="footer">
      <div className="container footer-content">

        <div className="footer-brand">
          <img src="logo.svg" alt="Wiqaiah" className="footer-logo-img" />
          <p className="footer-motto">{get('motto', lang, t('footer.motto'))}</p>
        </div>

        <div className="footer-links">
          <div className="footer-group">
            <h4>{t('footer.services.title')}</h4>
            <a href="#">{t('footer.services.one_on_one')}</a>
            <a href="#">{t('footer.services.webinars')}</a>
            <a href="#">{t('footer.services.community')}</a>
          </div>
          <div className="footer-group">
            <h4>{t('footer.support.title')}</h4>
            <a href="#questions">{t('footer.support.faq')}</a>
            <a href="#">{t('footer.support.privacy')}</a>
            <a href="#">{t('footer.support.terms')}</a>
          </div>
        </div>

        <div className="footer-legal">
          <p>{get('copyright', lang, t('footer.legal.copyright'))}</p>
          <p className="disclaimer" dangerouslySetInnerHTML={{ __html: get('disclaimer', lang, t('footer.legal.disclaimer')) }} />
        </div>

      </div>
    </footer>
  );
};

export default Footer;
