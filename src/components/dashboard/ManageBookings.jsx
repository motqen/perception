import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import { Check, X, Trash2, Mail, Phone, Users, ExternalLink, Send } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { sendConfirmationEmail, replaceEmailPlaceholders } from '../../lib/email';

/**
 * ManageBookings Component
 * Handles viewing, approving, and managing patient consultation bookings.
 */
const ManageBookings = () => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [acceptingId, setAcceptingId] = useState(null);
  const [sessionLink, setSessionLink] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [siteSettings, setSiteSettings] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [summaryId, setSummaryId] = useState(null);
  const [summaryText, setSummaryText] = useState('');

  // ── Data Fetching ──────────────────────────────────────────────────────────

  const fetchSiteSettings = async () => {
    const { data } = await supabase.from('site_settings').select('*').single();
    if (data) setSiteSettings(data);
  };

  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Check Session First
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        await supabase.auth.signOut();
        window.location.href = '/dashboard/login';
        return;
      }

      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          availability (
            date,
            start_time,
            end_time
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBookings(data || []);
    } catch (err) {
      if (err.status === 401 || err.message?.toLowerCase().includes('refresh token')) {
        supabase.auth.signOut().then(() => window.location.href = '/dashboard/login');
      } else {
        toast.error(isAr ? 'فشل في تحميل الحجوزات' : 'Failed to load bookings');
      }
    } finally {
      setLoading(false);
    }
  }, [isAr]);

  useEffect(() => {
    fetchBookings();
    fetchSiteSettings();
  }, [fetchBookings]);

  // ── Logic Helpers ──────────────────────────────────────────────────────────

  /**
   * Replaces placeholders in email templates with actual data
   */
  const getPreparedEmail = (template, booking, link) => {
    return replaceEmailPlaceholders(template, {
      name: booking.name,
      date: new Date(booking.availability?.date).toLocaleDateString(isAr ? 'ar-EG' : 'en-US'),
      time: `${booking.availability?.start_time?.slice(0, 5)} - ${booking.availability?.end_time?.slice(0, 5)}`,
      link
    }, isAr);
  };

  // ── Event Handlers ─────────────────────────────────────────────────────────

  const handleBookingAction = async (id, status, meetingLink = '', customEmail = '') => {
    setIsUpdating(true);
    const booking = bookings.find(b => b.id === id);
    
    try {
      if (status === 'accepted') {
        // 1. Try sending the email first
        await sendConfirmationEmail({
          name: booking.name,
          email: booking.email,
          date: booking.availability?.date,
          startTime: booking.availability?.start_time?.slice(0, 5),
          meetingLink,
          customMessage: customEmail
        });

        // 2. If email successful, update Database Status
        const { error: dbError } = await supabase
          .from('bookings')
          .update({ status: 'accepted', meeting_link: meetingLink })
          .eq('id', id);
          
        if (dbError) throw new Error(`${isAr ? 'تم إرسال الإيميل ولكن فشل تحديث القاعدة' : 'Email sent but failed to update database'}: ${dbError.message}`);
        
        toast.success(isAr ? 'تم تأكيد الحجز وإرسال الإيميل' : 'Booking confirmed and email sent');
      } else {
        // For rejections or status reverts, direct DB update
        const { error } = await supabase.from('bookings').update({ status }).eq('id', id);
        if (error) throw error;
        
        if (status === 'rejected') {
          toast.success(isAr ? 'تم رفض الحجز' : 'Booking rejected');
        }
      }

      // Cleanup
      setAcceptingId(null);
      setSessionLink('');
      setEmailContent('');
      fetchBookings();
    } catch (err) {
      console.error('Booking Action Error:', err);
      toast.error(isAr ? `خطأ: ${err.message}` : `Error: ${err.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSendSummary = async () => {
    if (!summaryText || !summaryId) return;
    setIsUpdating(true);
    const booking = bookings.find(b => b.id === summaryId);

    try {
      await sendConfirmationEmail({
        name: booking.name,
        email: booking.email,
        date: new Date(booking.availability.date).toLocaleDateString(),
        startTime: booking.availability.start_time,
        meetingLink: booking.meeting_link || '',
        customMessage: summaryText
      });
      toast.success(isAr ? 'تم إرسال الملخص بنجاح!' : 'Summary sent successfully!');
      setSummaryId(null);
      setSummaryText('');
    } catch (err) {
      toast.error(isAr ? 'فشل إرسال الملخص. تأكد من إعدادات البريد.' : 'Failed to send summary. Check settings.');
    } finally {
      setIsUpdating(false);
    }
  };

  const deleteBooking = async (id, availability_id) => {
    if (!window.confirm(isAr ? 'هل أنت متأكد من حذف هذا السجل؟' : 'Are you sure you want to delete this record?')) return;
    
    try {
      const { error } = await supabase.from('bookings').delete().eq('id', id);
      if (error) throw error;
      
      // Release the slot
      await supabase.from('availability').update({ is_booked: false }).eq('id', availability_id);
      fetchBookings();
      toast.success(isAr ? 'تم الحذف' : 'Deleted successfully');
    } catch (err) {
      toast.error(isAr ? 'خطأ في الحذف' : 'Deletion error');
    }
  };

  // ── Render Helpers ─────────────────────────────────────────────────────────

  const sortedBookings = useMemo(() => {
    return [...bookings].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  }, [bookings]);

  return (
    <div className="dashboard-content-inner animate-fade-in" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="dashboard-card">
        <div className="flex justify-between items-center mb-6">
          <h3 className="section-title-dash m-0"><Users size={20} /> {t('dashboard.bookings.title')}</h3>
          <button onClick={fetchBookings} className="refresh-btn-dash" title="Refresh">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.85.83 6.72 2.24L21 8"/><path d="M21 3v5h-5"/></svg>
          </button>
        </div>

        {loading && bookings.length === 0 ? (
          <div className="loading-state-dash">
            <p>{t('common.loading')}</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>{t('dashboard.bookings.patient')}</th>
                  <th>{t('dashboard.bookings.date_time')}</th>
                  <th>{t('dashboard.bookings.reason')}</th>
                  <th>{t('dashboard.bookings.status')}</th>
                  <th>{t('dashboard.bookings.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {sortedBookings.map(booking => (
                  <tr key={booking.id} className="dash-tr">
                    <td>
                      <div className="patient-info">
                        <div className="patient-name">{booking.name}</div>
                        <div className="patient-contact">
                          <div className="contact-item">
                            <Mail size={12} />
                            <span>{booking.email}</span>
                          </div>
                          {booking.phone && (
                            <div className="contact-item">
                              <Phone size={12} />
                              <span>{booking.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="booking-datetime">
                        <span className="date-badge">
                          {new Date(booking.availability?.date).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}
                        </span>
                        <div className="time-sub">
                          {booking.availability?.start_time?.slice(0, 5)} - {booking.availability?.end_time?.slice(0, 5)}
                        </div>
                      </div>
                    </td>
                    <td>
                      <div className="reason-cell-wrapper">
                        <p className="reason-cell" title={booking.reason}>{booking.reason || '-'}</p>
                      </div>
                    </td>
                    <td>
                      <span className={`status-pill ${booking.status}`}>
                        {t(`dashboard.bookings.${booking.status}`)}
                      </span>
                    </td>
                    <td>
                      <div className="action-btns">
                        {booking.status === 'pending' && (
                          <>
                            <button 
                              onClick={() => {
                                setAcceptingId(booking.id);
                                const link = 'https://zoom.us/j/your-id';
                                setSessionLink(link);
                                setEmailContent(getPreparedEmail(siteSettings?.booking_confirmation_email, booking, link));
                              }} 
                              className="confirm-btn" 
                              title={t('dashboard.bookings.accepted')}
                            >
                              <Check size={16} />
                            </button>
                            <button 
                              onClick={() => handleBookingAction(booking.id, 'rejected')} 
                              className="reject-btn" 
                              title={t('dashboard.bookings.rejected')}
                            >
                              <X size={16} />
                            </button>
                          </>
                        )}
                        
                        {booking.status === 'accepted' && (
                          <div className="flex flex-col gap-2">
                             {booking.meeting_link && (
                               <a href={booking.meeting_link} target="_blank" rel="noreferrer" className="link-info-pill">
                                 <ExternalLink size={12} /> {isAr ? 'الرابط' : 'Link'}
                               </a>
                             )}
                             {new Date(`${booking.availability?.date}T${booking.availability?.start_time}`) < new Date() && (
                               <button onClick={() => setSummaryId(booking.id)} className="summary-btn-action">
                                 <Send size={14} /> {isAr ? 'ملخص' : 'Summary'}
                               </button>
                             )}
                          </div>
                        )}

                        <button onClick={() => deleteBooking(booking.id, booking.availability_id)} className="delete-btn" title={t('common.delete')}>
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                
                {bookings.length === 0 && (
                  <tr>
                    <td colSpan="5" className="empty-table-msg">{t('dashboard.bookings.no_bookings')}</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────── */}

      {/* Accept Booking Modal */}
      {acceptingId && (
        <div className="modal-backdrop" onClick={() => setAcceptingId(null)}>
          <div className="accept-modal-content animate-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h4>{t('dashboard.bookings.accept_dialog_title')}</h4>
              <button onClick={() => setAcceptingId(null)} className="btn-close-modal"><X size={20} /></button>
            </div>
            <div className="email-custom-area">
              <div className="email-field-group">
                <label>{t('dashboard.bookings.placeholder_link')}</label>
                <input 
                  type="url" 
                  className="dash-input"
                  value={sessionLink}
                  onChange={(e) => {
                    setSessionLink(e.target.value);
                    const b = bookings.find(x => x.id === acceptingId);
                    setEmailContent(getPreparedEmail(siteSettings?.booking_confirmation_email, b, e.target.value));
                  }}
                  autoFocus 
                />
              </div>
              <div className="email-field-group">
                <label>{t('dashboard.bookings.email_label')}</label>
                <textarea
                  className="dash-textarea"
                  value={emailContent}
                  onChange={(e) => setEmailContent(e.target.value)}
                  placeholder={t('dashboard.bookings.placeholder_email')}
                />
              </div>
            </div>
            <div className="dialog-actions">
              <button 
                onClick={() => handleBookingAction(acceptingId, 'accepted', sessionLink, emailContent)} 
                className="btn-accept-send"
                disabled={isUpdating}
              >
                <Check size={18} /> {isUpdating ? t('common.loading') : t('dashboard.bookings.send_link_btn')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Summary Modal */}
      {summaryId && (
        <div className="modal-backdrop" onClick={() => setSummaryId(null)}>
          <div className="accept-modal-content animate-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h4>{isAr ? 'إرسال ملخص الجلسة' : 'Send Session Summary'}</h4>
              <button onClick={() => setSummaryId(null)} className="btn-close-modal"><X size={20} /></button>
            </div>
            <div className="email-custom-area">
              <div className="email-field-group">
                <label>{isAr ? 'ملخص الجلسة والخطوات القادمة' : 'Session Summary & Next Steps'}</label>
                <textarea
                  className="dash-textarea"
                  style={{ minHeight: '200px' }}
                  value={summaryText}
                  onChange={(e) => setSummaryText(e.target.value)}
                />
              </div>
            </div>
            <div className="dialog-actions">
              <button 
                onClick={handleSendSummary} 
                className="btn-accept-send"
                disabled={isUpdating || !summaryText}
              >
                <Mail size={18} /> {isUpdating ? t('common.loading') : (isAr ? 'إرسال للمريض' : 'Send Email')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageBookings;
