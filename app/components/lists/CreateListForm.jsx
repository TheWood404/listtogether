'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createList } from '@/app/lib/supabase';

export default function CreateListForm({ onSuccess }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await createList(title, description);
      
      if (error) {
        throw error;
      }
      
      setTitle('');
      setDescription('');
      
      if (onSuccess) {
        onSuccess(data);
      } else {
        router.push(`/list/${data.id}`);
        router.refresh();
      }
    } catch (error) {
      setError(error.message || 'Une erreur est survenue lors de la création de la liste');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto transform transition-all duration-500 opacity-100 translate-y-0">
      {error && (
        <div className="mb-5 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg shadow-sm animate-pulse">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-red-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>{error}</p>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Titre de la liste
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <span className="text-gray-500">
                📋
              </span>
            </div>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Ma super liste"
              className="block w-full pl-10 pr-10 py-3 border border-blue-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 bg-white transition-all text-gray-800 placeholder-gray-500"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-red-500">
                *
              </span>
            </div>
          </div>
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description (optionnelle)
          </label>
          <div className="relative">
            <div className="absolute top-3 left-0 pl-3 flex items-start pointer-events-none">
              <span className="text-gray-500">
                📝
              </span>
            </div>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              placeholder="Décrivez votre liste ici..."
              className="block w-full pl-10 pr-3 py-3 border border-blue-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 bg-white transition-all text-gray-800 placeholder-gray-500"
            />
          </div>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 px-6 rounded-lg text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all transform hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-md font-medium"
        >
          {loading ? (
            <span className="flex items-center justify-center">
              <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Création en cours...
            </span>
          ) : (
            <span className="flex items-center justify-center">
              <svg className="h-5 w-5 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Créer la liste
            </span>
          )}
        </button>
      </form>
    </div>
  );
}