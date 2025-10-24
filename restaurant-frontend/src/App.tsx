import React, { useState, useEffect } from 'react'
import AuthPages from './AuthPages'
import AdminDashboard from './components/AdminDashboard'
import { NotificationProvider } from './contexts/NotificationContext'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté au chargement
    const checkAuthStatus = () => {
      const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
      const role = localStorage.getItem('userRole');
      
      console.log('Vérification du statut d\'authentification:', {
        loggedIn,
        role,
        localStorage: {
          isLoggedIn: localStorage.getItem('isLoggedIn'),
          userRole: localStorage.getItem('userRole'),
          userEmail: localStorage.getItem('userEmail')
        }
      });
      
      setIsLoggedIn(loggedIn);
      setUserRole(role);
      setIsLoading(false);
    };

    checkAuthStatus();
  }, []);

  const handleLogout = () => {
    // Nettoyer les données de session
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
    localStorage.removeItem('userCompanyId');
    localStorage.removeItem('userCompanyName');
    localStorage.removeItem('authToken');
    localStorage.removeItem('rememberMe');
    
    setIsLoggedIn(false);
    setUserRole(null);
  };

  // Écran de chargement
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement...</p>
        </div>
      </div>
    );
  }

  // Wrap the app with NotificationProvider
  return (
    <NotificationProvider
      maxNotifications={5}
      defaultDuration={4000}
      defaultPosition="top-right"
    >
      {/* Si l'utilisateur est connecté, afficher AdminDashboard (pour tous les rôles) */}
      {isLoggedIn && userRole ? (
        <AdminDashboard onLogout={handleLogout} />
      ) : (
        /* Sinon, afficher les pages d'authentification */
        <AuthPages />
      )}
    </NotificationProvider>
  );
}

export default App
