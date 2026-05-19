import { supabase } from './supabase';

/**
 * Invokes the send-booking-email Edge Function
 * This function can be used for both consultations and webinars.
 */
export const sendConfirmationEmail = async (payload) => {
  const { error: fnError } = await supabase.functions.invoke('send-booking-email', {
    body: payload
  });

  if (fnError) {
    const body = await fnError.context?.json().catch(() => ({}));
    throw new Error(body.error || 'Edge Function failure');
  }
  return true;
};

/**
 * Replaces placeholders in email templates with actual data
 */
export const replaceEmailPlaceholders = (template, data, isAr = true) => {
  if (!template) return '';
  
  const replacements = {
    name: data.name || '',
    'اسم المريض': data.name || '',
    'Patient Name': data.name || '',
    date: data.date || '',
    'التاريخ': data.date || '',
    time: data.time || '',
    'الوقت': data.time || '',
    link: data.link || '',
    'الرابط': data.link || ''
  };

  let result = template;
  
  Object.entries(replacements).forEach(([key, value]) => {
    const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const curlyRegex = new RegExp(`\\{${escapedKey}\\}`, 'gi');
    const squareRegex = new RegExp(`\\[${escapedKey}\\]`, 'gi');
    result = result.replace(curlyRegex, value).replace(squareRegex, value);
  });

  return result;
};
