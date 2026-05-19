import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { ChevronLeft, ArrowLeft, Calendar, Clock, CheckCircle } from 'lucide-react';
import { usePageContent } from '../hooks/usePageContent';
import PhoneInputLib from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import toast from 'react-hot-toast';
import './WebinarRegistrationPage.css';

const PhoneInput = PhoneInputLib.default ? PhoneInputLib.default : PhoneInputLib;

const WebinarRegistrationPage = () => {
  const { webinarId } = useParams();
  const { t, i18n } = useTranslation();
  const [webinar, setWebinar] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const { get } = usePageContent('confirmations');
  const lang = i18n.language === 'ar' ? 'ar' : 'en';

  useEffect(() => {
    fetchWebinar();
  }, [webinarId]);

  const fetchWebinar = async () => {
    try {
      console.log('Fetching webinar with ID:', webinarId);
      const { data, error } = await supabase
        .from('webinars')
        .select('*, webinar_registrations(status)')
        .eq('id', webinarId)
        .maybeSingle();

      if (error) {
        console.error('Supabase error fetching webinar:', error);
        toast.error('Error loading webinar details');
        setLoading(false);
        return;
      }

      if (data) {
        setWebinar(data);
        // Initialize dynamic form fields if any
        const initialForm = {};
        if (data.form_fields && Array.isArray(data.form_fields)) {
          data.form_fields.forEach(f => {
            if (f.name) initialForm[f.name] = '';
          });
        }
        setFormData(initialForm);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    const loadingToast = toast.loading(i18n.language === 'ar' ? 'جاري التسجيل...' : 'Registering...');
    
    const { error } = await supabase
      .from('webinar_registrations')
      .insert([{
        webinar_id: webinarId,
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        registration_data: formData,
        status: 'pending'
      }]);

    if (!error) {
      toast.success(i18n.language === 'ar' ? 'تم التسجيل بنجاح!' : 'Registration successful!', { id: loadingToast });
      setSubmitted(true);
    } else {
      toast.error(i18n.language === 'ar' ? 'حدث خطأ أثناء التسجيل. يرجى المحاولة لاحقاً.' : 'Failed to register. Please try again.', { id: loadingToast });
    }
  };

  if (loading) return <div className="section-padding container"><h3>{t('common.loading')}</h3></div>;
  if (!webinar) return <div className="section-padding container"><h3>Webinar not found</h3></div>;

  const title = i18n.language === 'ar' ? webinar.title_ar || webinar.title : webinar.title;
  const description = i18n.language === 'ar' ? webinar.description_ar || webinar.description : webinar.description;

  if (submitted) {
    return (
      <div className="registration-status-page container section-padding">
        <div className="status-card">
          <CheckCircle size={64} color="var(--brand-primary)" />
          <h2>{get('webinar_success_title', lang, i18n.language === 'ar' ? 'تم التسجيل بنجاح!' : 'Registration Successful!')}</h2>
          <p>{get('webinar_success_message', lang, i18n.language === 'ar' ? 'شكراً لك. سيصلك رابط الحضور وتفاصيل الويبينار عبر البريد الإلكتروني قريباً.' : 'Thank you for registering. You will receive the meeting link and details via email soon.')}</p>
          <Link to="/" className="primary-btn">{i18n.language === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="webinar-reg-page container section-padding">
      <div className="reg-header">
        <Link to="/" className="back-link">
           <ArrowLeft size={16} /> 
           {i18n.language === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
        </Link>
        
        {webinar.cover_url || webinar.image_url ? (
          <div className="reg-hero-cover" style={{ 
            width: '100%', 
            height: '300px', 
            background: `url(${webinar.cover_url || webinar.image_url}) center/cover no-repeat`,
            borderRadius: '24px',
            marginBottom: '32px'
          }} />
        ) : null}

        <h1>{title}</h1>
        <div className="reg-meta">
          <span className="meta-item">
            <Calendar size={18} /> 
            {new Date(webinar.start_time).toLocaleDateString(i18n.language === 'ar' ? 'ar-EG' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
          </span>
          <span className="meta-item">
            <Clock size={18} /> 
            {new Date(webinar.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
            {" "} ({Intl.DateTimeFormat().resolvedOptions().timeZone})
          </span>
        </div>
      </div>

      <div className="reg-grid">
        <div className="reg-info">
          <h3>{i18n.language === 'ar' ? 'عن الويبينار' : 'About this Webinar'}</h3>
          <p className="reg-description">{description || (i18n.language === 'ar' ? 'لا يوجد وصف متاح.' : 'No description available.')}</p>
          
          <div className="reg-price-box">
             <span className="price-label">{i18n.language === 'ar' ? 'السعر' : 'Price'}:</span>
             <span className="price-val">${webinar.price}</span>
          </div>
        </div>

        <div className="reg-form-card">
          <h3>{i18n.language === 'ar' ? 'سجل بياناتك' : 'Register Now'}</h3>
          
          {(() => {
            const acceptedCount = webinar.webinar_registrations?.filter(r => r.status === 'accepted').length || 0;
            const isFull = acceptedCount >= (webinar.capacity || 50);

            if (isFull) {
              return (
                <div className="full-capacity-notice">
                  <p>{i18n.language === 'ar' ? 'عذراً، هذا الويبينار مكتمل حالياً.' : 'Sorry, this webinar is fully booked.'}</p>
                  <Link to="/" className="secondary-btn">{i18n.language === 'ar' ? 'عرض الويبينارز الأخرى' : 'View Other Webinars'}</Link>
                </div>
              );
            }

            return (
              <form onSubmit={handleRegister} className="reg-form">
                {/* Hardcoded Name/Email first for basic data */}
                <div className="input-group">
                   <label>{i18n.language === 'ar' ? 'الاسم بالكامل' : 'Full Name'}</label>
                   <input 
                     type="text" required 
                     value={formData.name || ''}
                     onChange={e => setFormData({...formData, name: e.target.value})}
                   />
                </div>
                <div className="input-group">
                   <label>{i18n.language === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label>
                   <input 
                     type="email" required 
                     value={formData.email || ''}
                     onChange={e => setFormData({...formData, email: e.target.value})}
                   />
                </div>
                <div className="input-group">
                   <label>{i18n.language === 'ar' ? 'رقم الهاتف' : 'Phone Number'}</label>
                   <PhoneInput
                    country={'eg'}
                    value={formData.phone || ''}
                    onChange={phone => setFormData({...formData, phone})}
                    placeholder="+20 123 456 7890"
                    specialLabel=""
                    inputProps={{
                      name: 'phone',
                      required: true,
                    }}
                    containerClass="phone-input-container"
                    inputClass="phone-input-field"
                    buttonClass="phone-input-button"
                    searchPlaceholder={i18n.language === 'ar' ? 'بحث عن دولة' : 'Search country'}
                  />
                </div>

                {/* Dynamic fields from database */}
                {webinar.form_fields && webinar.form_fields.map((field, idx) => {
                  if (field.name === 'name' || field.name === 'email') return null; // skip hardcoded
                  const label = i18n.language === 'ar' ? field.label_ar || field.label_en : field.label_en;
                  return (
                    <div className="input-group" key={idx}>
                      <label>{label}</label>
                      <input 
                        type={field.type || "text"} 
                        required={field.required}
                        value={formData[field.name] || ''}
                        onChange={e => setFormData({...formData, [field.name]: e.target.value})}
                      />
                    </div>
                  );
                })}

                <button type="submit" className="primary-btn submit-btn">
                  {i18n.language === 'ar' ? 'تأكيد التسجيل والدفع' : 'Register and Continue'}
                </button>
              </form>
            );
          })()}
        </div>
      </div>
    </div>
  );
};

export default WebinarRegistrationPage;
