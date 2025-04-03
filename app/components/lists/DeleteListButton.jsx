'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteList } from '@/app/lib/supabase';

export default function DeleteListButton({ listId, isOwner }) {
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const router = useRouter();

  // Ne pas afficher le bouton si l'utilisateur n'est pas propriétaire
  if (!isOwner) {
    return null;
  }

  const handleDeleteClick = () => {
    setIsConfirmOpen(true);
  };

  const handleCancelDelete = () => {
    setIsConfirmOpen(false);
  };

  const handleConfirmDelete = async () => {
    setLoading(true);
    setError(null);

    try {
      const { success, error } = await deleteList(listId);
      
      if (error) {
        throw error;
      }
      
      // Rediriger vers le dashboard après suppression
      router.push('/dashboard');
      router.refresh();
    } catch (error) {
      setError(error.message || 'Une erreur est survenue lors de la suppression');
      setIsConfirmOpen(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        onClick={handleDeleteClick}
        className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
        aria-label="Supprimer la liste"
      >
        Supprimer la liste
      </button>

      {error && (
        <div className="mt-2 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {isConfirmOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Confirmer la suppression
            </h3>
            <p className="mb-4 text-gray-700">
              Êtes-vous sûr de vouloir supprimer cette liste ? Cette action est irréversible.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={handleCancelDelete}
                disabled={loading}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
              >
                {loading ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}