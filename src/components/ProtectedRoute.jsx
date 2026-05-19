import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ProtectedRoute = () => {
  const { user, isAdmin, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="login-page container section-padding" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '50vh' }}>
        <div className="login-card animate-pulse" style={{ textAlign: 'center' }}>
          <img 
            src={`${import.meta.env.BASE_URL}logo.svg`} 
            alt="Wiqaiah" 
            className="login-logo" 
            height="50"
            style={{ opacity: 0.5, height: '50px' }} 
          />
          <p style={{ marginTop: '20px', color: 'var(--text-muted)' }}>Loading Authentication...</p>
        </div>
      </div>
    );
  }
  
  if (!user || !isAdmin) {
    return <Navigate to="/dashboard/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
