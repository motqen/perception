import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export const useSiteSettings = () => {
  const [settings, setSettings] = useState({
    site_title_en: 'Wiqaiah',
    site_title_ar: 'وقاية',
    site_logo_url: null,
    site_timezone: 'Africa/Cairo',
    loading: true
  });

  useEffect(() => {
    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from('site_settings')
        .select('*')
        .maybeSingle();

      if (!error && data) {
        setSettings({
          ...data,
          loading: false
        });
      } else {
        setSettings(prev => ({ ...prev, loading: false }));
      }
    };

    fetchSettings();

    // Subscribe to changes with a unique channel name to avoid conflicts between multiple components
    const channelId = Math.random().toString(36).substring(7);
    const channel = supabase
      .channel(`site_settings_changes_${channelId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'site_settings' }, 
        (payload) => {
          if (payload.new) {
            setSettings(prev => ({ ...prev, ...payload.new }));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return settings;
};
