import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Calendar, Clock, MapPin } from 'lucide-react';
import './Webinars.css';

const WebinarCard = ({ webinar }) => {
  const { t, i18n } = useTranslation();
  const title = i18n.language === 'ar' ? webinar.title_ar || webinar.title : webinar.title;
  
  const approvedCount = webinar.webinar_registrations?.filter(r => r.status === 'approved').length || 0;
  const capacity = webinar.capacity || 50;
  const isFull = approvedCount >= capacity;
  
  return (
    <div className={`webinar-card ${isFull ? 'full' : ''}`}>
      <div className="webinar-header" style={{ 
        background: webinar.cover_url ? `url(${webinar.cover_url}) center/cover no-repeat` : 'linear-gradient(135deg, var(--primary-pale), var(--bg-soft))',
        height: '240px',
        position: 'relative'
      }}>
        <div className="webinar-badges">
          <span className="live-badge">{t('webinars_section.badge')}</span>
          <span className="spots-badge">
             {approvedCount} / {capacity} {t('webinars_section.spots_filled')}
          </span>
        </div>
        {!webinar.cover_url && <div className="webinar-price">${webinar.price || 9}</div>}
      </div>
      <div className="webinar-content">
        <h3 className="webinar-topic">{title}</h3>
        <div className="webinar-meta">
          <span className="meta-item"><Calendar size={14} /> {new Date(webinar.start_time).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'long' })}</span>
          <span className="meta-item"><Clock size={14} /> {new Date(webinar.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} · 60 min</span>
        </div>
        <Link to={`/register/${webinar.id}`} className={`book-btn ${isFull ? 'disabled' : ''}`}>
          {isFull 
            ? t('webinars_section.fully_booked')
            : t('webinars_section.book_btn')}
        </Link>
      </div>
    </div>
  );
};

const Webinars = () => {
  const { t, i18n } = useTranslation();
  const [webinars, setWebinars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWebinars = async () => {
      const { data, error } = await supabase
        .from('webinars')
        .select('*, webinar_registrations(status)')
        .eq('is_published', true)
        .order('start_time', { ascending: true });

      if (data && !error) setWebinars(data);
      setLoading(false);
    };
    fetchWebinars();
  }, []);

  if (loading) return null;

  return (
    <section id="sessions" className="webinars-section section-padding">
      <div className="container">
        <div className="webinars-top">
          <div className="webinars-info">
            <div className="section-label">{t('webinars_section.label')}</div>
            <h2 className="section-title" style={{ textAlign: 'left', marginBottom: 0 }}>
              {t('webinars_section.title')}
            </h2>
            <p>{t('webinars_section.subtitle')}</p>
          </div>
        </div>
        <div className="webinar-grid">
          {webinars.map(w => <WebinarCard key={w.id} webinar={w} />)}
          {webinars.length === 0 && (
            <p style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', opacity: 0.5 }}>
              {t('webinars_section.empty')}
            </p>
          )}
        </div>
      </div>
    </section>
  );
};

export default Webinars;
