import React, { useState } from 'react';
import ModernLogin from './ModernLogin';
import RegisterForm from './components/RegisterForm';

type AuthView = 'login' | 'register';

const AuthPages: React.FC = () => {
  const [currentView, setCurrentView] = useState<AuthView>('login');

  const showRegister = () => setCurrentView('register');
  const showLogin = () => setCurrentView('login');

  if (currentView === 'register') {
    return <RegisterForm onBackToLogin={showLogin} />;
  }

  return <ModernLogin onShowRegister={showRegister} />;
};

export default AuthPages;
