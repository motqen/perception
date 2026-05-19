import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { usePageContent } from '../hooks/usePageContent';
import { usePricing } from '../hooks/usePricing';
import './Offer.css';

const Offer = () => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const lang = i18n.language === 'ar' ? 'ar' : 'en';
  const { get, content } = usePageContent('offer');

  const { finalPrice, originalPrice, show_discount } = usePricing();

  const perks = content
    ? Object.keys(content)
        .filter(k => k.startsWith('perk_'))
        .sort()
        .map(k => content[k][lang] || content[k]['en'])
    : t('offer.perks', { returnObjects: true });

  return (
    <section id="book" className="offer-section section-padding">
      <div className="container">
        <div className="offer-grid">
          <div className="offer-details">
            <div className="section-label">{t('hero.badge').toUpperCase()}</div>
            <h2
              className="section-title"
              dangerouslySetInnerHTML={{ __html: get('title', lang, t('offer.title')) }}
            />
            <p className="offer-desc">
              {get('subtitle', lang, t('offer.subtitle'))}
            </p>
            <ul className="perks">
              {perks.map((perk, i) => (
                <li key={i}><span>✓</span> {perk}</li>
              ))}
            </ul>
          </div>

          <div className="offer-card">
            <div className="card-inner">
              <div className="price-header">
                <span className="current-price">${finalPrice}</span>
                {show_discount && (
                  <span className="old-price">${originalPrice}</span>
                )}
              </div>
              <p className="price-note">{t('hero.price_note')}</p>
              <button onClick={() => navigate('/book')} className="book-session-btn">
                {t('hero.book_btn')} →
              </button>
              <div className="guarantee">
                <span>🛡️</span> {get('guarantee', lang, '100% Satisfaction Guarantee')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Offer;
