import React from 'react';
import { useTranslation } from 'react-i18next';
import { usePageContent } from '../hooks/usePageContent';
import './FAQ.css';

const FAQ = () => {
  const { t, i18n } = useTranslation();
  const lang = i18n.language === 'ar' ? 'ar' : 'en';
  const { get, content } = usePageContent('faq');

  // Build questions dynamically from DB or fallback to i18n
  const questions = content
    ? Object.keys(content)
        .filter(k => k.startsWith('q_'))
        .sort((a, b) => {
          const na = parseInt(a.split('_')[1]);
          const nb = parseInt(b.split('_')[1]);
          return na - nb;
        })
        .map(k => content[k][lang] || content[k]['en'])
    : t('faq.questions', { returnObjects: true });

  return (
    <section id="questions" className="faq-section section-padding">
      <div className="container">
        <div className="section-label">{get('label', lang, t('faq.label')).toUpperCase()}</div>
        <h2
          className="section-title"
          dangerouslySetInnerHTML={{ __html: get('title', lang, t('faq.title')) }}
        />
        <div className="q-grid">
          {questions.map((q, i) => (
            <div key={i} className="q-card">
              <div className="q-icon">?</div>
              <p>{q}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FAQ;
