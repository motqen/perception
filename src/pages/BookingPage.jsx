import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import { Calendar, Clock, CheckCircle, ChevronLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePageContent } from '../hooks/usePageContent';
import { useSiteSettings } from '../hooks/useSiteSettings';
import PhoneInputLib from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import toast from 'react-hot-toast';
import './BookingPage.css';
import '../components/HowItWorks.css';

const PhoneInput = PhoneInputLib.default ? PhoneInputLib.default : PhoneInputLib;

const BookingPage = () => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', reason: '' });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { get } = usePageContent('confirmations');
  const theme = useSiteSettings();
  const lang = isAr ? 'ar' : 'en';

  // Refs for auto-scroll
  const formRef = useRef(null);
  const hasScrolledToForm = useRef(false);

  // Timezone conversion helper
  const getLocalTime = (dateStr, timeStr) => {
    try {
      const adminTz = theme.site_timezone || 'Africa/Cairo';
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: adminTz,
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit', second: '2-digit',
        hour12: false,
      });
      const parts = formatter.formatToParts(new Date(`${dateStr}T${timeStr}`));
      const dateMap = {};
      parts.forEach(p => (dateMap[p.type] = p.value));
      const adminDate = new Date(
        `${dateMap.year}-${dateMap.month}-${dateMap.day}T${dateMap.hour}:${dateMap.minute}:${dateMap.second}`
      );
      const diff = adminDate.getTime() - new Date(`${dateStr}T${timeStr}`).getTime();
      return new Date(new Date(`${dateStr}T${timeStr}`).getTime() - diff);
    } catch (e) {
      return new Date(`${dateStr}T${timeStr}`);
    }
  };

  const formatSlotLabel = (slot) => {
    const start = getLocalTime(slot.date, slot.start_time);
    const end = getLocalTime(slot.date, slot.end_time);
    const fmt = { hour: '2-digit', minute: '2-digit', hour12: false };
    const locale = isAr ? 'ar-EG' : 'en-US';
    const datePart = start.toLocaleDateString(locale, { weekday: 'short', day: 'numeric', month: 'long' });
    const timePart = `${start.toLocaleTimeString([], fmt)} - ${end.toLocaleTimeString([], fmt)}`;
    return { datePart, timePart };
  };

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
    fetchSlots();
  }, []);

  const fetchSlots = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('availability')
      .select('*')
      .eq('is_booked', false)
      .gte('date', new Date().toISOString().split('T')[0])
      .order('date', { ascending: true })
      .order('start_time', { ascending: true });

    if (!error) setSlots(data || []);
    setLoading(false);
  };

  const toggleSlot = (slot) => {
    const isSelected = selectedSlots.some(s => s.id === slot.id);
    if (isSelected) {
      // Deselect
      setSelectedSlots(prev => prev.filter(s => s.id !== slot.id));
    } else {
      // Select
      setSelectedSlots(prev => [...prev, slot]);
      // Auto-scroll to form on FIRST selection only
      if (!hasScrolledToForm.current) {
        hasScrolledToForm.current = true;
        setTimeout(() => {
          formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
      }
    }
  };

  const removeSlot = (slotId) => {
    setSelectedSlots(prev => prev.filter(s => s.id !== slotId));
  };

  const handleBooking = async (e) => {
    e.preventDefault();
    if (selectedSlots.length === 0) return;

    setSubmitting(true);
    const loadingToast = toast.loading(isAr ? 'جاري إرسال طلبك...' : 'Sending request...');

    try {
      const slotIds = selectedSlots.map(s => s.id);
      
      const { error: bookingError } = await supabase.rpc('book_slots', {
        p_slots: slotIds,
        p_name: formData.name,
        p_email: formData.email,
        p_phone: formData.phone,
        p_reason: formData.reason || null
      });

      if (bookingError) throw bookingError;

      toast.success(
        isAr ? 'تم إرسال طلبات الحجز بنجاح!' : 'Booking requests sent successfully!',
        { id: loadingToast }
      );
      setSubmitted(true);
    } catch (err) {
      toast.error(
        isAr ? 'حدث خطأ. يرجى المحاولة لاحقاً.' : 'An error occurred. Please try again.',
        { id: loadingToast }
      );
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success Screen ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="booking-status-page container section-padding">
        <div className="status-card">
          <CheckCircle size={64} color="var(--brand-primary)" />
          <h2>{get('booking_success_title', lang, isAr ? 'تم استلام طلبك!' : 'Request Sent!')}</h2>
          <p>
            {get(
              'booking_success_message',
              lang,
              isAr
                ? 'شكراً لك. سيقوم الدكتور بمراجعة الطلب وسيصلك إيميل بالتفاصيل قريباً.'
                : 'Thank you. Dr. Muhammad will review your request and you will receive an email confirmation soon.'
            )}
          </p>
          {selectedSlots.length > 1 && (
            <p className="sessions-booked-note">
              {isAr
                ? `تم إرسال ${selectedSlots.length} طلبات حجز.`
                : `${selectedSlots.length} session requests submitted.`}
            </p>
          )}
          <Link to="/" className="primary-btn">
            {isAr ? 'العودة للرئيسية' : 'Back to Home'}
          </Link>
        </div>
      </div>
    );
  }

  // ── Main Page ───────────────────────────────────────────────────────────────
  return (
    <div className="booking-page container section-padding">
      {/* Header */}
      <div className="booking-header">
        <Link to="/" className="back-link">
          <ChevronLeft size={16} className={isAr ? 'rotate-180' : ''} />
          {isAr ? 'رجوع' : 'Back'}
        </Link>
        <h1>{isAr ? 'احجز استشارتك الخاصة' : 'Book Your Private Consultation'}</h1>
        <p>
          {isAr
            ? 'يمكنك اختيار أكثر من موعد لحجز عدة جلسات في وقت واحد.'
            : 'You can select multiple slots to book several sessions at once.'}
        </p>
      </div>

      {/* Steps Guide */}
      <div className="booking-steps-guide" style={{ marginBottom: '60px' }}>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-num">01</div>
            <h3>{isAr ? 'اختر المواعيد' : 'Select Slots'}</h3>
            <p>{isAr ? 'اختر موعداً أو أكثر من القائمة.' : 'Pick one or more slots from the list.'}</p>
          </div>
          <div className="step-card">
            <div className="step-num">02</div>
            <h3>{isAr ? 'أدخل بياناتك' : 'Enter Details'}</h3>
            <p>{isAr ? 'قم بتعبئة نموذج الحجز.' : 'Fill out the booking form.'}</p>
          </div>
          <div className="step-card">
            <div className="step-num">03</div>
            <h3>{isAr ? 'تأكيد الموعد' : 'Confirmation'}</h3>
            <p>{isAr ? 'سيصلك إيميل بتأكيد مواعيدك.' : 'You\'ll receive a confirmation email.'}</p>
          </div>
        </div>
      </div>

      {/* Two-column layout */}
      <div className="booking-selection-grid">

        {/* ── LEFT: Slots Panel ── */}
        <div className="slots-container">
          <div className="slots-header">
            <h3><Calendar size={20} /> {isAr ? 'المواعيد المتاحة' : 'Available Slots'}</h3>
            {selectedSlots.length > 0 && (
              <span className="slots-badge">
                {selectedSlots.length} {isAr ? 'محدد' : 'selected'}
              </span>
            )}
          </div>

          {loading ? (
            <p className="loading-text">{t('common.loading')}</p>
          ) : slots.length === 0 ? (
            <div className="empty-slots">
              <p>{isAr ? 'لا توجد مواعيد متاحة حالياً. يرجى المحاولة لاحقاً.' : 'No available slots at the moment. Please check back later.'}</p>
            </div>
          ) : (
            <div className="slots-scroll-window">
              <div className="slots-list">
                {slots.map(slot => {
                  const isSelected = selectedSlots.some(s => s.id === slot.id);
                  const { datePart, timePart } = formatSlotLabel(slot);
                  return (
                    <button
                      key={slot.id}
                      className={`slot-item ${isSelected ? 'active' : ''}`}
                      onClick={() => toggleSlot(slot)}
                    >
                      <div className="slot-item-inner">
                        <div className="slot-text">
                          <div className="slot-date">{datePart}</div>
                          <div className="slot-time">
                            <Clock size={13} />
                            {timePart}
                          </div>
                        </div>
                        <div className={`slot-check ${isSelected ? 'checked' : ''}`}>
                          {isSelected ? <CheckCircle size={18} /> : (
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Hint */}
          {slots.length > 0 && (
            <p className="slots-hint">
              {isAr ? '✓ يمكنك اختيار أكثر من موعد' : '✓ You can select multiple slots'}
            </p>
          )}
        </div>

        {/* ── RIGHT: Booking Form ── */}
        <div className="booking-form-container" ref={formRef}>
          <h3><CheckCircle size={20} /> {isAr ? 'بيانات الحجز' : 'Booking Details'}</h3>

          {selectedSlots.length === 0 ? (
            <div className="form-placeholder">
              <div className="placeholder-content">
                <Calendar size={48} opacity={0.2} style={{ marginBottom: '16px' }} />
                <p>{isAr ? 'يرجى اختيار موعد متاح من القائمة للبدء' : 'Please select an available slot from the list to start'}</p>
              </div>
            </div>
          ) : (
            <div className="booking-form-wrapper animate-fade-in">

              {/* Selected slots summary chips */}
              <div className="selected-slots-summary">
                <div className="summary-label">
                  <Clock size={16} />
                  {isAr ? 'المواعيد المختارة' : 'Selected Sessions'}
                  <span className="summary-count">({selectedSlots.length})</span>
                </div>
                <div className="summary-chips">
                  {selectedSlots.map(slot => {
                    const { datePart, timePart } = formatSlotLabel(slot);
                    return (
                      <div key={slot.id} className="slot-chip">
                        <span className="chip-date">{datePart}</span>
                        <span className="chip-time">{timePart}</span>
                        <button
                          type="button"
                          className="chip-remove"
                          onClick={() => removeSlot(slot.id)}
                          aria-label="Remove slot"
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleBooking} className="booking-form">
                <div className="input-group">
                  <label>{isAr ? 'الاسم الكامل' : 'Full Name'}</label>
                  <input
                    type="text"
                    required
                    placeholder={isAr ? 'أدخل اسمك هنا' : 'Enter your name'}
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="input-group">
                  <label>{isAr ? 'البريد الإلكتروني' : 'Email Address'}</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                    placeholder="example@mail.com"
                  />
                </div>
                <div className="input-group">
                  <label>{isAr ? 'رقم الهاتف' : 'Phone Number'}</label>
                  <PhoneInput
                    country={'eg'}
                    value={formData.phone}
                    onChange={phone => setFormData({ ...formData, phone })}
                    placeholder="+20 123 456 7890"
                    specialLabel=""
                    inputProps={{ name: 'phone', required: true }}
                    containerClass="phone-input-container"
                    inputClass="phone-input-field"
                    buttonClass="phone-input-button"
                    searchPlaceholder={isAr ? 'بحث عن دولة' : 'Search country'}
                  />
                </div>
                <div className="input-group">
                  <label>{isAr ? 'سبب الاستشارة (اختياري)' : 'Reason for consultation (Optional)'}</label>
                  <textarea
                    value={formData.reason}
                    onChange={e => setFormData({ ...formData, reason: e.target.value })}
                    placeholder={isAr ? 'ما الذي تود مناقشته؟' : 'What would you like to discuss?'}
                  />
                </div>
                <button type="submit" className="primary-btn submit-btn" disabled={submitting}>
                  {submitting
                    ? (isAr ? 'جاري الإرسال...' : 'Sending...')
                    : selectedSlots.length > 1
                      ? (isAr ? `تأكيد ${selectedSlots.length} مواعيد` : `Confirm ${selectedSlots.length} Sessions`)
                      : (isAr ? 'تأكيد طلب الحجز' : 'Confirm Booking Request')}
                </button>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingPage;
