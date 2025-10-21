import React, { useState, useEffect } from 'react'
import AuthPages from './AuthPages'
import AdminDashboard from './components/AdminDashboard'

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Vérifier si l'utilisateur est connecté au chargement
    const checkAuthStatus = () => {
      const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
      const role = localStorage.getItem('userRole');
      
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

  // Si l'utilisateur est connecté et est admin, afficher le dashboard
  if (isLoggedIn && userRole === 'admin') {
    return <AdminDashboard onLogout={handleLogout} />;
  }

  // Sinon, afficher les pages d'authentification
  return <AuthPages />;
}

export default App
