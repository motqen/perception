import React, { useEffect } from 'react';
import Hero from '../components/Hero';
import PainPoints from '../components/PainPoints';
import HowItWorks from '../components/HowItWorks';
import FAQ from '../components/FAQ';
import Webinars from '../components/Webinars';
import Offer from '../components/Offer';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'react-router-dom';

const LandingPage = () => {
  const { i18n } = useTranslation();
  const location = useLocation();

  useEffect(() => {
    if (location.state && location.state.scrollTo) {
      const scrollTarget = location.state.scrollTo;
      // Small timeout to ensure DOM is ready
      setTimeout(() => {
        const element = document.getElementById(scrollTarget);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' });
        }
      }, 100);
      
      // Clear state so it doesn't run again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  return (
    <>
      <Hero />
      <PainPoints />
      <HowItWorks />
      <FAQ />
      <Webinars />
      <Offer />
    </>
  );
};

export default LandingPage;
