import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { useTranslation } from 'react-i18next';
import { 
  Trash2, Plus, Calendar as CalIcon, Clock, RefreshCw, 
  Settings, Info, Save, X, Check, ChevronRight, ChevronLeft 
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import './ManageAvailability.css';

const ManageAvailability = () => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === 'ar';
  
  // ── State ──────────────────────────────────────────────────────────────────
  const getStartOfWeek = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    // Assuming week starts on Saturday (6)
    const diff = day === 6 ? 0 : -(day + 1);
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [currentWeekStart, setCurrentWeekStart] = useState(() => getStartOfWeek(new Date()));
  const [slots, setSlots] = useState([]);
  const [settings, setSettings] = useState({
    service_duration: 45,
    buffer_time: 15,
    max_daily_bookings: 4,
    min_notice_hours: 6,
    max_future_weeks: 1,
    is_service_public: true,
    auto_generate_slots: true
  });

  // Days Order: Sat to Fri
  const dayOrder = [6, 0, 1, 2, 3, 4, 5]; 
  const dayNames = isAr 
    ? ['السبت', 'الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة']
    : ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  const hours = Array.from({ length: 15 }).map((_, i) => 8 + i); // 8:00 to 22:00

  // ── Data Fetching ──────────────────────────────────────────────────────────
  // Removed individual fetchData call here to consolidate with currentWeekStart observer


  const fetchSlotsForWeek = async () => {
    try {
      const startDate = new Date(currentWeekStart);
      const endDate = new Date(currentWeekStart);
      endDate.setDate(endDate.getDate() + 6);
      endDate.setHours(23, 59, 59, 999);

      const formatDate = (date) => {
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
      };

      const { data, error } = await supabase
        .from('availability')
        .select('*')
        .gte('date', formatDate(startDate))
        .lte('date', formatDate(endDate))
        .order('date', { ascending: true })
        .order('start_time', { ascending: true });

      if (error) throw error;
      setSlots(data || []);
    } catch (err) {
      console.error('Error fetching slots:', err);
      // Don't show toast for initial load failures if caused by auth redirecting
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Check Session First
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session) {
        await supabase.auth.signOut();
        window.location.href = '/dashboard/login';
        return;
      }

      // 2. Fetch all data in parallel
      const [settingsRes, templatesRes] = await Promise.all([
        supabase.from('site_settings').select('*').single(),
        supabase.from('availability_templates').select('*').order('start_time', { ascending: true })
      ]);

      if (settingsRes.error) throw settingsRes.error;
      if (templatesRes.error) throw templatesRes.error;

      if (settingsRes.data) setSettings(settingsRes.data);
      if (templatesRes.data) setTemplates(templatesRes.data);
      
      // 3. Fetch current week slots
      await fetchSlotsForWeek();
    } catch (err) {
      console.error('Fetch error:', err);
      const isNetworkError = err.message === 'Failed to fetch' || err instanceof TypeError;
      
      if (err.status === 401 || err.message?.toLowerCase().includes('refresh token')) {
        supabase.auth.signOut().then(() => {
          window.location.href = '/dashboard/login';
        });
      } else if (isNetworkError) {
        toast.error(isAr 
          ? 'تعذر الاتصال بالخادم. يرجى التأكد من اتصال الإنترنت.' 
          : 'Failed to connect to server. Please check your internet connection.');
      } else {
        toast.error(isAr ? 'حدث خطأ أثناء تحميل البيانات' : 'Error loading data');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentWeekStart]); // Refresh everything when week changes to ensure data is in sync

  // ── Handlers ───────────────────────────────────────────────────────────────
  const nextWeek = () => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() + 7);
    setCurrentWeekStart(d);
  };

  const prevWeek = () => {
    const d = new Date(currentWeekStart);
    d.setDate(d.getDate() - 7);
    setCurrentWeekStart(d);
  };

  const goToToday = () => {
    setCurrentWeekStart(getStartOfWeek(new Date()));
  };

  const deleteSlot = async (slotId) => {
    if (!window.confirm(isAr ? 'هل أنت متأكد من حذف هذا الموعد؟' : 'Are you sure you want to delete this slot?')) return;
    
    try {
      const { error } = await supabase
        .from('availability')
        .delete()
        .eq('id', slotId);
      
      if (error) throw error;
      
      toast.success(isAr ? 'تم حذف الموعد بنجاح' : 'Slot deleted successfully');
      setSlots(prev => prev.filter(s => s.id !== slotId));
    } catch (err) {
      console.error('Error deleting slot:', err);
      toast.error(isAr ? 'حدث خطأ أثناء الحذف' : 'Error deleting slot');
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('site_settings')
        .update(settings)
        .eq('id', settings.id);
      
      if (error) throw error;
      
      // Generate slots for current + future weeks
      const weeksToGenerate = Math.max(settings.max_future_weeks || 1, 1);
      const { error: rpcError } = await supabase.rpc('replicate_availability_for_duration', { p_weeks: weeksToGenerate });
      if (rpcError) console.error("Error generating slots:", rpcError);

      // Refresh the slots for the currently viewed week
      await fetchSlotsForWeek();

      toast.success(t('dashboard.avail.save_success'));
    } catch (err) {
      toast.error(t('dashboard.avail.save_error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleReplicateYear = async () => {
    if (!window.confirm(t('dashboard.avail.replicate_confirm'))) return;
    
    setIsSaving(true);
    try {
      // Call the RPC with 52 weeks
      const { error } = await supabase.rpc('replicate_availability_for_duration', { 
        p_weeks: 52 
      });
      
      if (error) throw error;
      
      toast.success(t('dashboard.avail.replicate_success'));
      // Refresh current view
      await fetchSlotsForWeek();
    } catch (err) {
      console.error('Replication error:', err);
      toast.error(t('dashboard.avail.replicate_error'));
    } finally {
      setIsSaving(false);
    }
  };

  const toggleDayAvailability = async (dayIdx) => {
    const dayTemplates = templates.filter(t => t.day_of_week === dayIdx);
    const wasActive = dayTemplates.length > 0;
    
    // Optimistic Update
    if (wasActive) {
      setTemplates(prev => prev.filter(t => t.day_of_week !== dayIdx));
      const { error } = await supabase.from('availability_templates').delete().eq('day_of_week', dayIdx);
      if (error) {
        fetchData(); // Rollback
      } else {
        // Delete future unbooked slots for this day to keep calendar in sync
        await supabase.rpc('delete_unbooked_slots_for_day', { p_day_of_week: dayIdx });
        await fetchSlotsForWeek();
      }
    } else {
      const newTemp = { id: `temp-${Date.now()}`, day_of_week: dayIdx, start_time: '09:00:00', end_time: '17:00:00' };
      setTemplates(prev => [...prev, newTemp]);
      const { data, error } = await supabase
        .from('availability_templates')
        .upsert([{
          day_of_week: dayIdx,
          start_time: '09:00:00',
          end_time: '17:00:00'
        }], { 
          onConflict: 'day_of_week,start_time,end_time',
          ignoreDuplicates: false 
        })
        .select();
      
      if (error) {
        console.error('Error toggling day:', error);
        fetchData(); // Rollback
      } else {
        // Replace temp ID with real ID
        setTemplates(prev => prev.map(t => t.id === newTemp.id ? data[0] : t));
        // Auto-generate slots for current + future weeks
        const weeksToGenerate = Math.max(settings.max_future_weeks || 1, 1);
        await supabase.rpc('replicate_availability_for_duration', { p_weeks: weeksToGenerate });
        await fetchSlotsForWeek();
      }
    }
  };

  const addTimeRange = async (dayIdx) => {
    const newTemp = { id: `temp-${Date.now()}`, day_of_week: dayIdx, start_time: '17:00:00', end_time: '20:00:00' };
    setTemplates(prev => [...prev, newTemp]);
    
    const { data, error } = await supabase
      .from('availability_templates')
      .upsert([{
        day_of_week: dayIdx,
        start_time: '17:00:00',
        end_time: '20:00:00'
      }], { 
        onConflict: 'day_of_week,start_time,end_time',
        ignoreDuplicates: false 
      })
      .select();
    
    if (error) {
      console.error('Error adding time range:', error);
      fetchData(); // Rollback
    } else {
      setTemplates(prev => prev.map(t => t.id === newTemp.id ? data[0] : t));
      // Auto-generate slots for current + future weeks
      const weeksToGenerate = Math.max(settings.max_future_weeks || 1, 1);
      await supabase.rpc('replicate_availability_for_duration', { p_weeks: weeksToGenerate });
      await fetchSlotsForWeek();
    }
  };

  const removeTemplate = async (id) => {
    setTemplates(prev => prev.filter(t => t.id !== id));
    const { error } = await supabase.from('availability_templates').delete().eq('id', id);
    if (error) {
      fetchData(); // Rollback
    } else {
      // Re-generate slots to reflect deleted template
      const weeksToGenerate = Math.max(settings.max_future_weeks || 1, 1);
      await supabase.rpc('replicate_availability_for_duration', { p_weeks: weeksToGenerate });
      await fetchSlotsForWeek();
    }
  };

  const updateTemplateTime = async (id, field, value) => {
    // Optimistic update
    setTemplates(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
    
    const { error } = await supabase
      .from('availability_templates')
      .update({ [field]: value })
      .eq('id', id);
    
    if (error) {
      toast.error(t('common.error'));
      fetchData(); // Rollback
    }
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const getTemplatesForDay = (dayIdx) => templates.filter(t => t.day_of_week === dayIdx);

  // ── Render ─────────────────────────────────────────────────────────────────
  if (loading) return <div className="p-8 text-center">{t('common.loading')}</div>;

  return (
    <div className="dashboard-content-inner animate-fade-in" dir={isAr ? 'rtl' : 'ltr'}>
      <header className="flex-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">{t('dashboard.avail.root_title')}</h2>
          <p className="text-slate-500">{t('dashboard.avail.root_subtitle')}</p>
        </div>
      </header>

      <div className="availability-layout">
        
        {/* LEFT COLUMN: Time Grid View */}
        <div className="calendar-grid-container">
          <div className="calendar-header">
            <div className="flex items-center gap-4">
              <button onClick={prevWeek} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                {isAr ? <ChevronRight size={22} /> : <ChevronLeft size={22} />}
              </button>
              <span className="font-bold text-lg min-w-[180px] text-center text-slate-700">
                {(() => {
                  const weekEndDate = new Date(currentWeekStart);
                  weekEndDate.setDate(weekEndDate.getDate() + 6);
                  const startMonth = currentWeekStart.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { month: 'short' });
                  const endMonth = weekEndDate.toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { month: 'short' });
                  return isAr 
                    ? `${currentWeekStart.getDate()} ${startMonth} - ${weekEndDate.getDate()} ${endMonth}`
                    : `${startMonth} ${currentWeekStart.getDate()} - ${endMonth} ${weekEndDate.getDate()}`;
                })()}
              </span>
              <button onClick={nextWeek} className="p-2 hover:bg-slate-100 rounded-full transition-all">
                {isAr ? <ChevronLeft size={22} /> : <ChevronRight size={22} />}
              </button>
            </div>
            <div className="flex gap-2">
              <button onClick={goToToday} className="px-4 py-2 bg-slate-100 rounded-lg text-sm font-medium">{t('dashboard.avail.today')}</button>
            </div>
          </div>

          <div className="calendar-grid">
            {/* Header Spacer */}
            <div className="grid-day-header"></div>
            {/* Day Headers */}
            {dayOrder.map((d, i) => {
              const currentDate = new Date(currentWeekStart);
              currentDate.setDate(currentDate.getDate() + i);
              const dateNum = currentDate.getDate();
              const monthNum = currentDate.getMonth() + 1;
              const today = new Date();
              const dateStrToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
              const currentDateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
              const isDateToday = dateStrToday === currentDateStr;

              return (
                <div key={d} className={`grid-day-header ${isDateToday ? 'is-today' : ''}`}>
                  <div className="text-xs uppercase text-slate-400 mb-1">{dayNames[i]}</div>
                  <div className={`text-xl font-bold ${isDateToday ? 'text-primary-600' : ''}`}>{dateNum}/{monthNum}</div>
                </div>
              );
            })}

            {/* Time Rows */}
            {hours.map(h => (
              <React.Fragment key={h}>
                <div className="grid-time-label">
                  {h > 12 ? `${h-12} ${isAr ? 'م' : 'PM'}` : `${h} ${isAr ? 'ص' : 'AM'}`}
                </div>
                {dayOrder.map((d, i) => {
                  const currentDate = new Date(currentWeekStart);
                  currentDate.setDate(currentDate.getDate() + i);
                  const today = new Date();
                  const dateStrToday = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
                  const currentDateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(currentDate.getDate()).padStart(2, '0')}`;
                  const isDateToday = dateStrToday === currentDateStr;
                  
                  // format properly to YYYY-MM-DD local time
                  const year = currentDate.getFullYear();
                  const month = String(currentDate.getMonth() + 1).padStart(2, '0');
                  const day = String(currentDate.getDate()).padStart(2, '0');
                  const dateStr = `${year}-${month}-${day}`;

                  const cellSlots = slots.filter(s => {
                    const slotHour = parseInt(s.start_time.split(':')[0]);
                    return s.date === dateStr && slotHour === h;
                  });

                  return (
                    <div key={`${h}-${d}`} className={`grid-cell p-1 flex flex-col gap-1 overflow-y-auto ${isDateToday ? 'is-today' : ''}`}>
                      {cellSlots.map(slot => (
                        <div key={slot.id} className={`actual-slot ${slot.is_booked ? 'slot-booked' : 'slot-available'}`}>
                          <div className="slot-time">
                            {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                          </div>
                          {!slot.is_booked && (
                            <button className="btn-delete-slot" onClick={() => deleteSlot(slot.id)}>
                              <X size={12} />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* RIGHT COLUMN: Configuration Sidebar */}
        <div className="availability-sidebar">
          
          {/* Weekly Schedule */}
          <div className="sidebar-section">
            <h4><Clock size={18} /> {t('dashboard.avail.templates_title')}</h4>
            <div className="weekly-schedule-list">
              {dayOrder.map((d, i) => {
                const dayTemps = getTemplatesForDay(d);
                const isActive = dayTemps.length > 0;
                return (
                  <div key={d} className="day-row-group">
                    <div className="day-row">
                      <div className="day-info">
                        <label className="switch">
                          <input type="checkbox" checked={isActive} onChange={() => toggleDayAvailability(d)} />
                          <span className="slider"></span>
                        </label>
                        <span className="day-name">{dayNames[i]}</span>
                        <span className={`day-status ${isActive ? 'active' : ''}`}>
                          {isActive ? t('dashboard.avail.available') : t('dashboard.avail.unavailable')}
                        </span>
                      </div>
                      <button onClick={() => addTimeRange(d)} className="add-time-btn">
                        <Plus size={16} />
                      </button>
                    </div>
                    {isActive && (
                      <div className="slots-container">
                        {dayTemps.map(temp => (
                          <div key={temp.id} className="time-range-row">
                            <div className="time-input-wrapper">
                              <Clock className="clock-icon" size={14} />
                              <input 
                                type="time" 
                                value={temp.start_time.slice(0, 5)} 
                                onChange={(e) => updateTemplateTime(temp.id, 'start_time', e.target.value)}
                              />
                            </div>
                            <span className="text-slate-400">-</span>
                            <div className="time-input-wrapper">
                              <Clock className="clock-icon" size={14} />
                              <input 
                                type="time" 
                                value={temp.end_time.slice(0, 5)} 
                                onChange={(e) => updateTemplateTime(temp.id, 'end_time', e.target.value)}
                              />
                            </div>
                            <button onClick={() => removeTemplate(temp.id)} className="delete-slot-btn">
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Additional Settings */}
          <div className="sidebar-section">
            <h4><Settings size={18} /> {t('dashboard.avail.service_settings')}</h4>
            
            <div className="setting-row">
              <span className="setting-label">{t('dashboard.avail.service_duration')}</span>
              <select 
                className="dash-input w-32"
                value={settings.service_duration}
                onChange={e => setSettings({...settings, service_duration: parseInt(e.target.value)})}
              >
                <option value={30}>30 {isAr ? 'دقيقة' : 'min'}</option>
                <option value={45}>45 {isAr ? 'دقيقة' : 'min'}</option>
                <option value={60}>60 {isAr ? 'دقيقة' : 'min'}</option>
              </select>
            </div>

            <div className="setting-row">
              <span className="setting-label">{t('dashboard.avail.buffer_time')}</span>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={settings.buffer_time > 0} 
                  onChange={e => setSettings({...settings, buffer_time: e.target.checked ? 15 : 0})}
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="setting-row">
              <span className="setting-label">{t('dashboard.avail.max_daily')}</span>
              <div className="flex items-center gap-2">
                 <input 
                  type="number" 
                  className="setting-input-small"
                  value={settings.max_daily_bookings}
                  onChange={e => setSettings({...settings, max_daily_bookings: parseInt(e.target.value)})}
                />
                <input type="checkbox" checked={true} readOnly />
              </div>
            </div>

            <div className="setting-row">
              <span className="setting-label">{t('dashboard.avail.max_future')}</span>
              <select 
                className="dash-input w-32"
                value={settings.max_future_weeks}
                onChange={e => setSettings({...settings, max_future_weeks: parseInt(e.target.value)})}
              >
                <option value={1}>{isAr ? 'أسبوع' : '1 week'}</option>
                <option value={2}>{isAr ? 'أسبوعين' : '2 weeks'}</option>
                <option value={4}>{isAr ? 'شهر' : '1 month'}</option>
              </select>
            </div>

            <div className="setting-row">
              <span className="setting-label">{t('dashboard.avail.auto_generate')}</span>
              <label className="switch">
                <input 
                  type="checkbox" 
                  checked={settings.auto_generate_slots} 
                  onChange={e => setSettings({...settings, auto_generate_slots: e.target.checked})} 
                />
                <span className="slider"></span>
              </label>
            </div>

            <div className="mt-4 pt-4 border-t-dashed">
              <button 
                className="btn-replicate"
                onClick={handleReplicateYear}
                disabled={isSaving}
              >
                {isSaving ? <RefreshCw className="animate-spin" size={16} /> : <CalIcon size={16} />}
                {t('dashboard.avail.replicate_year')}
              </button>
            </div>
          </div>

          <div className="save-actions">
            <button className="btn-cancel" onClick={() => fetchData()}>{t('dashboard.avail.cancel_btn')}</button>
            <button className="btn-save-all" onClick={handleSaveSettings} disabled={isSaving}>
              {isSaving ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />}
              {t('dashboard.avail.save_btn')}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ManageAvailability;
