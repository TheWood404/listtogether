//app/list/[listId]/page.jsx
// 
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getListById, getListMembers } from '@/app/lib/supabase';
import TaskList from '@/app/components/tasks/TaskList';
import ShareListModal from '@/app/components/lists/ShareListModal';
import DeleteListButton from '@/app/components/lists/DeleteListButton';
import { useUser } from '@/app/context/UserContext';

export default function ListPage() {
  const [list, setList] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isCurrentUserOwner, setIsCurrentUserOwner] = useState(false);
  const [members, setMembers] = useState([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  
  const { user, isLoading: isUserLoading, error: userError } = useUser();
  const params = useParams();
  const router = useRouter();
  const listId = params.listId;

  // Ajouter ces logs au début de votre composant, juste après les définitions des états
useEffect(() => {
  console.log('Environment:', process.env.NODE_ENV);
  console.log('Params:', params);
  console.log('ListId:', listId);
  
  // Vérifier si nous avons un ID de liste valide
  if (!listId) {
    console.error('ListId missing in URL parameters');
  }
}, [params, listId]);


  // Récupérer les détails de la liste
  useEffect(() => {
    if (!listId || isUserLoading) return;

    const fetchList = async () => {
      try {
        setLoading(true);
        const { data, error, isOwner } = await getListById(listId);
        
        if (error) throw error;
        
        setList(data);
        setIsCurrentUserOwner(isOwner);
      } catch (error) {
        setError(error.message || 'Une erreur est survenue');
      } finally {
        setLoading(false);
      }
    };

    fetchList();
  }, [listId, isUserLoading]);

  // Récupérer les membres de la liste
  useEffect(() => {
    if (!listId || !list) return;

    const fetchMembers = async () => {
      try {
        setLoadingMembers(true);
        const { data } = await getListMembers(listId);
        
        // Vérifier si l'utilisateur actuel est déjà dans la liste des membres
        const currentUserMember = data.find(m => m.userId === user.id);
        const membersList = [...data];
        
        // Si l'utilisateur n'est pas dans la liste des membres et qu'il est propriétaire, l'ajouter
        if (!currentUserMember && isCurrentUserOwner) {
          membersList.push({
            id: 'current-user',
            userId: user.id,
            role: 'owner',
            email: user.email
          });
        }
        
        // Identifier le propriétaire et trier les membres (propriétaire en premier)
        const sortedMembers = membersList.sort((a, b) => {
          if (a.role === 'owner') return -1;
          if (b.role === 'owner') return 1;
          return 0;
        });
        
        setMembers(sortedMembers);
      } catch (error) {
        console.error('Erreur lors du chargement des membres:', error);
        // Si erreur, afficher au moins l'utilisateur actuel
        if (user && isCurrentUserOwner) {
          setMembers([{
            id: 'current-user',
            userId: user.id,
            role: 'owner',
            email: user.email
          }]);
        } else {
          setMembers([]);
        }
      } finally {
        setLoadingMembers(false);
      }
    };

    fetchMembers();
  }, [listId, list]);

  const handleBackToDashboard = () => {
    router.push('/dashboard');
  };

  // Obtenir l'initiale d'un email pour l'avatar
  const getInitial = (email) => {
    return email ? email.charAt(0).toUpperCase() : '?';
  };

  // Obtenir le nom d'utilisateur à partir de l'email
  const getUsernameFromEmail = (email) => {
    return email ? email.split('@')[0] : 'Utilisateur';
  };

  // Générer une couleur cohérente basée sur l'email
  const getColorForEmail = (email) => {
    if (!email) return 'bg-gray-400';
    
    const colors = [
      'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 
      'bg-red-500', 'bg-purple-500', 'bg-pink-500',
      'bg-indigo-500', 'bg-teal-500', 'bg-orange-500'
    ];
    
    // Utiliser une somme simple des codes de caractères pour obtenir un indice
    const sum = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[sum % colors.length];
  };

  if (isUserLoading || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (userError || error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <button 
            onClick={handleBackToDashboard} 
            className="mb-6 px-4 py-2 bg-white border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-blue-600 transition-all text-sm font-medium shadow-sm flex items-center"
          >
            <svg className="h-5 w-5 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Retour au tableau de bord
          </button>
          
          <div className="p-5 bg-red-50 border border-red-200 text-red-700 rounded-lg shadow-sm">
            <div className="flex items-center">
              <svg className="h-5 w-5 text-red-500 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="font-medium">{userError?.message || error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!list) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center">
            <div className="mx-auto h-16 w-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <svg className="h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              Liste introuvable
            </h3>
            <p className="text-gray-600 mb-6">Cette liste n'existe pas ou vous n'avez pas les permissions nécessaires pour y accéder.</p>
            <button
              onClick={handleBackToDashboard}
              className="px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 shadow-sm font-medium"
            >
              Retour au tableau de bord
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* En-tête compact */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center">
            <button 
              onClick={handleBackToDashboard} 
              className="mr-4 p-2 bg-white rounded-full shadow-sm hover:bg-gray-50"
              aria-label="Retour"
            >
              <svg className="h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 className="text-xl font-bold text-gray-800">{list.title}</h1>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Avatars des membres (max 3) */}
            <div className="flex -space-x-2 mr-2">
              {members.slice(0, 3).map((member, index) => (
                <div 
                  key={member.id} 
                  className={`h-8 w-8 rounded-full ${getColorForEmail(member.email)} border-2 border-white flex items-center justify-center text-white text-xs font-medium`}
                  title={member.email}
                >
                  {getInitial(member.email)}
                </div>
              ))}
              {members.length > 3 && (
                <div className="h-8 w-8 rounded-full bg-gray-200 border-2 border-white flex items-center justify-center text-gray-600 text-xs font-medium">
                  +{members.length - 3}
                </div>
              )}
            </div>
            
            {/* Menu actions */}
            <div className="relative">
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="p-2 rounded-full hover:bg-gray-100"
                aria-label="Options"
              >
                <svg className="h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </button>
              
              {isCurrentUserOwner && (
                <button
                  onClick={() => setIsShareModalOpen(true)}
                  className="ml-1 p-2 rounded-full hover:bg-gray-100"
                  aria-label="Partager"
                >
                  <svg className="h-5 w-5 text-gray-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </button>
              )}
            </div>
          </div>
        </div>
        
        {/* Description (seulement si présente et pas trop longue) */}
        {list.description && list.description.length < 100 && (
          <p className="text-gray-600 text-sm mb-6">{list.description}</p>
        )}
        
        {/* Panneau d'informations dépliable */}
        {showDetails && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6 animate-fadeIn">
            <div className="flex justify-between items-start">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Détails de la liste</h2>
              <button 
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">Informations</h3>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center text-gray-600">
                    <svg className="h-4 w-4 mr-2 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Créée le {new Date(list.created_at).toLocaleDateString()}
                  </li>
                  {list.updated_at && list.updated_at !== list.created_at && (
                    <li className="flex items-center text-gray-600">
                      <svg className="h-4 w-4 mr-2 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                      </svg>
                      Mise à jour le {new Date(list.updated_at).toLocaleDateString()}
                    </li>
                  )}
                  <li className="flex items-center text-gray-600">
                    <svg className="h-4 w-4 mr-2 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                    </svg>
                    {members.length} membre{members.length > 1 ? 's' : ''}
                  </li>
                  <li className="flex items-center text-gray-600">
                    <svg className="h-4 w-4 mr-2 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    Rôle: {isCurrentUserOwner ? 'Propriétaire' : 'Membre'}
                  </li>
                </ul>
              </div>
              
              <div>
                <h3 className="text-sm font-medium text-gray-600 mb-2">Membres</h3>
                <ul className="space-y-2">
                  {loadingMembers ? (
                    <li className="text-center py-2">
                      <div className="inline-block animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-gray-400"></div>
                    </li>
                  ) : members.length === 0 ? (
                    <li className="text-sm text-gray-500">Aucun membre trouvé</li>
                  ) : (
                    members.slice(0, 4).map((member) => (
                      <li key={member.id} className="flex items-center text-sm">
                        <div className={`h-6 w-6 rounded-full ${getColorForEmail(member.email)} flex items-center justify-center text-white text-xs font-medium`}>
                          {getInitial(member.email)}
                        </div>
                        <span className="ml-2 text-gray-700">{getUsernameFromEmail(member.email)}</span>
                        {member.role === 'owner' && (
                          <span className="ml-auto text-xs text-blue-600">
                            Propriétaire
                          </span>
                        )}
                      </li>
                    ))
                  )}
                  {members.length > 4 && (
                    <li className="text-sm text-gray-500 text-center">
                      + {members.length - 4} autre(s) membre(s)
                    </li>
                  )}
                </ul>
                
                {isCurrentUserOwner && (
                  <div className="mt-3 flex justify-between">
                    <button
                      onClick={() => setIsShareModalOpen(true)}
                      className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center"
                    >
                      <svg className="h-4 w-4 mr-1" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                      Inviter
                    </button>
                    
                    <DeleteListButton 
                      listId={listId} 
                      isOwner={isCurrentUserOwner}
                      onDelete={() => router.push('/dashboard')}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
        
        {/* Liste des tâches (principale) */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-5">
            <TaskList listId={listId} />
          </div>
        </div>
      </div>
      
      {user && ( 
        <ShareListModal
          listId={listId}
          isOpen={isShareModalOpen}
          onClose={() => setIsShareModalOpen(false)}
          user={user}
        />
      )}
      
      {/* CSS pour animations */}
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out forwards;
        }
      `}</style>
    </div>
  );
}