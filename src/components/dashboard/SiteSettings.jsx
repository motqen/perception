import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import { Save, Settings as SettingsIcon, AlertCircle, CheckCircle2, Upload, Image as ImageIcon } from 'lucide-react';

const SiteSettings = () => {
  const { t, i18n } = useTranslation();
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('site_settings')
      .select('*')
      .maybeSingle();

    if (!error && data) {
      setSettings(data);
    } else {
      setSettings({
        auto_generate_slots: true,
        booking_confirmation_email: '',
      });
    }
    setLoading(false);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate type
    if (!file.type.startsWith('image/')) {
      setMessage({ type: 'error', text: i18n.language === 'ar' ? 'يرجى اختيار ملف صورة صالح.' : 'Please select a valid image file.' });
      return;
    }

    setSaving(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `site-logo-${Math.random()}.${fileExt}`;
    const filePath = `branding/${fileName}`;

    try {
      const { error: uploadError } = await supabase.storage
        .from('content-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('content-images')
        .getPublicUrl(filePath);

      setSettings({ ...settings, site_logo_url: publicUrl });
      setMessage({ type: 'success', text: i18n.language === 'ar' ? 'تم رفع الشعار بنجاح! اضغط حفظ لتطبيق التغييرات.' : 'Logo uploaded successfully! Click save to apply changes.' });
    } catch (error) {
      console.error('Error uploading logo:', error);
      setMessage({ type: 'error', text: i18n.language === 'ar' ? 'فشل رفع الشعار.' : 'Failed to upload logo.' });
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const { id, created_at, updated_at, ...updateData } = settings;

    const targetId = id || '00000000-0000-0000-0000-000000000000';

    const { data: updatedRows, error } = await supabase
      .from('site_settings')
      .update({
        ...updateData,
        updated_at: new Date()
      })
      .eq('id', targetId)
      .select();

    if (error) {
      setMessage({ type: 'error', text: t('dashboard.settings.error') });
    } else if (!updatedRows || updatedRows.length === 0) {
      setMessage({ type: 'error', text: 'لم يتم العثور على الإعدادات أو لا تملك صلاحية التعديل.' });
    } else {
      setMessage({ type: 'success', text: t('dashboard.settings.success') });
      setTimeout(() => setMessage({ type: '', text: '' }), 5000);
    }
    setSaving(false);
  };

  if (loading) return <div className="p-8 text-center">{t('common.loading')}</div>;

  return (
    <div className="dashboard-content-inner animate-fade-in" dir={i18n.language === 'ar' ? 'rtl' : 'ltr'}>
      <div className="dashboard-card max-w-4xl">
        <div className="flex-between mb-6">
          <h3 className="section-title-dash"><SettingsIcon size={20} /> {t('dashboard.settings.title')}</h3>
        </div>

        <p className="help-text mb-8">{t('dashboard.settings.desc')}</p>

        {message.text && (
          <div className={`alert-dash ${message.type} animate-slide-in`}>
            {message.type === 'success' ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            {message.text}
          </div>
        )}

        <form onSubmit={handleSave} className="settings-form-grid">
          <div className="form-grid">
            {/* Auto-generate slots toggle */}
            <div className="input-group checkbox full-width">
              <label className="flex gap-3 items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={!!settings.auto_generate_slots}
                  onChange={e => setSettings({ ...settings, auto_generate_slots: e.target.checked })}
                />
                <span>{t('dashboard.settings.auto_gen_slots')}</span>
              </label>
            </div>

            {/* Site Logo Section */}
            <div className="input-group full-width mt-4 mb-6">
              <label><ImageIcon size={18} /> {i18n.language === 'ar' ? 'شعار الموقع' : 'Site Logo'}</label>
              <div className="flex gap-6 items-center flex-wrap bg-soft p-4 rounded-xl border border-dashed border-border-color">
                {settings.site_logo_url ? (
                  <div className="relative group">
                    <img 
                      src={settings.site_logo_url} 
                      alt="Current Logo" 
                      className="h-16 w-auto object-contain bg-white p-2 rounded-lg shadow-sm"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex-center transition-opacity rounded-lg">
                       <span className="text-white text-[10px] font-bold uppercase">{i18n.language === 'ar' ? 'تعديل' : 'Edit'}</span>
                    </div>
                  </div>
                ) : (
                  <div className="h-16 w-16 bg-white rounded-lg flex-center border border-border-color border-dashed">
                    <ImageIcon className="text-muted" size={24} />
                  </div>
                )}
                
                <div className="flex-1 min-w-[200px]">
                  <p className="text-xs text-muted mb-3">
                    {i18n.language === 'ar' ? 'يفضل استخدام شعار بخلفية شفافة (PNG) وبحجم مناسب.' : 'Recommended: Transparent PNG, high resolution.'}
                  </p>
                  <label className="secondary-btn cursor-pointer inline-flex items-center gap-2">
                    <Upload size={16} />
                    {i18n.language === 'ar' ? 'رفع شعار جديد' : 'Upload New Logo'}
                    <input 
                      type="file" 
                      className="hidden" 
                      accept="image/*"
                      onChange={handleLogoUpload}
                      disabled={saving}
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Site Titles */}
            <div className="input-group">
              <label>{i18n.language === 'ar' ? 'اسم الموقع (بالعربية)' : 'Site Title (Arabic)'}</label>
              <input
                type="text"
                value={settings.site_title_ar || ''}
                onChange={e => setSettings({ ...settings, site_title_ar: e.target.value })}
                placeholder="وقاية"
              />
            </div>
            <div className="input-group">
              <label>{i18n.language === 'ar' ? 'اسم الموقع (بالإنجليزية)' : 'Site Title (English)'}</label>
              <input
                type="text"
                value={settings.site_title_en || ''}
                onChange={e => setSettings({ ...settings, site_title_en: e.target.value })}
                placeholder="Wiqaiah"
              />
            </div>
            
            <div className="input-group full-width">
              <label>{i18n.language === 'ar' ? 'المنطقة الزمنية للمركز' : 'Clinic Timezone'}</label>
              <select 
                value={settings.site_timezone || 'Africa/Cairo'}
                onChange={e => setSettings({ ...settings, site_timezone: e.target.value })}
              >
                <option value="Africa/Cairo">Cairo (GMT+2)</option>
                <option value="Asia/Riyadh">Riyadh (GMT+3)</option>
                <option value="Asia/Dubai">Dubai (GMT+4)</option>
                <option value="UTC">UTC</option>
                <option value="Europe/London">London (GMT+0)</option>
              </select>
              <small className="help-text">
                {i18n.language === 'ar' ? 'سيتم تحويل المواعيد للمستخدمين بناءً على هذه المنطقة.' : 'Available slots will be converted for users based on this timezone.'}
              </small>
            </div>

            {/* Recovery Email Section */}
            <div className="input-group full-width mt-4">
              <label><AlertCircle size={18} /> {t('dashboard.settings.recovery_email')}</label>
              <input
                type="email"
                value={settings.recovery_email || ''}
                onChange={e => setSettings({ ...settings, recovery_email: e.target.value })}
                placeholder="backup@example.com"
              />
              <small className="help-text">
                {t('dashboard.settings.recovery_email_desc')}
              </small>
            </div>

            {/* Booking confirmation email template */}
            <div className="input-group full-width mt-4">
              <label>{t('dashboard.settings.email_template')}</label>
              <textarea
                rows="6"
                value={settings.booking_confirmation_email || ''}
                onChange={e => setSettings({ ...settings, booking_confirmation_email: e.target.value })}
                placeholder="Dear {name}, your session is confirmed for {date} at {time}. Join here: {link}"
              />
              <small className="help-text">
                Available placeholders: {'{name}, {date}, {time}, {link}'}
              </small>
            </div>
          </div>

          <div className="flex-end mt-8 pt-6 border-t border-soft">
            <button
              type="submit"
              className="primary-btn flex gap-2 items-center min-w-[150px] justify-center"
              disabled={saving}
            >
              <Save size={18} />
              {saving ? t('dashboard.settings.saving') : t('dashboard.settings.save_btn')}
            </button>
          </div>
        </form>

        {/* Change Password Section */}
        <div className="mt-12 pt-12 border-t border-border-color">
          <h3 className="section-title-dash mb-6"><AlertCircle size={20} /> {t('dashboard.settings.security_title')}</h3>
          <form onSubmit={async (e) => {
            e.preventDefault();
            const newPassword = e.target.new_password.value;
            const confirmPassword = e.target.confirm_password.value;

            if (newPassword !== confirmPassword) {
              setMessage({ type: 'error', text: t('dashboard.settings.password_mismatch') });
              return;
            }

            setSaving(true);
            const { error } = await supabase.auth.updateUser({ password: newPassword });
            
            if (error) {
              setMessage({ type: 'error', text: t('dashboard.settings.password_error') });
            } else {
              setMessage({ type: 'success', text: t('dashboard.settings.password_success') });
              e.target.reset();
            }
            setSaving(false);
          }} className="settings-form-grid">
            <div className="form-grid">
              <div className="input-group">
                <label>{t('dashboard.settings.new_password')}</label>
                <input name="new_password" type="password" required minLength={6} />
              </div>
              <div className="input-group">
                <label>{t('dashboard.settings.confirm_password')}</label>
                <input name="confirm_password" type="password" required minLength={6} />
              </div>
            </div>
            <div className="flex-end mt-6">
              <button type="submit" className="secondary-btn" disabled={saving}>
                {t('dashboard.settings.change_password')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SiteSettings;
