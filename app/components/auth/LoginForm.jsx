'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { signIn } from '@/app/lib/supabase';

// Fonction pour stocker l'utilisateur dans le localStorage
const storeUser = (user) => {
  if (typeof window !== 'undefined') {
    try {
      window.localStorage.setItem('listtogether_user', JSON.stringify(user));
    } catch (e) {
      console.error('Erreur lors du stockage de l\'utilisateur:', e);
    }
  }
};

export default function LoginForm() { 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await signIn(email, password);
      
      if (error) {
        throw error;
      }
      
      // Stocker les informations utilisateur en localStorage
      if (data && data.user) {
        storeUser(data.user);
      }
      
      // Redirect to dashboard on success
      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      setError(error.message || 'Une erreur est survenue lors de la connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">
        Connexion à ListTogether
      </h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Mot de passe
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="flex items-center justify-between">
          <div className="text-sm">
            <Link href="/auth/reset-password" className="text-blue-600 hover:text-blue-500">
              Mot de passe oublié ?
            </Link>
          </div>
        </div>
        
        <div>
          <button
            type="submit"
            disabled={loading}
            className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </div>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          Pas encore de compte ?{' '}
          <Link href="/auth/register" className="text-blue-600 hover:text-blue-500">
            S'inscrire
          </Link>
        </p>
      </div>
    </div>
  );
}