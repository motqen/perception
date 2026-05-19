import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import {
  FileText, Save, CheckCircle2, AlertCircle, Plus, Trash2,
  ChevronRight, Globe, Type, DollarSign, Upload, Image as ImageIcon
} from 'lucide-react';

const SECTIONS = [
  { key: 'pricing',      label: 'Pricing & Discounts', labelAr: 'الأسعار والخصومات', special: true },
  { key: 'hero',         label: 'Hero Section',         labelAr: 'القسم الرئيسي' },
  { key: 'confirmations', label: 'Confirmation Messages', labelAr: 'رسائل التأكيد' },
  { key: 'benefits',     label: 'Benefits',             labelAr: 'الفوائد' },
  { key: 'who_its_for',  label: "Who It's For",         labelAr: 'من هو المستفيد' },
  { key: 'how_it_works', label: 'How It Works',         labelAr: 'كيف تعمل الخدمة' },
  { key: 'disclaimer',   label: 'Disclaimer',           labelAr: 'إخلاء المسؤولية' },
  { key: 'faq',          label: 'FAQ',                  labelAr: 'الأسئلة الشائعة' },
  { key: 'offer',        label: 'Offer Section',        labelAr: 'قسم العرض' },
  { key: 'footer',       label: 'Footer',               labelAr: 'التذييل' },
];

const LIST_KEY_PREFIXES = {
  who_its_for: 'point_',
  faq: 'q_',
  how_it_works: null,
  offer: 'perk_',
};

import { invalidatePricingCache } from '../../hooks/usePricing';

// ─── Pricing Section (reads/writes site_settings) ────────────────────────────
const PricingSection = () => {
  const [pricing, setPricing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    supabase.from('site_settings').select('*').maybeSingle().then(({ data }) => {
      if (data) setPricing(data);
    });
  }, []);

  const handleSave = async () => {
    if (!pricing) return;
    setSaving(true);
    setMessage({ type: '', text: '' });
    
    // Remove non-updatable properties (like id and created_at)
    const { id, created_at, updated_at, ...updateData } = pricing;
    
    // Explicitly fallback id to proper UUID if it is undefined, to target the singleton row
    const targetId = id || '00000000-0000-0000-0000-000000000000';

    const { data: updatedRows, error } = await supabase
      .from('site_settings')
      .update({ ...updateData, updated_at: new Date() })
      .eq('id', targetId)
      .select();
      
    if (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'حدث خطأ أثناء الحفظ: ' + error.message });
    } else if (!updatedRows || updatedRows.length === 0) {
      console.error('No rows updated. Target ID was:', targetId, pricing);
      setMessage({ type: 'error', text: 'لم يتم العثور على الإعدادات أو لا تملك صلاحية التعديل.' });
    } else {
      invalidatePricingCache();
      setMessage({ type: 'success', text: 'تم حفظ الأسعار بنجاح! ✓' });
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    }

    setSaving(false);
  };

  if (!pricing) return <div className="p-8 text-center">جاري التحميل...</div>;

  return (
    <div>
      {message.text && (
        <div className={`alert-dash ${message.type} animate-slide-in mb-4`}>
          {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {message.text}
        </div>
      )}

      <div className="cms-pricing-grid">
        {/* Price */}
        <div className="cms-pricing-card">
          <label className="cms-pricing-label">سعر الاستشارة ($)</label>
          <input
            className="cms-input"
            type="number" step="0.01" min="0"
            value={pricing.consultation_price ?? ''}
            onChange={e => setPricing({ ...pricing, consultation_price: e.target.value === '' ? '' : parseFloat(e.target.value) })}
          />
          <p className="help-text">يظهر في: الصفحة الرئيسية (Hero) + قسم العرض (Offer)</p>
        </div>

        {/* Discount */}
        <div className="cms-pricing-card">
          <label className="cms-pricing-label">نسبة الخصم (%)</label>
          <input
            className="cms-input"
            type="number" min="0" max="100"
            value={pricing.discount_percentage ?? ''}
            onChange={e => setPricing({ ...pricing, discount_percentage: e.target.value === '' ? '' : parseInt(e.target.value) })}
          />
          <p className="help-text">يُطبَّق تلقائياً على سعر الاستشارة عند تفعيل الخصم</p>
        </div>

        {/* Discount Texts */}
        <div className="cms-pricing-card">
          <label className="cms-pricing-label">نص شارة الخصم (إنجليزي)</label>
          <input
            className="cms-input"
            type="text" dir="ltr"
            value={pricing.discount_text_en ?? ''}
            onChange={e => setPricing({ ...pricing, discount_text_en: e.target.value })}
            placeholder="e.g. 10% OFF FIRST SESSION"
          />
        </div>

        {/* Discount Badge AR */}
        <div className="cms-pricing-card">
          <label className="cms-pricing-label">نص شارة الخصم (عربي)</label>
          <input
            className="cms-input"
            type="text" dir="rtl"
            value={pricing.discount_text_ar ?? ''}
            onChange={e => setPricing({ ...pricing, discount_text_ar: e.target.value })}
            placeholder="مثال: خصم 10% على أول جلسة"
          />
        </div>

        {/* Show Discount Toggle */}
        <div className="cms-pricing-card full-span">
          <label className="flex gap-3 items-center cursor-pointer">
            <input
              type="checkbox"
              checked={!!pricing.show_discount}
              onChange={e => setPricing({ ...pricing, show_discount: e.target.checked })}
            />
            <span className="cms-pricing-label" style={{ margin: 0 }}>
              إظهار شارة الخصم على الصفحة الرئيسية
            </span>
          </label>
          <p className="help-text mt-1">عند التفعيل، يظهر السعر القديم والجديد مع نص الخصم</p>
        </div>
      </div>

      <div className="flex-end mt-6">
        <button className="primary-btn flex gap-2 items-center" onClick={handleSave} disabled={saving}>
          <Save size={16} />
          {saving ? 'جاري الحفظ...' : 'حفظ الأسعار'}
        </button>
      </div>
    </div>
  );
};

// ─── Main ManageContent Component ────────────────────────────────────────────
const ManageContent = () => {
  const { i18n } = useTranslation();
  const dir = i18n.language === 'ar' ? 'rtl' : 'ltr';

  const [activeSection, setActiveSection] = useState('pricing');
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const isPricingSection = activeSection === 'pricing';

  const fetchSection = useCallback(async (section) => {
    if (section === 'pricing') return;
    setLoading(true);
    setMessage({ type: '', text: '' });
    const { data, error } = await supabase
      .from('page_content')
      .select('*')
      .eq('section', section)
      .order('sort_order');
    if (!error) setRows(data || []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSection(activeSection);
  }, [activeSection, fetchSection]);

  const handleChange = (id, field, value) => {
    setRows(prev => prev.map(r => r.id === id ? { ...r, [field]: value } : r));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage({ type: '', text: '' });
    const updates = rows.map(({ id, value_en, value_ar, sort_order }) =>
      supabase.from('page_content').update({ value_en, value_ar, sort_order, updated_at: new Date() }).eq('id', id)
    );
    const results = await Promise.all(updates);
    const hasError = results.some(r => r.error);
    if (hasError) {
      setMessage({ type: 'error', text: 'حدث خطأ أثناء الحفظ. حاول مرة أخرى.' });
    } else {
      setMessage({ type: 'success', text: 'تم الحفظ بنجاح! ✓' });
      setTimeout(() => setMessage({ type: '', text: '' }), 4000);
    }
    setSaving(false);
  };

  const handleImageUpload = async (id, file) => {
    if (!file) return;
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random()}.${fileExt}`;
    const filePath = `${activeSection}/${fileName}`;

    console.log('Uploading image to content-images:', filePath);

    const { error: uploadError } = await supabase.storage
      .from('content-images')
      .upload(filePath, file);

    if (uploadError) {
      console.error('Storage Upload Error:', uploadError);
      setMessage({ type: 'error', text: 'خطأ في رفع الصورة: ' + (uploadError.message || 'فشل الاتصال بمزود الخدمة') });
      setLoading(false);
      return;
    }

    const { data } = supabase.storage.from('content-images').getPublicUrl(filePath);
    const publicUrl = data.publicUrl;
    console.log('Generated Public URL:', publicUrl);

    if (!publicUrl || !publicUrl.includes('/public/')) {
       console.error('Malformed public URL generated:', publicUrl);
       setMessage({ type: 'error', text: 'خطأ في توليد رابط الصورة. يرجى المحاولة مرة أخرى.' });
       setLoading(false);
       return;
    }

    // Update locally and in DB immediately for images
    const { error: dbError } = await supabase
      .from('page_content')
      .update({ value_en: publicUrl, value_ar: publicUrl, updated_at: new Date() })
      .eq('id', id);

    if (!dbError) {
      setRows(prev => prev.map(r => r.id === id ? { ...r, value_en: publicUrl, value_ar: publicUrl } : r));
      setMessage({ type: 'success', text: 'تم رفع الصورة وحفظها بنجاح! ✓' });
    } else {
      console.error('Database Update Error:', dbError);
      setMessage({ type: 'error', text: 'تم رفع الصورة ولكن فشل حفظها في قاعدة البيانات.' });
    }
    setLoading(false);
  };

  const handleAddItem = async () => {
    const prefix = LIST_KEY_PREFIXES[activeSection];
    if (!prefix) return;
    const existingNums = rows
      .filter(r => r.key.startsWith(prefix))
      .map(r => parseInt(r.key.replace(prefix, '')) || 0);
    const nextNum = existingNums.length > 0 ? Math.max(...existingNums) + 1 : 1;
    const newKey = `${prefix}${nextNum}`;
    const newOrder = rows.length + 1;
    const { data, error } = await supabase
      .from('page_content')
      .insert([{ section: activeSection, key: newKey, value_en: '', value_ar: '', sort_order: newOrder }])
      .select().single();
    if (!error && data) setRows(prev => [...prev, data]);
  };

  const handleAddStep = async () => {
    const stepNums = rows
      .filter(r => r.key.startsWith('step_') && r.key.endsWith('_title'))
      .map(r => parseInt(r.key.split('_')[1]) || 0);
    const nextNum = stepNums.length > 0 ? Math.max(...stepNums) + 1 : 1;
    const baseOrder = rows.length + 1;
    const inserts = [
      { section: activeSection, key: `step_${nextNum}_title`, value_en: '', value_ar: '', sort_order: baseOrder },
      { section: activeSection, key: `step_${nextNum}_text`, value_en: '', value_ar: '', sort_order: baseOrder + 1 },
    ];
    const { data, error } = await supabase.from('page_content').insert(inserts).select();
    if (!error && data) setRows(prev => [...prev, ...data]);
  };

  const handleDelete = async (id, key) => {
    const { error } = await supabase.from('page_content').delete().eq('id', id);
    if (!error) setRows(prev => prev.filter(r => r.id !== id));
    if (activeSection === 'how_it_works') {
      const base = key.replace(/_title$/, '').replace(/_text$/, '');
      const pairedKey = key.endsWith('_title') ? `${base}_text` : `${base}_title`;
      const paired = rows.find(r => r.key === pairedKey);
      if (paired) {
        await supabase.from('page_content').delete().eq('id', paired.id);
        setRows(prev => prev.filter(r => r.id !== paired.id));
      }
    }
  };

  const canAddItems = Object.keys(LIST_KEY_PREFIXES).includes(activeSection);
  const isStepsSection = activeSection === 'how_it_works';

  const renderRows = () => {
    if (isStepsSection) {
      const stepNums = [...new Set(
        rows.filter(r => r.key.startsWith('step_')).map(r => parseInt(r.key.split('_')[1]))
      )].sort((a, b) => a - b);
      const normalRows = rows.filter(r => !r.key.startsWith('step_'));
      const stepRows = stepNums.map(n => ({
        num: n,
        title: rows.find(r => r.key === `step_${n}_title`),
        text: rows.find(r => r.key === `step_${n}_text`),
      }));
      return (
        <>
          {normalRows.map(row => <FieldRow key={row.id} row={row} onChange={handleChange} onImageUpload={handleImageUpload} showDelete={false} />)}
          {stepRows.map(({ num, title, text }) => (
            <div key={num} className="cms-step-group">
              <div className="cms-step-header">
                <span>📋 Step {num}</span>
                <button className="cms-delete-btn" onClick={() => {
                  if (title) handleDelete(title.id, title.key);
                  if (text) handleDelete(text.id, text.key);
                }}><Trash2 size={14} /></button>
              </div>
              {title && <FieldRow row={title} onChange={handleChange} onImageUpload={handleImageUpload} showDelete={false} labelOverride="Title" />}
              {text && <FieldRow row={text} onChange={handleChange} onImageUpload={handleImageUpload} showDelete={false} labelOverride="Text" />}
            </div>
          ))}
        </>
      );
    }
    const prefix = LIST_KEY_PREFIXES[activeSection];
    return rows.map(row => (
      <FieldRow
        key={row.id}
        row={row}
        onChange={handleChange}
        onDelete={() => handleDelete(row.id, row.key)}
        onImageUpload={handleImageUpload}
        showDelete={prefix && row.key.startsWith(prefix)}
      />
    ));
  };

  const activeSectionInfo = SECTIONS.find(s => s.key === activeSection);

  return (
    <div className="dashboard-content-inner animate-fade-in" dir={dir}>
      <div className="cms-layout">
        {/* Sidebar */}
        <div className="cms-sidebar">
          <div className="cms-sidebar-header">
            <FileText size={16} />
            <span>أقسام الموقع</span>
          </div>
          {SECTIONS.map(sec => (
            <button
              key={sec.key}
              className={`cms-section-btn ${activeSection === sec.key ? 'active' : ''}`}
              onClick={() => setActiveSection(sec.key)}
            >
              <span>
                {sec.special && <DollarSign size={13} style={{ display: 'inline', marginLeft: '4px' }} />}
                {i18n.language === 'ar' ? sec.labelAr : sec.label}
              </span>
              {activeSection === sec.key && <ChevronRight size={14} />}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="cms-main">
          <div className="cms-main-header">
            <div>
              <h3 className="section-title-dash">
                <Type size={18} />
                {i18n.language === 'ar' ? activeSectionInfo?.labelAr : activeSectionInfo?.label}
              </h3>
              <p className="help-text">
                {isPricingSection
                  ? 'تغيير الأسعار هنا يُحدِّث تلقائياً كل مكان في الموقع'
                  : 'تعديل النص باللغتين ثم اضغط "حفظ التغييرات"'}
              </p>
            </div>
            {!isPricingSection && (
              <div className="cms-header-actions">
                {canAddItems && (
                  <button
                    className="secondary-btn flex gap-2 items-center"
                    onClick={isStepsSection ? handleAddStep : handleAddItem}
                  >
                    <Plus size={15} />
                    {isStepsSection ? 'إضافة خطوة' : 'إضافة عنصر'}
                  </button>
                )}
                <button
                  className="primary-btn flex gap-2 items-center"
                  onClick={handleSave}
                  disabled={saving}
                >
                  <Save size={16} />
                  {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                </button>
              </div>
            )}
          </div>

          {!isPricingSection && message.text && (
            <div className={`alert-dash ${message.type} animate-slide-in mb-4`}>
              {message.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
              {message.text}
            </div>
          )}

          {isPricingSection ? (
            <PricingSection />
          ) : (
            <>
              <div className="cms-lang-header">
                <div className="cms-lang-badge"><Globe size={13} /> English</div>
                <div className="cms-lang-badge"><Globe size={13} /> العربية</div>
              </div>
              {loading ? (
                <div className="p-8 text-center">جاري التحميل...</div>
              ) : (
                <div className="cms-fields">{renderRows()}</div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// ─── FieldRow ─────────────────────────────────────────────────────────────────
const FieldRow = ({ row, onChange, onDelete, onImageUpload, showDelete, labelOverride }) => {
  const label = labelOverride || formatKey(row.key);
  const isImage = row.key.includes('image_url') || row.key.includes('img_url') || row.key.includes('cover_url');
  const isTextarea = !isImage && (row.value_en?.length > 80 || row.value_ar?.length > 80
    || ['content', 'subtitle', 'replaces', 'text', 'disclaimer', 'message'].some(k => row.key.includes(k)));

  if (isImage) {
    return (
      <div className="cms-field-row">
        <div className="cms-field-label">
           <ImageIcon size={14} />
           <span>{label}</span>
        </div>
        <div className="cms-field-inputs" style={{ gridTemplateColumns: '1fr' }}>
           <div className="flex items-center gap-4">
              {row.value_en && (
                <div className="relative group">
                  <img src={row.value_en} alt="Preview" className="h-20 w-32 object-cover rounded-lg border-2 border-brand-dark" />
                </div>
              )}
              <div className="flex-1">
                <div className="relative">
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={e => onImageUpload(row.id, e.target.files[0])}
                  />
                  <div className="cms-input flex items-center justify-center gap-2 bg-white border-dashed border-2">
                    <Upload size={16} />
                    <span>رفع صورة جديدة</span>
                  </div>
                </div>
                <p className="help-text mt-1">المقاس المفضل: 800x600 بكسل</p>
              </div>
           </div>
        </div>
      </div>
    );
  }

  return (
    <div className="cms-field-row">
      <div className="cms-field-label">
        {showDelete && (
          <button className="cms-delete-btn" onClick={onDelete} title="حذف">
            <Trash2 size={13} />
          </button>
        )}
        <span>{label}</span>
      </div>
      <div className="cms-field-inputs">
        {isTextarea ? (
          <>
            <textarea className="cms-input" value={row.value_en || ''} onChange={e => onChange(row.id, 'value_en', e.target.value)} placeholder="English text..." rows={3} />
            <textarea className="cms-input" value={row.value_ar || ''} onChange={e => onChange(row.id, 'value_ar', e.target.value)} placeholder="النص العربي..." rows={3} dir="rtl" />
          </>
        ) : (
          <>
            <input className="cms-input" type="text" value={row.value_en || ''} onChange={e => onChange(row.id, 'value_en', e.target.value)} placeholder="English text..." />
            <input className="cms-input" type="text" value={row.value_ar || ''} onChange={e => onChange(row.id, 'value_ar', e.target.value)} placeholder="النص العربي..." dir="rtl" />
          </>
        )}
      </div>
    </div>
  );
};

const formatKey = (key) => key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

export default ManageContent;
