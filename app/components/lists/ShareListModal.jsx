'use client';

import { useState, useRef, useEffect } from 'react';
import { createInvitation, checkUserExists } from '@/app/lib/supabase';

export default function ShareListModal({ listId, isOpen, onClose, user }) {
  const [email, setEmail] = useState('');
  const [inviteLink, setInviteLink] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showWarning, setShowWarning] = useState(false);
  const linkInputRef = useRef(null);
  const modalRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (modalRef.current && !modalRef.current.contains(event.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      setEmail('');
      setInviteLink('');
      setError(null);
      setSuccess(false);
      setCopied(false);
      setShowWarning(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!user?.id) {
      setError('Vous devez être connecté pour partager une liste');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);
    setShowWarning(false);

    try {
      // Vérifier si l'utilisateur existe
      const { exists, error: checkError } = await checkUserExists(email);
      
      if (checkError) {
        console.warn('Erreur lors de la vérification de l\'utilisateur:', checkError);
        // Continuer malgré l'erreur - nous permettrons l'invitation même si nous ne pouvons pas vérifier
      }
      
      // Si l'utilisateur n'existe pas, afficher un avertissement
      if (!exists) {
        setShowWarning(true);
      }
      
      // Créer l'invitation
      const { error, ...invitationData } = await createInvitation(
        listId, 
        email,
        user.id
      );
      
      if (error) {
        throw new Error(error);
      }
      
      if (invitationData.inviteLink) {
        setInviteLink(invitationData.inviteLink);
        setSuccess(true);
        setEmail('');
      } else {
        throw new Error('Lien d\'invitation non généré');
      }
    } catch (error) {
      console.error('Erreur lors de la création de l\'invitation:', error);
      setError(error.message || 'Erreur lors de la création de l\'invitation');
    } finally {
      setLoading(false);
    }
  };

  const copyLink = () => {
    if (linkInputRef.current) {
      linkInputRef.current.select();
      document.execCommand('copy');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div 
        ref={modalRef}
        className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Partager cette liste
          </h3>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
            aria-label="Fermer"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
            {error}
          </div>
        )}
        
        {success && (
          <div className="mb-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded text-sm">
            Invitation envoyée avec succès!
          </div>
        )}
        
        {showWarning && (
          <div className="mb-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded text-sm">
            Cet utilisateur ne possède pas encore de compte ListTogether. Il devra créer un compte avec cette adresse email pour accepter l'invitation.
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="mb-4">
          <div className="mb-3">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email de la personne à inviter
            </label>
            <input
              id="email"
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="exemple@email.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            {loading ? 'Envoi...' : 'Envoyer une invitation'}
          </button>
        </form>
        
        {inviteLink && (
          <div>
            <div className="border-t border-gray-200 pt-4 mt-4">
              <label htmlFor="inviteLink" className="block text-sm font-medium text-gray-700 mb-1">
                Ou partagez ce lien directement
              </label>
              <div className="flex mt-1">
                <input
                  ref={linkInputRef}
                  id="inviteLink"
                  type="text"
                  readOnly
                  value={inviteLink}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={copyLink}
                  className="px-4 py-2 bg-gray-100 border border-gray-300 border-l-0 rounded-r-md text-sm font-medium text-gray-700 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {copied ? 'Copié !' : 'Copier'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}