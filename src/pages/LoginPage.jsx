import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import './LoginPage.css';

const UnauthorizedView = ({ user, logout, navigate, t }) => (
  <div className="login-page container section-padding">
    <div className="login-card animate-fade-up">
      <img 
        src={`${import.meta.env.BASE_URL}logo.svg`} 
        alt="Wiqaiah" 
        className="login-logo" 
        height="50"
        style={{ height: '50px' }}
      />
      <div className="unauthorized-message" style={{ margin: '20px 0', textAlign: 'center' }}>
        <h2 style={{ color: '#ef4444', marginBottom: '10px' }}>{t('login_page.unauthorized_title')}</h2>
        <p style={{ color: 'var(--text-muted)', marginBottom: '15px' }}>{t('login_page.unauthorized_msg')}</p>
        <p style={{ fontSize: '0.85rem', opacity: 0.7 }}>{user.email}</p>
      </div>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
        <button onClick={() => logout()} className="primary-btn" style={{ background: '#ef4444' }}>
          {t('dashboard_nav.logout')}
        </button>
        <button onClick={() => navigate('/')} className="secondary-btn">
          {t('common.back_home')}
        </button>
      </div>
    </div>
  </div>
);

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const { login, user, isAdmin, logout, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const handleForgotPassword = async () => {
    if (!resetEmail) {
      toast.error(i18n.language === 'ar' ? 'يرجى إدخال البريد الإلكتروني' : 'Please enter email');
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/dashboard?reset=true`,
    });

    if (error) {
      toast.error(t('login_page.reset_sent_error'));
    } else {
      toast.success(t('login_page.reset_sent_success'));
      setShowForgot(false);
    }
    setLoading(false);
  };

  const toggleForgot = async () => {
    if (!showForgot) {
      // Try to fetch recovery email from site settings
      const { data } = await supabase.from('site_settings').select('recovery_email').maybeSingle();
      if (data?.recovery_email) {
        setResetEmail(data.recovery_email);
      }
    }
    setShowForgot(!showForgot);
  };

  // Redirect if already admin
  if (user && isAdmin) return <Navigate to="/dashboard" />;

  // Loading state
  if (authLoading && user) return null;

  // Unauthorized view
  if (user && !isAdmin && !authLoading) {
    return <UnauthorizedView user={user} logout={logout} navigate={navigate} t={t} />;
  }

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    const loginPromise = login(email, password);
    
    toast.promise(loginPromise, {
      loading: t('login_page.logging_in'),
      success: t('login_page.success'),
      error: t('login_page.failed'),
    });

    const { error: loginError } = await loginPromise;
    if (!loginError) {
      navigate('/dashboard');
    } else {
      setError(loginError.message || 'Login failed');
    }
    setLoading(false);
  };

  return (
    <div className="login-page container section-padding">
      <div className="login-card animate-fade-up">
        <img 
          src={`${import.meta.env.BASE_URL}logo.svg`} 
          alt="Wiqaiah" 
          className="login-logo" 
          height="50"
          style={{ height: '50px' }}
        />
        <h2>{t('login_page.title')}</h2>
        <p>{t('login_page.subtitle')}</p>
        
        {error && <div className="error-alert animate-shake">{error}</div>}
        
        {!showForgot ? (
          <form onSubmit={handleLogin} className="login-form">
            <div className="input-group">
              <label>{t('login_page.email')}</label>
              <input 
                type="email" required 
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@wiqaiah.com"
              />
            </div>
            <div className="input-group">
              <label>{t('login_page.password')}</label>
              <input 
                type="password" required 
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            
            <div className="flex-between mb-4">
              <button 
                type="button" 
                onClick={toggleForgot}
                className="text-btn text-sm"
              >
                {t('login_page.forgot_password')}
              </button>
            </div>

            <button type="submit" disabled={loading} className="primary-btn login-btn">
              {loading ? t('login_page.logging_in') : t('login_page.btn')}
            </button>
          </form>
        ) : (
          <div className="forgot-password-flow">
            <p className="mb-6 text-muted text-sm">
              {i18n.language === 'ar' 
                ? 'أدخل بريدك الإلكتروني لإرسال رابط تعيين كلمة المرور.' 
                : 'Enter your email to receive a password reset link.'}
            </p>
            <div className="input-group">
              <label>{t('login_page.email')}</label>
              <input 
                type="email" 
                value={resetEmail}
                onChange={e => setResetEmail(e.target.value)}
                placeholder="admin@wiqaiah.com"
              />
            </div>
            <div className="flex flex-col gap-3 mt-6">
              <button 
                onClick={handleForgotPassword}
                disabled={loading}
                className="primary-btn"
              >
                {loading ? t('common.loading') : (i18n.language === 'ar' ? 'إرسال الرابط' : 'Send Reset Link')}
              </button>
              <button 
                onClick={toggleForgot}
                className="secondary-btn"
              >
                {t('login_page.back_to_login')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
