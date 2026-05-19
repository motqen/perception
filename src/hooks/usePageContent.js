import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Cache to avoid multiple fetches across components on the same page
const contentCache = {};

export const usePageContent = (section) => {
  const [content, setContent] = useState(contentCache[section] || null);
  const [loading, setLoading] = useState(!contentCache[section]);

  useEffect(() => {
    if (contentCache[section]) {
      setContent(contentCache[section]);
      setLoading(false);
      return;
    }

    const fetchContent = async () => {
      const { data, error } = await supabase
        .from('page_content')
        .select('key, value_en, value_ar')
        .eq('section', section)
        .order('sort_order');

      if (!error && data && data.length > 0) {
        const map = {};
        data.forEach(row => {
          map[row.key] = { en: row.value_en || '', ar: row.value_ar || '' };
        });
        contentCache[section] = map;
        setContent(map);
      }
      setLoading(false);
    };

    fetchContent();
  }, [section]);

  // Helper: get value for current language
  const get = (key, lang = 'en', fallback = '') => {
    if (!content || !content[key]) return fallback;
    return content[key][lang] || content[key]['en'] || fallback;
  };

  return { content, loading, get };
};
