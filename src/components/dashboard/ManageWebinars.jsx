import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import { Plus, Edit2, Trash2, Users, Save, X, ExternalLink, Mail, Phone, Check, Send } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { sendConfirmationEmail, replaceEmailPlaceholders } from '../../lib/email';

const INITIAL_FORM_STATE = {
  title: '', title_ar: '', description: '', description_ar: '',
  start_time: '', price: 9, is_published: true, capacity: 50, cover_url: '', 
  meeting_link: '', confirmation_email_content: '',
  form_fields: [
     { name: 'name', label_en: 'Name', label_ar: 'الاسم', type: 'text', required: true },
     { name: 'email', label_en: 'Email', label_ar: 'البريد الإلكتروني', type: 'email', required: true }
  ]
};

const ManageWebinars = () => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';

  const [webinars, setWebinars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingWebinar, setEditingWebinar] = useState(null);
  const [viewingRegistrations, setViewingRegistrations] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [isSaving, setIsSaving] = useState(false);
  const [acceptingRegId, setAcceptingRegId] = useState(null);
  const [emailContent, setEmailContent] = useState('');
  const [meetingLink, setMeetingLink] = useState('');

  // ── Data Fetching ──────────────────────────────────────────────────────────

  const fetchWebinars = useCallback(async () => {
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
        .from('webinars')
        .select('*, webinar_registrations(count)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWebinars(data || []);
    } catch (err) {
      if (err.status === 401 || err.message?.toLowerCase().includes('refresh token')) {
        supabase.auth.signOut().then(() => window.location.href = '/dashboard/login');
      } else {
        toast.error(isAr ? 'فشل تحميل الندوات' : 'Failed to load webinars');
      }
    } finally {
      setLoading(false);
    }
  }, [isAr]);

  useEffect(() => {
    fetchWebinars();
  }, [fetchWebinars]);

  // ── Logic Helpers ──────────────────────────────────────────────────────────

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const offset = date.getTimezoneOffset();
    const localDate = new Date(date.getTime() - (offset * 60 * 1000));
    return localDate.toISOString().slice(0, 16);
  };

  /**
   * Sanitizes payload to remove relationship data and local state 
   * before sending to Supabase to avoid 400 Bad Request
   */
  const sanitizeWebinarPayload = (data) => {
    // eslint-disable-next-line no-unused-vars
    const { id, created_at, webinar_registrations, ...cleanData } = data;
    
    return {
      ...cleanData,
      price: Number(cleanData.price),
      capacity: Number(cleanData.capacity),
      // Auto-calculate end_time if missing (default 1 hour)
      end_time: cleanData.end_time || (cleanData.start_time 
        ? new Date(new Date(cleanData.start_time).getTime() + 60 * 60 * 1000).toISOString() 
        : null)
    };
  };

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `covers/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('webinar-covers')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('webinar-covers').getPublicUrl(filePath);
      setFormData(prev => ({ ...prev, cover_url: data.publicUrl }));
      toast.success(isAr ? 'تم رفع الصورة' : 'Image uploaded');
    } catch (err) {
      toast.error(isAr ? 'خطأ في رفع الصورة' : 'Upload error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      const payload = sanitizeWebinarPayload(formData);

      if (editingWebinar) {
        const { error } = await supabase
          .from('webinars')
          .update(payload)
          .eq('id', editingWebinar.id);
        if (error) throw error;
        toast.success(isAr ? 'تم التحديث بنجاح' : 'Updated successfully');
      } else {
        const { error } = await supabase
          .from('webinars')
          .insert([payload]);
        if (error) throw error;
        toast.success(isAr ? 'تم إنشاء الندوة' : 'Webinar created');
      }

      setShowAddForm(false);
      setEditingWebinar(null);
      setFormData(INITIAL_FORM_STATE);
      fetchWebinars();
    } catch (err) {
      console.error('Webinar Save Error:', err);
      toast.error(isAr ? `فشل الحفظ: ${err.message}` : `Save failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const deleteWebinar = async (id) => {
    if (!window.confirm(isAr ? 'حذف هذه الندوة؟' : 'Delete this webinar?')) return;
    try {
      const { error } = await supabase.from('webinars').delete().eq('id', id);
      if (error) throw error;
      fetchWebinars();
      toast.success(isAr ? 'تم الحذف' : 'Deleted');
    } catch (err) {
      toast.error(isAr ? 'فشل الحذف' : 'Deletion failed');
    }
  };

  const fetchRegistrations = async (webinarId) => {
    try {
      const { data, error } = await supabase
        .from('webinar_registrations')
        .select('*')
        .eq('webinar_id', webinarId);
      if (error) throw error;
      setRegistrations(data || []);
      setViewingRegistrations(webinarId);
    } catch (err) {
      toast.error(isAr ? 'فشل تحميل المسجلين' : 'Failed to load registrants');
    }
  };

  const updateRegistrationStatus = async (regId, newStatus, customLink = '', customMessage = '') => {
    setIsSaving(true);
    const reg = registrations.find(r => r.id === regId);
    const webinar = webinars.find(w => w.id === viewingRegistrations);

    try {
      if (newStatus === 'accepted') {
        // Send Email First
        await sendConfirmationEmail({
          name: reg.name,
          email: reg.email,
          date: new Date(webinar.start_time).toLocaleDateString(isAr ? 'ar-EG' : 'en-US'),
          startTime: new Date(webinar.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
          meetingLink: customLink || webinar.meeting_link,
          customMessage: customMessage
        });

        const { error } = await supabase
          .from('webinar_registrations')
          .update({ status: 'accepted' })
          .eq('id', regId);
        if (error) throw error;
        
        toast.success(isAr ? 'تم تأكيد التسجيل وإرسال الإيميل' : 'Registration confirmed and email sent');
      } else {
        const { error } = await supabase
          .from('webinar_registrations')
          .update({ status: newStatus })
          .eq('id', regId);
        if (error) throw error;
        toast.success(isAr ? 'تم تحديث الحالة' : 'Status updated');
      }

      setRegistrations(prev => prev.map(r => r.id === regId ? { ...r, status: newStatus } : r));
      setAcceptingRegId(null);
    } catch (err) {
      console.error('Update Registration Error:', err);
      toast.error(isAr ? `فشل: ${err.message}` : `Failed: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const openAcceptModal = (reg) => {
    const webinar = webinars.find(w => w.id === viewingRegistrations);
    setAcceptingRegId(reg.id);
    const link = webinar.meeting_link || '';
    setMeetingLink(link);
    const content = replaceEmailPlaceholders(webinar.confirmation_email_content, {
      name: reg.name,
      date: new Date(webinar.start_time).toLocaleDateString(isAr ? 'ar-EG' : 'en-US'),
      time: new Date(webinar.start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
      link
    }, isAr);
    setEmailContent(content);
  };

  // ── Render ─────────────────────────────────────────────────────────────────

  if (viewingRegistrations) {
    return (
      <div className="dashboard-content-inner animate-fade-in" dir={isAr ? 'rtl' : 'ltr'}>
        <button onClick={() => setViewingRegistrations(null)} className="back-link mb-4">← {t('dashboard.webinars.title')}</button>
        <div className="dashboard-card">
          <h3 className="section-title-dash">{t('dashboard.webinars.registrations')} ({registrations.length})</h3>
          <div className="table-responsive">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>{t('dashboard.bookings.patient')}</th>
                  <th>{t('auth.email')}</th>
                  <th>{t('dashboard.bookings.status')}</th>
                  <th>{t('dashboard.bookings.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {registrations.map(reg => (
                  <tr key={reg.id}>
                    <td>
                      <div className="patient-info">
                        <div className="patient-name">{reg.name}</div>
                        <div className="contact-item"><Phone size={12} /> {reg.phone || '-'}</div>
                      </div>
                    </td>
                    <td>{reg.email}</td>
                    <td><span className={`status-pill ${reg.status}`}>{t(`dashboard.bookings.${reg.status}`)}</span></td>
                    <td>
                      <div className="action-btns">
                        <button 
                          onClick={() => openAcceptModal(reg)} 
                          className="confirm-btn" 
                          disabled={reg.status === 'accepted'}
                          title={isAr ? 'تأكيد وإرسال إيميل' : 'Confirm and Send Email'}
                        >
                          <Check size={14} />
                        </button>
                        <button 
                          onClick={() => updateRegistrationStatus(reg.id, 'rejected')} 
                          className="delete-btn" 
                          disabled={reg.status === 'rejected'}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Acceptance Modal */}
        {acceptingRegId && (
          <div className="modal-backdrop" onClick={() => setAcceptingRegId(null)}>
            <div className="accept-modal-content animate-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h4>{isAr ? 'تأكيد التسجيل وإرسال الإيميل' : 'Confirm Registration & Send Email'}</h4>
                <button onClick={() => setAcceptingRegId(null)} className="btn-close-modal"><X size={20} /></button>
              </div>
              <div className="email-custom-area">
                <div className="email-field-group">
                  <label>{isAr ? 'رابط الويبينار' : 'Webinar Link'}</label>
                  <input 
                    type="url" 
                    className="dash-input"
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                  />
                </div>
                <div className="email-field-group">
                  <label>{isAr ? 'محتوى الإيميل' : 'Email Content'}</label>
                  <textarea
                    className="dash-textarea"
                    value={emailContent}
                    onChange={(e) => setEmailContent(e.target.value)}
                    style={{ minHeight: '150px' }}
                  />
                </div>
              </div>
              <div className="dialog-actions">
                <button 
                  onClick={() => updateRegistrationStatus(acceptingRegId, 'accepted', meetingLink, emailContent)} 
                  className="btn-accept-send"
                  disabled={isSaving}
                >
                  <Send size={18} /> {isSaving ? t('common.loading') : (isAr ? 'تأكيد وإرسال' : 'Confirm & Send')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="dashboard-content-inner animate-fade-in" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="flex justify-between items-center mb-6">
        <h3 className="section-title-dash m-0"><Users size={20} /> {t('dashboard.webinars.title')}</h3>
        {!showAddForm && (
          <button onClick={() => { setFormData(INITIAL_FORM_STATE); setShowAddForm(true); }} className="primary-btn-dash">
            <Plus size={16} /> {t('dashboard.webinars.create')}
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="dashboard-card mb-6 animate-slide-down">
          <h3 className="section-title-dash">{editingWebinar ? t('dashboard.webinars.edit') : t('dashboard.webinars.create')}</h3>
          <form onSubmit={handleSubmit} className="webinar-form-dash">
            <div className="form-grid-dash">
               <div className="input-group-dash">
                 <label>{t('dashboard.webinars.topic')} (EN)</label>
                 <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
               </div>
               <div className="input-group-dash">
                 <label>{t('dashboard.webinars.topic')} (AR)</label>
                 <input type="text" required value={formData.title_ar} onChange={e => setFormData({...formData, title_ar: e.target.value})} dir="rtl" />
               </div>
               <div className="input-group-dash full-width">
                 <label>{t('dashboard.webinars.description')} (EN)</label>
                 <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} rows={3} />
               </div>
               <div className="input-group-dash full-width">
                 <label>{t('dashboard.webinars.description')} (AR)</label>
                 <textarea value={formData.description_ar} onChange={e => setFormData({...formData, description_ar: e.target.value})} dir="rtl" rows={3} />
               </div>
               <div className="input-group-dash">
                 <label>{t('dashboard.webinars.date')}</label>
                 <input type="datetime-local" required value={formatDateForInput(formData.start_time)} onChange={e => setFormData({...formData, start_time: e.target.value})} />
               </div>
               <div className="input-group-dash">
                 <label>{t('dashboard.webinars.price')} ($)</label>
                 <input type="number" step="0.01" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} />
               </div>
               <div className="input-group-dash">
                 <label>{t('dashboard.webinars.capacity')}</label>
                 <input type="number" required value={formData.capacity} onChange={e => setFormData({...formData, capacity: e.target.value})} />
               </div>
               <div className="input-group-dash">
                 <label>{t('dashboard.webinars.upload_image')}</label>
                 <input type="file" accept="image/*" onChange={handleImageUpload} className="file-input-dash" />
                 {formData.cover_url && <div className="mt-2 preview-img-dash"><img src={formData.cover_url} alt="Cover" /></div>}
               </div>
               <div className="input-group-dash full-width">
                 <label>{t('dashboard.webinars.meeting_link')}</label>
                 <input type="url" value={formData.meeting_link || ''} onChange={e => setFormData({...formData, meeting_link: e.target.value})} />
               </div>
               <div className="input-group-dash full-width">
                 <label>{t('dashboard.webinars.confirmation_email')}</label>
                 <textarea value={formData.confirmation_email_content || ''} onChange={e => setFormData({...formData, confirmation_email_content: e.target.value})} rows={3} />
               </div>
               <div className="input-group-dash full-width" style={{ flexDirection: 'row', alignItems: 'center', gap: '10px', marginTop: '10px' }}>
                 <input 
                   type="checkbox" 
                   id="is_published" 
                   checked={formData.is_published} 
                   onChange={e => setFormData({...formData, is_published: e.target.checked})} 
                   style={{ width: '20px', height: '20px', cursor: 'pointer', margin: 0 }} 
                 />
                 <label htmlFor="is_published" style={{ marginBottom: 0, cursor: 'pointer' }}>
                   {isAr ? 'نشر الندوة (ظهور للجمهور)' : 'Publish Webinar (Visible to public)'}
                 </label>
               </div>
            </div>
            <div className="flex justify-end gap-3 mt-6">
              <button type="button" onClick={() => { setShowAddForm(false); setEditingWebinar(null); }} className="btn-cancel-dash">{t('dashboard.bookings.cancel')}</button>
              <button type="submit" className="btn-save-dash" disabled={isSaving}>
                <Save size={18} /> {isSaving ? t('common.loading') : t('dashboard.webinars.save')}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="dashboard-card">
        {loading ? <div className="loading-state-dash"></div> : (
          <div className="table-responsive">
            <table className="dash-table">
              <thead>
                <tr>
                  <th>{t('dashboard.webinars.topic')}</th>
                  <th>{t('dashboard.webinars.date')}</th>
                  <th>{t('dashboard.webinars.price')}</th>
                  <th>{t('dashboard.bookings.status')}</th>
                  <th>{t('dashboard.webinars.registrants')}</th>
                  <th>{t('dashboard.bookings.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {webinars.map(w => (
                  <tr key={w.id}>
                    <td><div className="patient-name">{isAr ? w.title_ar || w.title : w.title}</div></td>
                    <td><div className="date-badge">{new Date(w.start_time).toLocaleString(isAr ? 'ar-EG' : 'en-US')}</div></td>
                    <td><div className="price-tag">${w.price}</div></td>
                    <td><span className={`status-pill ${w.is_published ? 'published' : 'draft'}`}>{w.is_published ? t('dashboard.webinars.published') : t('dashboard.webinars.draft')}</span></td>
                    <td><div className="registrants-stat"><strong>{w.webinar_registrations?.[0]?.count || 0}</strong> / {w.capacity || 50}</div></td>
                    <td>
                      <div className="action-btns">
                        <button onClick={() => fetchRegistrations(w.id)} className="confirm-btn" title={t('dashboard.webinars.registrations')}><Users size={16} /></button>
                        <button onClick={() => { 
                          setEditingWebinar(w); 
                          setFormData({ ...w, start_time: formatDateForInput(w.start_time) }); 
                          setShowAddForm(true); 
                        }} className="edit-btn"><Edit2 size={16} /></button>
                        <button onClick={() => deleteWebinar(w.id)} className="delete-btn"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default ManageWebinars;
