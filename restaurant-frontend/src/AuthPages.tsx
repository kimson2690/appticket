import React, { useState } from 'react';
import ModernLogin from './ModernLogin';
import ModernRegisterPageNew from './components/ModernRegisterPageNew';

type AuthView = 'login' | 'register';

const AuthPages: React.FC = () => {
  const [currentView, setCurrentView] = useState<AuthView>('login');

  const showRegister = () => setCurrentView('register');
  const showLogin = () => setCurrentView('login');

  if (currentView === 'register') {
    return <ModernRegisterPageNew onBackToLogin={showLogin} />;
  }

  return <ModernLogin onShowRegister={showRegister} />;
};

export default AuthPages;
