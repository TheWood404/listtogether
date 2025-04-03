'use client';

import { useState, useRef } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toggleTaskCompletion, deleteTask } from '@/app/lib/supabase';

export default function TaskItem({ task, onTaskDeleted }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [localCompleted, setLocalCompleted] = useState(task.completed);
  const [showMenu, setShowMenu] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const menuRef = useRef(null);
  
  const formattedDate = task.created_at 
    ? formatDistanceToNow(new Date(task.created_at), { addSuffix: true, locale: fr })
    : '';
  
  const handleToggleCompletion = async () => {
    setIsUpdating(true);
    // Mettre à jour l'état local immédiatement pour un retour visuel instantané
    setLocalCompleted(!localCompleted);
    
    try {
      await toggleTaskCompletion(task.id, !localCompleted);
    } catch (error) {
      // En cas d'erreur, revenir à l'état d'origine
      setLocalCompleted(localCompleted);
      console.error('Error toggling task completion:', error);
    } finally {
      setIsUpdating(false);
    }
  };
  
  const handleDeleteClick = async () => {
    setIsDeleting(true);
    try {
      const { error } = await deleteTask(task.id);
      if (error) {
        throw error;
      }
      if (onTaskDeleted) {
        onTaskDeleted(task.id);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    } finally {
      setIsDeleting(false);
      setShowMenu(false);
    }
  };
  
  const toggleMenu = () => {
    setShowMenu(!showMenu);
  };

  // Fermer le menu en cliquant à l'extérieur
  const handleClickOutside = (e) => {
    if (menuRef.current && !menuRef.current.contains(e.target)) {
      setShowMenu(false);
    }
  };

  // Ajouter l'écouteur d'événement au montage du composant
  useState(() => {
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    } else {
      document.removeEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  return (
    <div className={`py-4 ${localCompleted ? 'bg-gray-50' : 'bg-white'}`}>
      <div className="flex items-start">
        <div className="mr-3 pt-1">
          <input
            type="checkbox"
            checked={localCompleted}
            onChange={handleToggleCompletion}
            disabled={isUpdating}
            className="h-5 w-5 text-blue-600 rounded focus:ring-blue-500"
          />
        </div>
        
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-medium ${localCompleted ? 'text-gray-500 line-through' : 'text-gray-800'}`}>
            {task.title}
          </p>
          
          {task.description && (
            <p className="mt-1 text-sm text-gray-500">
              {task.description}
            </p>
          )}
          
          <div className="mt-2 flex items-center text-xs text-gray-500">
            <span>
              Ajouté {formattedDate}
            </span>
          </div>
        </div>
        
        <div className="ml-3 flex-shrink-0 flex relative">
          <button
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
            title="Options"
            onClick={toggleMenu}
            disabled={isDeleting}
          >
            {/* Icon for more options */}
            <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
            </svg>
          </button>
          
          {showMenu && (
            <div 
              ref={menuRef}
              className="absolute right-0 top-6 mt-1 w-48 bg-white rounded-md shadow-lg z-10 border border-gray-200"
            >
              <div className="py-1">
                <button
                  onClick={handleDeleteClick}
                  disabled={isDeleting}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 focus:outline-none"
                >
                  {isDeleting ? 'Suppression...' : 'Supprimer'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}