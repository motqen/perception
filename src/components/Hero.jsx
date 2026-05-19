import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { usePageContent } from '../hooks/usePageContent';
import { usePricing } from '../hooks/usePricing';
import './Hero.css';

const Hero = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language === 'ar' ? 'ar' : 'en';
  const { get } = usePageContent('hero');
  const imageUrl = get('image_url', lang, '');

  const {
    finalPrice,
    originalPrice,
    show_discount,
    discount_text_en,
    discount_text_ar,
  } = usePricing();

  const badgeText = lang === 'ar' ? discount_text_ar : discount_text_en;

  return (
    <section className="hero-section">
      <div className="container hero-grid">
        <div className="hero-content animate-fade-up">
          <div className="badge">
            <span className="badge-dot"></span>
            <span className="badge-text">{get('badge', lang, t('hero.badge'))}</span>
          </div>

          <h1 dangerouslySetInnerHTML={{ __html: get('title', lang, t('hero.title')) }} />

          <p className="hero-subtext" dangerouslySetInnerHTML={{ __html: get('subtitle', lang, t('hero.subtitle')) }} />

          <div className="hero-actions">
            <Link to="/book" className="primary-btn">{get('book_btn', lang, t('hero.book_btn'))}</Link>
            <div className="price-tag">
              <span className="price">${finalPrice}</span>
              {show_discount && (
                <>
                  <span className="old-price">${originalPrice}</span>
                  {badgeText && <span className="discount">{badgeText}</span>}
                </>
              )}
            </div>
          </div>

          <div className="hero-features">
            <div className="feature"><span>✓</span> {get('feature_no_waiting', lang, t('hero.features.no_waiting'))}</div>
            <div className="feature"><span>✓</span> {get('feature_no_prescriptions', lang, t('hero.features.no_prescriptions'))}</div>
            <div className="feature"><span>✓</span> {get('feature_same_dentist', lang, t('hero.features.same_dentist'))}</div>
          </div>
        </div>

        <div className="hero-image animate-fade-in">
          <div className="image-wrapper">
            <div className="gradient-sphere"></div>
            {imageUrl ? (
              <img src={imageUrl} alt="Wiqaiah Hero" className="hero-main-img" />
            ) : (
              <div className="hero-main-img-placeholder">
                <div className="placeholder-blob" />
              </div>
            )}
            <div className="floating-card c1">🦷 {lang === 'ar' ? 'عناية وقائية' : 'Preventive Care'}</div>
            <div className="floating-card c2">✨ {lang === 'ar' ? 'استشارة أونلاين' : 'Online consult'}</div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
