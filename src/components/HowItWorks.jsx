import React from 'react';
import { useTranslation } from 'react-i18next';
import { usePageContent } from '../hooks/usePageContent';
import './HowItWorks.css';

const Step = ({ number, title, text }) => (
  <div className="step-card">
    <div className="step-num">{number}</div>
    <h3>{title}</h3>
    <p>{text}</p>
  </div>
);

const HowItWorks = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language === 'ar' ? 'ar' : 'en';
  const { get, content } = usePageContent('how_it_works');
  const { get: getDisclaimer } = usePageContent('disclaimer');

  // Build steps dynamically from DB or fallback to i18n
  const steps = content
    ? [1, 2, 3, 4, 5].map(n => ({
        title: get(`step_${n}_title`, lang, ''),
        text: get(`step_${n}_text`, lang, '')
      })).filter(s => s.title)
    : t('how_it_works_new.steps', { returnObjects: true });

  return (
    <section id="how" className="how-section section-padding">
      <div className="container">
        <div className="section-label">{get('section_title', lang, t('how_it_works_new.title')).toUpperCase()}</div>
        <h2 className="section-title">
          {get('footer_note', lang, t('how_it_works_new.footer'))}
        </h2>

        <div className="steps-grid">
          {steps.map((step, i) => (
            <Step key={i} number={`0${i + 1}`} title={step.title} text={step.text} />
          ))}
        </div>

        <div className="disclaimer-block">
          <div className="disclaimer-header">
            <span className="warning-icon">⚠</span>
            <h3>{getDisclaimer('title', lang, t('disclaimer_text.title'))}</h3>
          </div>
          <p className="disclaimer-content">{getDisclaimer('content', lang, t('disclaimer_text.content'))}</p>
          <div className="disclaimer-replaces">
            <p>{getDisclaimer('replaces', lang, t('disclaimer_text.replaces'))}</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
