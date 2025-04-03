'use client';
 
import Link from 'next/link';
import { useState, useEffect } from 'react';

// Clé de stockage utilisée dans localStorage
const USER_STORAGE_KEY = 'listtogether_user';

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [mounted, setMounted] = useState(false);

  // Effet pour récupérer les données utilisateur du localStorage
  useEffect(() => {
    // Vérifier si on est côté client
    setMounted(true);
    
    // Récupérer l'utilisateur depuis le localStorage
    try {
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des données utilisateur:', error);
    }
  }, []);

  // Fonction pour obtenir l'initiale de l'utilisateur pour l'avatar
  const getUserInitial = () => {
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return '?';
  };

  // Ne rien rendre tant que le composant n'est pas monté (pour éviter les problèmes d'hydratation)
  if (!mounted) {
    return null;
  }

  return (
    <div className="bg-white">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-xl font-bold text-blue-600">ListTogether</span>
              </div>
            </div>
            <div className="flex items-center">
              {user ? (
                <div className="flex items-center space-x-4">
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-medium text-gray-900">
                      {user.email}
                    </span>
                    <span className="text-xs text-gray-500">
                      Connecté
                    </span>
                  </div>
                  <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-medium">
                    {getUserInitial()}
                  </div>
                  <Link
                    href="/dashboard"
                    className="ml-4 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    Mon tableau de bord
                  </Link>
                </div>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="text-gray-700 hover:text-gray-900"
                  >
                    Connexion
                  </Link>
                  <Link
                    href="/auth/register"
                    className="ml-8 inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                  >
                    S'inscrire
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <div className="bg-white">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl font-extrabold text-gray-900 sm:text-5xl sm:tracking-tight lg:text-6xl">
              Partagez vos listes, simplifiez votre quotidien
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-xl text-gray-500">
              ListTogether est la solution la plus simple pour partager des listes de tâches avec votre partenaire, colocataire ou ami.
            </p>
            <div className="mt-10">
              <Link
                href={user ? "/dashboard" : "/auth/register"}
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                {user ? "Accéder à mes listes" : "Commencer gratuitement"}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="bg-gray-50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Pourquoi choisir ListTogether ?
            </h2>
          </div>
          <div className="mt-12 grid gap-8 grid-cols-1 md:grid-cols-3">
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="text-center">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mx-auto">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Simple et intuitif</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Une interface épurée et facile à utiliser pour gérer vos tâches quotidiennes.
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow rounded-lg">
              <div className="px-4 py-5 sm:p-6">
                <div className="text-center">
                  <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-500 text-white mx-auto">
                    <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <h3 className="mt-4 text-lg font-medium text-gray-900">Fonctionnalités avancées</h3>
                  <p className="mt-2 text-base text-gray-500">
                    Des fonctionnalités Pro pour ceux qui souhaitent aller plus loin dans l'organisation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900">
              Tarifs simples et transparents
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
              Commencez gratuitement et passez à Pro quand vous en aurez besoin.
            </p>
          </div>
          <div className="mt-12 grid gap-8 grid-cols-1 md:grid-cols-2 lg:px-24">
            <div className="bg-white overflow-hidden shadow rounded-lg border border-gray-200">
              <div className="px-6 py-8">
                <div className="text-center">
                  <h3 className="text-2xl font-medium text-gray-900">Gratuit</h3>
                  <p className="mt-4 text-5xl font-extrabold text-gray-900">0€</p>
                  <p className="mt-4 text-lg text-gray-500">Pour commencer à collaborer</p>
                </div>
                <ul className="mt-8 space-y-4">
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    1 liste partagée
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Collaboration en temps réel
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Invitations par email
                  </li>
                </ul>
                <div className="mt-8">
                  <Link
                    href={user ? "/dashboard" : "/auth/register"}
                    className="w-full flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {user ? "Accéder à mes listes" : "Commencer gratuitement"}
                  </Link>
                </div>
              </div>
            </div>
            <div className="bg-white overflow-hidden shadow-lg rounded-lg border-2 border-blue-500 relative">
              <div className="absolute top-0 right-0 transform translate-x-2 -translate-y-2">
                <div className="bg-blue-500 text-white px-3 py-1 text-sm font-semibold rounded-full">
                  Populaire
                </div>
              </div>
              <div className="px-6 py-8">
                <div className="text-center">
                  <h3 className="text-2xl font-medium text-gray-900">Pro</h3>
                  <div className="mt-4">
                    <span className="text-5xl font-extrabold text-gray-900">1€</span>
                    <span className="text-xl text-gray-500">/mois</span>
                  </div>
                  <p className="mt-4 text-lg text-gray-500">Pour les utilisateurs avancés</p>
                </div>
                <ul className="mt-8 space-y-4">
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Listes illimitées
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Notifications en temps réel
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Personnalisation de l'interface
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Deadlines sur les tâches
                  </li>
                  <li className="flex items-center">
                    <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Chat intégré
                  </li>
                </ul>
                <div className="mt-8">
                  <Link
                    href={user ? "/pro" : "/auth/register?plan=pro"}
                    className="w-full flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    {user ? "Passer à Pro" : "Essayer Pro"}
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-800">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Produit</h3>
              <ul className="mt-4 space-y-4">
                <li>
                  <a href="#" className="text-base text-gray-300 hover:text-white">Fonctionnalités</a>
                </li>
                <li>
                  <a href="#" className="text-base text-gray-300 hover:text-white">Tarifs</a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Support</h3>
              <ul className="mt-4 space-y-4">
                <li>
                  <a href="#" className="text-base text-gray-300 hover:text-white">Centre d'aide</a>
                </li>
                <li>
                  <a href="#" className="text-base text-gray-300 hover:text-white">Contact</a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Légal</h3>
              <ul className="mt-4 space-y-4">
                <li>
                  <a href="#" className="text-base text-gray-300 hover:text-white">Confidentialité</a>
                </li>
                <li>
                  <a href="#" className="text-base text-gray-300 hover:text-white">Conditions</a>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-gray-400 tracking-wider uppercase">Entreprise</h3>
              <ul className="mt-4 space-y-4">
                <li>
                  <a href="#" className="text-base text-gray-300 hover:text-white">À propos</a>
                </li>
                <li>
                  <a href="#" className="text-base text-gray-300 hover:text-white">Blog</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-8 border-t border-gray-700 pt-8 md:flex md:items-center md:justify-between">
            <div className="flex space-x-6 md:order-2">
              <a href="#" className="text-gray-400 hover:text-gray-300">
                <span className="sr-only">Twitter</span>
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
            </div>
            <p className="mt-8 text-base text-gray-400 md:mt-0 md:order-1">
              &copy; 2025 ListTogether. Tous droits réservés.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}