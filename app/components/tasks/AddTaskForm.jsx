// app/components/tasks/AddTaskForm.jsx
'use client';

import { useState } from 'react';
import { createTask } from '@/app/lib/supabase';

export default function AddTaskForm({ listId, onTaskAdded }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [showDescription, setShowDescription] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { data, error } = await createTask(listId, title, description);
      
      if (error) {
        throw error;
      }
      
      // Clear form
      setTitle('');
      setDescription('');
      setShowDescription(false);
      
      // Notify parent component
      if (onTaskAdded) {
        onTaskAdded(data);
      }
    } catch (error) {
      setError(error.message || 'Une erreur est survenue lors de l\'ajout de la tâche');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-5 border border-blue-100 transform transition-all hover:shadow-lg">
      <div className="flex items-center mb-4">
        <div className="h-8 w-8 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm mr-3">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
        </div>
        <h3 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
          Ajouter une tâche
        </h3>
      </div>
      
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg shadow-sm animate-pulse">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-red-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>{error}</p>
          </div>
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Quelle est la tâche à faire ?"
              required
              className="w-full pl-10 pr-3 py-3 border border-blue-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 bg-white transition-all text-gray-800 placeholder-gray-500"
            />
          </div>
        </div>
        
        {showDescription && (
          <div className="transition-all duration-300 ease-in-out">
            <div className="relative">
              <div className="absolute top-3 left-0 pl-3 flex items-start pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                </svg>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Description de la tâche (optionnelle)"
                rows={3}
                className="w-full pl-10 pr-3 py-3 border border-blue-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-400 bg-white transition-all text-gray-800 placeholder-gray-500"
              />
            </div>
          </div>
        )}
        
        <div className="flex items-center justify-between pt-2">
          <button
            type="button"
            onClick={() => setShowDescription(!showDescription)}
            className="text-sm text-blue-600 hover:text-blue-800 focus:outline-none transition-all flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {showDescription 
                ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              }
            </svg>
            {showDescription ? 'Masquer la description' : 'Ajouter une description'}
          </button>
          
          <button
            type="submit"
            disabled={loading}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all transform hover:scale-105 disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100 shadow-md font-medium text-sm flex items-center"
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Ajout...
              </span>
            ) : (
              <span className="flex items-center">
                <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Ajouter
              </span>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}