'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getUserLists, signOut } from '@/app/lib/supabase';
import ListGrid from '@/app/components/lists/ListGrid';
import NotificationBell from '../components/lists/NotificationBell';

// Fonctions utilitaires pour le stockage local
const USER_STORAGE_KEY = 'listtogether_user';

// Stocker l'utilisateur dans le localStorage
const storeUser = (user) => {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
    } catch (e) {
      console.error('Erreur lors du stockage de l\'utilisateur:', e);
    }
  }
};

// Récupérer l'utilisateur depuis le localStorage
const getStoredUser = () => {
  if (typeof window !== 'undefined') {
    try {
      const storedUser = window.localStorage.getItem(USER_STORAGE_KEY);
      return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
      console.error('Erreur lors de la récupération de l\'utilisateur:', e);
      return null;
    }
  }
  return null;
};

// Supprimer l'utilisateur du localStorage
const removeStoredUser = () => {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.removeItem(USER_STORAGE_KEY);
    } catch (e) {
      console.error('Erreur lors de la suppression de l\'utilisateur:', e);
    }
  }
};

export default function DashboardPage() {
  // États initialisés côté client uniquement
  const [recentActivity, setRecentActivity] = useState([]);
  const [user, setUser] = useState(null);
  const [clientSideLoaded, setClientSideLoaded] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();

  // Premier effet: initialisation côté client et récupération des données stockées
  useEffect(() => {
    // Marquer que le composant est maintenant rendu côté client
    setClientSideLoaded(true);
    
    // Récupérer l'utilisateur stocké
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
    }
  }, []);

  // Second effet: chargement de l'activité récente
  useEffect(() => {
    // Ne charger l'activité que si nous sommes côté client et qu'un utilisateur est connecté
    if (!clientSideLoaded || !user) {
      return;
    }

    const fetchActivity = async () => {
      try {
        const { data, error } = await getUserLists();
        
        if (error) {
          console.error('Erreur lors du chargement de l\'activité:', error);
          return;
        }
        
        // Configurer l'activité récente
        if (data && data.length > 0) {
          const uniqueData = [];
          const seenIds = new Set();
          
          data.forEach(list => {
            if (!seenIds.has(list.id)) {
              seenIds.add(list.id);
              uniqueData.push(list);
            }
          });
          
          const recent = uniqueData
            .slice(0, 5)
            .map(list => ({
              id: list.id,
              title: list.title,
              type: 'list_created',
              timestamp: list.created_at
            }));
          setRecentActivity(recent);
        }
      } catch (error) {
        console.error('Erreur lors du chargement de l\'activité:', error);
      }
    };

    fetchActivity();
  }, [user, clientSideLoaded]);

  // Gérer la déconnexion
  const handleSignOut = async () => {
    try {
      const { error } = await signOut();
      if (error) {
        throw error;
      }
      
      // Important: supprimer l'utilisateur du stockage local
      removeStoredUser();
      
      // Réinitialiser les états
      setUser(null);
      setRecentActivity([]);
      
      // Rediriger
      router.push('/');
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  // Fonction pour mettre à jour le stockage utilisateur quand on se connecte
  const updateUserAfterLogin = (userData) => {
    // Stocker dans localStorage
    storeUser(userData);
    // Mettre à jour l'état React
    setUser(userData);
  };

  // Formatage de la date
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Obtenir les initiales de l'utilisateur
  const getUserInitials = () => {
    if (!user || !user.email) return '?';
    return user.email.charAt(0).toUpperCase();
  };

  // Ne rien rendre côté serveur, seulement côté client pour éviter les problèmes d'hydratation
  if (!clientSideLoaded) {
    return null;
  }

  // Composant pour l'écran de connexion
  const LoginScreen = () => (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-lg p-8 max-w-md mx-auto my-8 border border-blue-100 transform transition-all hover:scale-[1.01]">
      <div className="text-center">
        <div className="mx-auto h-24 w-24 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md">
          <svg className="h-14 w-14 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h2 className="mt-6 text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">Bienvenue sur ListTogether</h2>
        <p className="mt-3 text-gray-600">
          Créez, partagez et collaborez sur vos listes en temps réel.
        </p>
      </div>
      <div className="mt-8 flex flex-col sm:flex-row gap-4">
        <button
          onClick={() => router.push('/auth/login')}
          className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium transition-all transform hover:scale-105 shadow-md"
        >
          Se connecter
        </button>
        <button
          onClick={() => router.push('/auth/register')}
          className="w-full py-3 px-6 border border-blue-200 text-blue-700 rounded-lg bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 font-medium transition-all transform hover:scale-105 shadow-sm"
        >
          Créer un compte
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-md sticky top-0 z-20 border-b border-blue-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center h-16 px-4 sm:px-6 lg:px-8">
            <div className="flex items-center">
              <div className="flex items-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg h-10 w-10 justify-center mr-2 shadow-sm">
                <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                ListTogether
              </h1>
            </div>
            
            {user ? (
              <div className="flex items-center">
                {/* Notification et profil */}
                <div className="hidden md:flex items-center space-x-4">
                  <NotificationBell userId={user?.id} />
                  <div className="flex items-center">
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white font-medium shadow-sm mr-3">
                      {getUserInitials()}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-gray-900">{user.email.split('@')[0]}</span>
                      <span className="text-xs text-blue-600">Connecté</span>
                    </div>
                  </div>
                  <button 
                    onClick={handleSignOut}
                    className="ml-4 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-blue-600 hover:border-blue-200 transition-all text-sm font-medium shadow-sm"
                  >
                    <svg className="h-5 w-5 inline-block mr-1 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Déconnexion
                  </button>
                </div>
                
                {/* Menu mobile */}
                <div className="flex md:hidden items-center space-x-3">
                  <NotificationBell userId={user?.id} />
                  <button 
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    className="inline-flex items-center justify-center focus:outline-none"
                  >
                    <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm">
                      {getUserInitials()}
                    </div>
                  </button>
                </div>
                
                {/* Menu déroulant mobile */}
                {isMobileMenuOpen && (
                  <div className="absolute top-16 right-0 mt-1 w-60 bg-white rounded-lg shadow-xl z-20 border border-blue-100 overflow-hidden transform transition-all">
                    <div className="px-4 py-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-100">
                      <p className="text-sm font-medium text-gray-900">{user.email}</p>
                      <p className="text-xs text-blue-600">Connecté</p>
                    </div>
                    <div className="py-1">
                      <button 
                        onClick={() => router.push('/profile')}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 flex items-center"
                      >
                        <svg className="mr-3 h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Mon profil
                      </button>
                      <button 
                        onClick={handleSignOut}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 flex items-center"
                      >
                        <svg className="mr-3 h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                        Se déconnecter
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button 
                onClick={() => router.push('/auth/login')}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 text-sm font-medium shadow-md transition-all"
              >
                Se connecter
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {user ? (
          <div className="md:grid md:grid-cols-3 md:gap-8">
            {/* Main content - ListGrid */}
            <div className="md:col-span-2 mb-8 md:mb-0">
              <ListGrid />
            </div>
            
            {/* Sidebar */}
            <div className="space-y-6">
              {/* Profil */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden border border-blue-100 transform transition-all hover:shadow-lg">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-4 text-white">
                  <h2 className="text-lg font-medium">Mon profil</h2>
                </div>
                <div className="px-4 py-5">
                  <div className="flex items-center space-x-4 mb-5">
                    <div className="h-16 w-16 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xl font-medium shadow-md">
                      {getUserInitials()}
                    </div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {user.email.split('@')[0]}
                      </h3>
                      <p className="text-sm text-gray-500">{user.email}</p>
                    </div>
                  </div>
                  
                  <button className="w-full mt-2 px-4 py-3 border border-blue-200 shadow-sm text-sm font-medium rounded-lg text-blue-700 bg-white hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all transform hover:scale-105">
                    <svg className="h-5 w-5 inline-block mr-1 -mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Modifier mon profil
                  </button>
                </div>
              </div>
              
              {/* Activité récente */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden border border-blue-100 transform transition-all hover:shadow-lg">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-4 text-white">
                  <h2 className="text-lg font-medium">Activité récente</h2>
                </div>
                <div className="px-4 py-3">
                  {recentActivity.length === 0 ? (
                    <div className="text-center py-8 bg-blue-50 rounded-lg my-3">
                      <svg className="mx-auto h-10 w-10 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="mt-2 text-gray-600">Aucune activité récente</p>
                    </div>
                  ) : (
                    <ul className="divide-y divide-blue-100">
                      {recentActivity.map((activity) => (
                        <li key={`${activity.type}-${activity.id}`} className="py-3 transform transition-all hover:bg-blue-50 hover:scale-[1.01] px-2 rounded-lg">
                          <div className="flex space-x-3">
                            <div className="flex-shrink-0">
                              {activity.type === 'list_created' && (
                                <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center shadow-sm">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900">
                                {activity.type === 'list_created' ? 'Liste créée' : 'Activité'}
                              </p>
                              <p className="text-sm text-blue-600 font-medium">
                                {activity.title}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">
                                {formatDate(activity.timestamp)}
                              </p>
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
              
              {/* Conseils rapides */}
              <div className="bg-white rounded-xl shadow-md overflow-hidden border border-blue-100 transform transition-all hover:shadow-lg">
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-4 text-white">
                  <h2 className="text-lg font-medium">Astuces</h2>
                </div>
                <div className="px-4 py-5">
                  <ul className="space-y-4 text-sm">
                    <li className="flex items-start p-2 transform transition-all hover:bg-blue-50 hover:scale-[1.01] rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-green-400 to-blue-500 flex items-center justify-center shadow-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                          </svg>
                        </div>
                      </div>
                      <span className="ml-3 text-gray-700">Partagez vos listes avec vos amis en cliquant sur "Partager"</span>
                    </li>
                    <li className="flex items-start p-2 transform transition-all hover:bg-blue-50 hover:scale-[1.01] rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 flex items-center justify-center shadow-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      </div>
                      <span className="ml-3 text-gray-700">Organisez vos tâches en cochant celles qui sont terminées</span>
                    </li>
                    <li className="flex items-start p-2 transform transition-all hover:bg-blue-50 hover:scale-[1.01] rounded-lg">
                      <div className="flex-shrink-0">
                        <div className="h-8 w-8 rounded-full bg-gradient-to-r from-orange-400 to-pink-600 flex items-center justify-center shadow-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                          </svg>
                        </div>
                      </div>
                      <span className="ml-3 text-gray-700">Créez plusieurs listes pour différents projets ou catégories</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <LoginScreen />
        )}
      </main>
    </div>
  );
}