import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// Singleton cache - so all components share one fetch
let cachedPricing = null;
let fetchPromise = null;

const DEFAULT = {
  consultation_price: 15,
  discount_percentage: 0,
  show_discount: false,
  discount_text_en: '',
  discount_text_ar: '',
};

export const usePricing = () => {
  const [pricing, setPricing] = useState(cachedPricing || DEFAULT);

  useEffect(() => {
    if (cachedPricing) {
      setPricing(cachedPricing);
      return;
    }

    if (!fetchPromise) {
      fetchPromise = supabase
        .from('site_settings')
        .select('consultation_price, discount_percentage, show_discount, discount_text_en, discount_text_ar')
        .maybeSingle()
        .then(({ data }) => {
          if (data) {
            cachedPricing = data;
            fetchPromise = null;
            return data;
          }
          return DEFAULT;
        });
    }

    fetchPromise.then(data => {
      setPricing(data);
    });
  }, []);

  // Final price after discount
  const finalPrice = pricing.show_discount
    ? (pricing.consultation_price * (1 - pricing.discount_percentage / 100))
    : pricing.consultation_price;

  return {
    ...pricing,
    finalPrice: Number(finalPrice).toFixed(2),
    originalPrice: Number(pricing.consultation_price).toFixed(2),
  };
};

// Call this after saving to refresh all components
export const invalidatePricingCache = () => {
  cachedPricing = null;
  fetchPromise = null;
};
