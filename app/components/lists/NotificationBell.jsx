'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, acceptInvitation } from '@/app/lib/supabase';

const NotificationBell = ({ userId }) => {
  const router = useRouter();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    // Gestionnaire pour fermer le dropdown lorsqu'on clique en dehors
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!userId) return;
    
    const loadNotifications = async () => {
      try {
        // Étape 1: Récupérer les notifications de base
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        
        if (error) {
          console.error('Erreur lors du chargement des notifications:', error.message);
          return;
        }
        
        if (!data || data.length === 0) {
          setNotifications([]);
          setUnreadCount(0);
          return;
        }
        
        // Récupérer les IDs des invitations pour les notifications d'invitation
        const invitationIds = data
          .filter(n => n.type === 'list_invitation' && n.data?.invitation_id)
          .map(n => n.data.invitation_id);
          
        const listIds = data
          .filter(n => n.type === 'list_invitation' && n.data?.list_id)
          .map(n => n.data.list_id);
          
        const inviterIds = data
          .filter(n => n.type === 'list_invitation' && n.data?.invited_by)
          .map(n => n.data.invited_by);
        
        // Étape 2: Récupérer les détails des invitations si nécessaire
        let invitationsMap = {};
        let listsMap = {};
        let usersMap = {};
        
        if (invitationIds.length > 0) {
          const { data: invitationsData, error: invitationsError } = await supabase
            .from('invitations')
            .select('id, list_id, invited_by, email, status')
            .in('id', invitationIds);
            
          if (!invitationsError && invitationsData) {
            invitationsMap = invitationsData.reduce((acc, inv) => {
              acc[inv.id] = inv;
              return acc;
            }, {});
          }
        }
        
        if (listIds.length > 0) {
          const { data: listsData, error: listsError } = await supabase
            .from('lists')
            .select('id, title')
            .in('id', listIds);
            
          if (!listsError && listsData) {
            listsMap = listsData.reduce((acc, list) => {
              acc[list.id] = list;
              return acc;
            }, {});
          }
        }
        
        if (inviterIds.length > 0) {
          const { data: usersData, error: usersError } = await supabase
            .from('users')
            .select('id, email')
            .in('id', inviterIds);
            
          if (!usersError && usersData) {
            usersMap = usersData.reduce((acc, user) => {
              acc[user.id] = user;
              return acc;
            }, {});
          }
        }
        
        // Étape 3: Enrichir les notifications avec les données associées
        const enrichedNotifications = data.map(notification => {
          const enriched = { ...notification };
          
          if (notification.type === 'list_invitation') {
            // Ajouter les détails de l'invitation
            const invitationId = notification.data?.invitation_id;
            if (invitationId && invitationsMap[invitationId]) {
              enriched.invitation = invitationsMap[invitationId];
            }
            
            // Ajouter les détails de la liste
            const listId = notification.data?.list_id;
            if (listId && listsMap[listId]) {
              enriched.list = listsMap[listId];
            }
            
            // Ajouter les détails de l'invitant
            const inviterId = notification.data?.invited_by;
            if (inviterId && usersMap[inviterId]) {
              enriched.inviter = usersMap[inviterId];
              
              // Extraire le nom d'utilisateur de l'email
              if (usersMap[inviterId].email) {
                enriched.inviterName = usersMap[inviterId].email.split('@')[0];
              }
            }
          }
          
          return enriched;
        });
        
        setNotifications(enrichedNotifications);
        setUnreadCount(enrichedNotifications.filter(n => !n.read).length);
      } catch (error) {
        console.error('Erreur lors du chargement des notifications:', error);
      }
    };
    
    loadNotifications();
    
    // Abonnement aux nouvelles notifications
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`
      }, (payload) => {
        console.log('Nouvelle notification reçue:', payload);
        loadNotifications();
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const handleMarkAsRead = async (id) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);
      
      if (error) {
        console.error('Erreur lors du marquage comme lu:', error);
        return;
      }
      
      // Mettre à jour localement
      setNotifications(prev => 
        prev.map(n => n.id === id ? {...n, read: true} : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Erreur lors du marquage comme lu:', error);
    }
  };

  const handleAcceptInvitation = async (notification) => {
    try {
      setIsOpen(false); // Fermer le dropdown immédiatement pour une meilleure UX
      
      const invitationId = notification.data?.invitation_id;
      const listId = notification.data?.list_id;
      
      if (!invitationId || !listId) {
        console.error('Données d\'invitation manquantes');
        return;
      }
      
      // 1. Accepter l'invitation avec votre fonction existante
      const { data, error } = await supabase.rpc('accept_invitation_safely', { 
        invitation_id: invitationId 
      });
            
      if (error) {
        console.error('Erreur lors de l\'acceptation de l\'invitation:', error);
        return;
      }
      
      if (success) {
        // 2. Mise à jour locale de l'état
        setNotifications(prev => {
          return prev.map(n => {
            if (n.id === notification.id) {
              return {
                ...n, 
                read: true,
                invitation: {
                  ...n.invitation,
                  status: 'accepted'
                }
              };
            }
            return n;
          });
        });
        
        // Mettre à jour le compteur
        setUnreadCount(prev => Math.max(0, prev - 1));
        
        // 3. Rediriger vers la liste
        router.push(`/list/${listId}`);
      }
    } catch (error) {
      console.error('Erreur lors de l\'acceptation de l\'invitation:', error);
    }
  };

  const handleRejectInvitation = async (notification) => {
    try {
      const invitationId = notification.data?.invitation_id;
      
      if (!invitationId) {
        console.error('ID d\'invitation manquant');
        return;
      }
      
      // 1. Rejeter l'invitation
      const { error: rejectError } = await supabase
        .from('invitations')
        .update({ status: 'rejected' })
        .eq('id', invitationId);
      
      if (rejectError) {
        console.error('Erreur lors du rejet de l\'invitation:', rejectError);
        return;
      }
      
      // 2. Marquer la notification comme lue
      await handleMarkAsRead(notification.id);
      
      // 3. Mise à jour locale de l'état
      setNotifications(prev => {
        return prev.map(n => {
          if (n.id === notification.id) {
            return {
              ...n, 
              read: true,
              invitation: {
                ...n.invitation,
                status: 'rejected'
              }
            };
          }
          return n;
        });
      });
    } catch (error) {
      console.error('Erreur lors du rejet de l\'invitation:', error);
    }
  };

  const getNotificationMessage = (notification) => {
    if (notification.type === 'list_invitation') {
      // Utiliser les informations enrichies
      const inviterName = notification.inviterName || 'Quelqu\'un';
      const listTitle = notification.list?.title || 'une liste';
      
      return `${inviterName} vous invite à rejoindre la liste "${listTitle}"`;
    }
    
    return 'Nouvelle notification';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none"
        aria-label="Notifications"
      >
        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
            {unreadCount}
          </span>
        )}
      </button>
      
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg overflow-hidden z-50">
          <div className="py-2">
            <div className="px-4 py-2 text-sm font-medium text-gray-700 border-b border-gray-100">
              Notifications
            </div>
            
            {notifications.length === 0 ? (
              <div className="px-4 py-6 text-sm text-gray-500 text-center">
                Aucune notification
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {notifications.map(notification => {
                  const isInvitation = notification.type === 'list_invitation';
                  const invitationId = isInvitation && notification.data?.invitation_id;
                  const invitationStatus = isInvitation && notification.invitation?.status;
                  const isAlreadyHandled = isInvitation && invitationStatus && invitationStatus !== 'pending';
                  
                  return (
                    <div 
                      key={notification.id} 
                      className={`px-4 py-3 border-b border-gray-100 ${!notification.read ? 'bg-blue-50' : ''}`}
                    >
                      <div className="flex items-start">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-800">
                            {getNotificationMessage(notification)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(notification.created_at).toLocaleString()}
                          </p>
                          
                          {isInvitation && !isAlreadyHandled && (
                            <div className="flex mt-2 space-x-2">
                              <button 
                                onClick={() => handleAcceptInvitation(notification)}
                                className="text-xs bg-blue-500 text-white px-3 py-1 rounded-md hover:bg-blue-600"
                              >
                                Accepter
                              </button>
                              <button 
                                onClick={() => handleRejectInvitation(notification)}
                                className="text-xs bg-gray-200 text-gray-700 px-3 py-1 rounded-md hover:bg-gray-300"
                              >
                                Refuser
                              </button>
                            </div>
                          )}
                          
                          {isInvitation && isAlreadyHandled && (
                            <div className="mt-2">
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                invitationStatus === 'accepted' 
                                  ? 'bg-green-100 text-green-700' 
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {invitationStatus === 'accepted' 
                                  ? 'Invitation acceptée' 
                                  : 'Invitation refusée'}
                              </span>
                            </div>
                          )}
                          
                          {!notification.read && !isAlreadyHandled && (
                            <button 
                              onClick={() => handleMarkAsRead(notification.id)}
                              className="text-xs text-blue-500 hover:text-blue-700 mt-2 block"
                            >
                              Marquer comme lu
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;