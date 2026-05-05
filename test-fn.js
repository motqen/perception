import React from 'react';
import BookingPage from './src/pages/BookingPage.jsx';

// It is tricky to render react hooks outside a browser or testing environment.
// But we can just log the exports!
console.log("BookingPage:", typeof BookingPage);

import * as lucide from 'lucide-react';
const missing = ['Calendar', 'Clock', 'CheckCircle', 'ChevronLeft', 'X', 'Plus'].filter(x => !lucide[x]);
console.log("Missing lucide exports:", missing);

console.log("X typeof:", typeof lucide.X, "Plus typeof:", typeof lucide.Plus);
