import React from 'react';
import { renderToString } from 'react-dom/server';
import BookingPage from './src/pages/BookingPage.jsx';
import { MemoryRouter } from 'react-router-dom';

// Polyfills
globalThis.window = { scrollTo: () => {} };

// Mock react-i18next
import { vi } from 'vitest';
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: k => k, i18n: { language: 'en' } })
}));

try {
  const App = () => <MemoryRouter><BookingPage /></MemoryRouter>;
  const html = renderToString(<App />);
  console.log("SUCCESS! HTML length:", html.length);
} catch(e) {
  console.log("CRASH:", e);
}
