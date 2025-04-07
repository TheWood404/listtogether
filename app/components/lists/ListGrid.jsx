'use client';

import { useEffect, useState } from 'react';
import { getLists } from '@/app/lib/supabase';
import ListCard from './ListCard';
import CreateListForm from './CreateListForm';

export default function ListGrid() {
  const [lists, setLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const fetchLists = async () => {
    setLoading(true);
    try {
      const { data, error } = await getLists();
      
      if (error) {
        throw error;
      }
      
      const uniqueLists = [];
      const seenIds = new Set();
      
      if (data && data.length > 0) {
        data.forEach(list => {
          if (!seenIds.has(list.id)) {
            seenIds.add(list.id);
            uniqueLists.push(list);
          } else {
            console.log(`Liste dupliquée ignorée: ${list.id} - ${list.title}`);
          }
        });
      }
      
      setLists(uniqueLists || []);
    } catch (error) {
      setError(error.message || 'Une erreur est survenue lors du chargement des listes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLists();
  }, []);

  const handleCreateSuccess = (newList) => {
    if (newList && newList.id && !lists.some(list => list.id === newList.id)) {
      setLists((prevLists) => [newList, ...prevLists]);
    }
    setShowCreateForm(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="relative">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200"></div>
          <div className="absolute top-0 left-0 animate-spin rounded-full h-16 w-16 border-t-4 border-l-4 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div className="flex items-center">
          <div className="h-10 w-10 flex-shrink-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-md flex items-center justify-center mr-3">
            <svg className="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
            Mes listes
          </h2>
        </div>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="py-2.5 px-5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-md transition-all transform hover:scale-105 font-medium text-sm flex items-center"
        >
          <svg className="h-5 w-5 mr-1.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          {showCreateForm ? 'Annuler' : 'Nouvelle liste'}
        </button>
      </div>
      
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg shadow-sm animate-pulse mb-6">
          <div className="flex">
            <svg className="h-5 w-5 text-red-500 mr-2 mt-0.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>{error}</p>
          </div>
        </div>
      )}
      
      {showCreateForm && (
        <div className="mb-6 bg-white rounded-xl shadow-md border border-blue-100 p-6 transform transition-all hover:shadow-lg">
          <h3 className="text-lg font-medium mb-4 bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
            Créer une nouvelle liste
          </h3>
          <CreateListForm onSuccess={handleCreateSuccess} />
        </div>
      )}
      
      {lists.length === 0 && !showCreateForm ? (
        <div className="text-center py-16 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-md border border-blue-100 transform transition-all hover:shadow-lg">
          <div className="mx-auto h-20 w-20 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-md mb-4">
            <svg className="h-10 w-10 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <h3 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
            Aucune liste pour le moment
          </h3>
          <p className="mt-2 text-gray-600">C'est le moment idéal pour créer votre première liste</p>
          <button
            onClick={() => setShowCreateForm(true)}
            className="mt-6 py-3 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-md transition-all transform hover:scale-105 font-medium"
          >
            <svg className="h-5 w-5 inline-block mr-1.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Créer une liste
          </button>
        </div>
      ) : ( 
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {lists.map((list) => (
            <div key={`${list.id}-${list.role || 'member'}`} className="transform transition-all hover:scale-[1.02]">
              <ListCard list={list} />
            </div>
          ))}
        </div>
      )}
      
      {/* Bouton pour rafraîchir les listes */}
      <div className="flex justify-center mt-8">
        <button
          onClick={fetchLists}
          className="py-2 px-4 bg-white border border-blue-200 rounded-lg text-blue-700 hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm transition-all transform hover:scale-105 font-medium text-sm flex items-center"
        >
          <svg className="h-4 w-4 mr-1.5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Actualiser
        </button>
      </div>
    </div>
  );
}