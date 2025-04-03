// app/lib/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL or Anonymous Key not provided');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Helper functions for auth
export const signUp = async (email, password) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  });
  return { data, error };
};

// Fonction pour générer un token aléatoire
const generateToken = () => {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
};

export const signIn = async (email, password) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  return { data, error };
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

export const resetPassword = async (email) => {
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/auth/reset-password`,
  });
  return { data, error };
};

// Helper functions for lists
// Mise à jour de la fonction createList dans app/lib/supabase.js
export const createList = async (title, description = '') => {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  
  if (userError) {
    return { error: userError };
  }
  
  const userId = userData.user.id;
  
  // Utiliser la fonction RPC pour créer la liste et ajouter le propriétaire en une transaction
  const { data, error } = await supabase.rpc('create_list_with_owner', {
    p_title: title,
    p_description: description,
    p_owner_id: userId
  });
  
  if (error) {
    console.error('Erreur lors de la création de la liste:', error);
    return { error };
  }
  
  return { data };
};

export const getLists = async () => {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  
  if (userError) {
    return { error: userError };
  }
  
  const userId = userData.user.id;
  
  try {
    // Utiliser la méthode `.select()` pour obtenir toutes les données nécessaires en une seule requête
    const { data, error } = await supabase
      .from('list_members')
      .select(`
        list_id,
        role,
        lists (
          id,
          title,
          description,
          created_at,
          updated_at,
          customization,
          owner_id
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { foreignTable: 'lists', ascending: false });
    
    if (error) {
      return { error };
    }
    
    // Utiliser un Map pour dédupliquer par ID et conserver les rôles
    const listsMap = new Map();
    
    data.forEach(item => {
      if (item.lists) {
        const list = {
          id: item.list_id,
          role: item.role,
          ...item.lists,
          // Vérifier si l'utilisateur est le propriétaire
          isOwner: item.lists.owner_id === userId
        };
        
        // Si la liste n'existe pas encore dans le Map OU
        // si elle existe mais que le rôle actuel est 'owner' (priorité au rôle propriétaire)
        if (!listsMap.has(list.id) || (listsMap.has(list.id) && item.role === 'owner')) {
          listsMap.set(list.id, list);
        }
      }
    });
    
    // Convertir le Map en tableau
    const uniqueLists = Array.from(listsMap.values());
    
    console.log(`getLists: Récupéré ${uniqueLists.length} listes uniques (${data.length} résultats bruts)`);
    
    return { data: uniqueLists };
  } catch (e) {
    console.error('Erreur dans getLists:', e);
    return { error: e.message || 'Une erreur est survenue lors de la récupération des listes' };
  }
};

// Version corrigée de getListById dans app/lib/supabase.js

export const getListById = async (listId) => {
  try {
    // Obtenir l'utilisateur actuel
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      throw userError;
    }
    
    const userId = userData.user.id;
    
    // Récupérer les détails de la liste
    const { data: list, error } = await supabase
      .from('lists')
      .select('*')
      .eq('id', listId)
      .single();
    
    if (error) {
      throw error;
    }
    
    // Vérifier si l'utilisateur est le propriétaire de la liste
    const isOwner = list.owner_id === userId;
    
    console.log(`getListById - Liste récupérée: ID=${list.id}, title=${list.title}, owner_id=${list.owner_id}`);
    console.log(`getListById - Utilisateur actuel: ID=${userId}, isOwner=${isOwner}`);
    
    return { 
      data: list, 
      isOwner: isOwner 
    };
  } catch (error) {
    console.error("Erreur dans getListById:", error);
    return { 
      error: error.message || "Erreur lors de la récupération de la liste" 
    };
  }
};

// Helper functions for tasks
// Créer une nouvelle tâche
export const createTask = async (listId, title, description = '') => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      throw userError;
    }
    
    const userId = userData.user.id;
    
    // Vérifier que l'utilisateur est membre de la liste
    const { data: isMember, error: memberError } = await supabase
      .rpc('check_list_membership', { 
        list_id_param: listId,
        user_id_param: userId
      });
    
    if (memberError) {
      throw memberError;
    }
    
    if (!isMember) {
      throw new Error("Vous n'avez pas l'autorisation d'ajouter des tâches à cette liste");
    }
    
    // Créer la tâche
    const { data, error } = await supabase
      .from('tasks')
      .insert([
        { 
          list_id: listId, 
          title, 
          description,
          created_by: userId
        }
      ])
      .select();
    
    if (error) {
      throw error;
    }
    
    return { data: data[0] };
  } catch (error) {
    console.error('Error creating task:', error);
    return { error: error.message || 'Une erreur est survenue lors de la création de la tâche' };
  }
};


// Solution 2: Modifier la fonction qui récupère les tâches pour éviter le problème

export const getTasksByListId = async (listId) => {
  try {
    // Version modifiée sans jointure sur created_by
    const { data, error } = await supabase
      .from('tasks')
      .select('id, list_id, title, description, completed, created_at')  // Ne pas inclure created_by
      .eq('list_id', listId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return { data };
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return { error };
  }
};

// Si vous avez besoin des informations de l'utilisateur qui a créé la tâche,
// vous pouvez les récupérer séparément et les ajouter au frontend:

export const getTaskCreators = async (taskIds) => {
  try {
    // Récupérer les informations de created_by pour chaque tâche
    const { data, error } = await supabase
      .from('tasks')
      .select('id, created_by')
      .in('id', taskIds);
    
    if (error) {
      throw error;
    }
    
    // Créer un dictionnaire de id de tâche -> created_by
    const creatorMap = {};
    data.forEach(task => {
      creatorMap[task.id] = task.created_by;
    });
    
    return { data: creatorMap };
  } catch (error) {
    console.error('Error fetching task creators:', error);
    return { error };
  }
};

// Récupérer toutes les tâches d'une liste
export const getTasks = async (listId) => {
  try {
    // Vérifier que l'utilisateur est connecté
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      throw userError;
    }
    
    // Récupérer les tâches sans JOIN problématique
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('list_id', listId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw error;
    }
    
    return { data };
  } catch (error) {
    console.error('Error fetching tasks:', error);
    return { error: error.message || 'Erreur lors du chargement des tâches' };
  }
};


export const updateTask = async (taskId, updates) => {
  const { data, error } = await supabase
    .from('tasks')
    .update(updates)
    .eq('id', taskId)
    .select()
    .single();
  
  return { data, error };
};

// Modifier le statut d'une tâche (complétée ou non)
export const toggleTaskCompletion = async (taskId, completed) => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      throw userError;
    }
    
    const userId = userData.user.id;
    
    // Mettre à jour la tâche
    const updateData = {
      completed,
      completed_at: completed ? new Date() : null,
      completed_by: completed ? userId : null
    };
    
    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', taskId)
      .select();
    
    if (error) {
      throw error;
    }
    
    return { data: data[0] };
  } catch (error) {
    console.error('Error toggling task completion:', error);
    return { error: error.message || 'Une erreur est survenue lors de la mise à jour de la tâche' };
  }
};

// Helper functions for invitations
// app/lib/supabase.ts (extrait)
export async function createInvitation(listId, email, invitedById) {
  try {
    const token = Math.random().toString(36).substring(2) + Date.now();
    
    // 1. Créer l'invitation
    const { data, error } = await supabase
      .from('invitations')
      .insert([{
        list_id: listId,
        invited_by: invitedById,
        email: email,
        token: token,
        status: 'pending',
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
      }])
      .select();

    if (error) throw error;
    
    if (!data || data.length === 0) {
      throw new Error("Aucune invitation n'a été créée");
    }

    // 2. Tenter de créer une notification si l'utilisateur existe
    // Mais ne pas échouer si ça ne marche pas
    try {
      // Recherche de l'utilisateur par email (méthode simplifiée)
      const { data: userData } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .maybeSingle();
      
      // Si un utilisateur est trouvé, créer une notification
      if (userData && userData.id) {
        await supabase
          .from('notifications')
          .insert([{
            user_id: userData.id,
            type: 'list_invitation',
            data: {
              list_id: listId,
              invited_by: invitedById,
              invitation_id: data[0].id
            },
            read: false
          }]);
      }
    } catch (notifError) {
      // Ignorer les erreurs de notification, l'invitation a quand même été créée
      console.warn('Notification non créée, mais invitation envoyée:', notifError);
    }

    return {
      ...data[0],
      inviteLink: `${window.location.origin}/accept-invite?token=${token}`
    };
  } catch (error) {
    console.error("Erreur dans createInvitation:", error);
    return { error: error.message || "Erreur lors de la création de l'invitation" };
  }
}

// S'abonner aux changements dans une liste (temps réel)
export const subscribeToList = (listId, callback) => {
  return supabase
    .channel(`public:tasks:list_id=eq.${listId}`)
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'tasks',
      filter: `list_id=eq.${listId}`
    }, payload => {
      callback(payload);
    })
    .subscribe();
};

//Supprimer une tache
export const deleteTask = async (taskId) => {
  try {
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      throw userError;
    }
    
    // Supprimer la tâche
    const { data, error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);
    
    if (error) {
      throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting task:', error);
    return { error: error.message || 'Une erreur est survenue lors de la suppression de la tâche' };
  }
};

// Subscription management
export const getUserSubscription = async () => {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select(`
      *,
      plan:plan_id (
        name,
        description,
        features,
        max_lists
      )
    `)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  
  return { data, error };
};

export const deleteList = async (listId) => {
  const { data: userData, error: userError } = await supabase.auth.getUser();
  
  if (userError) {
    return { error: userError };
  }
  
  const userId = userData.user.id;
  
  // Utiliser la fonction RPC pour supprimer la liste et toutes ses données associées
  const { data, error } = await supabase.rpc('delete_list_cascade', {
    p_list_id: listId,
    p_user_id: userId
  });
  
  if (error) {
    return { error };
  }
  
  // Si data est false, c'est que l'utilisateur n'était pas autorisé
  if (data === false) {
    return { error: { message: "Vous n'êtes pas autorisé à supprimer cette liste" } };
  }
  
  return { success: true };
};

// Version corrigée de getUserLists pour app/lib/supabase.js

// Version simplifiée de getUserLists pour app/lib/supabase.js


// Version utilisant une fonction RPC pour contourner les politiques RLS
// Version utilisant une fonction RPC pour contourner les politiques RLS
export const getUserLists = async () => {
  try {
    // Récupérer l'ID de l'utilisateur connecté
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      throw userError;
    }
    
    const userId = userData.user.id;
    
    // Essayer d'utiliser la fonction RPC d'abord
    const { data: rpcData, error: rpcError } = await supabase.rpc('get_user_lists', {
      user_id_param: userId
    });
    
    // Si la RPC fonctionne, l'utiliser
    if (!rpcError && rpcData) {
      return { data: rpcData };
    }
    
    console.warn('RPC a échoué, utilisation de la méthode de secours', rpcError);
    
    // Secours : requêtes directes simplifiées
    // 1. Obtenir les listes dont l'utilisateur est propriétaire
    const { data: ownedLists, error: ownedError } = await supabase
      .from('lists')
      .select('*')
      .eq('owner_id', userId);
    
    if (ownedError) {
      console.error('Erreur lors de la récupération des listes possédées', ownedError);
      return { data: [] };
    }
    
    // 2. Préparation des listes pour le format de retour
    const formattedLists = ownedLists.map(list => ({
      ...list,
      role: 'owner',
      isOwner: true
    }));
    
    return { data: formattedLists };
  } catch (error) {
    console.error('Error fetching user lists:', error);
    return { data: [] };
  }
};
//Notifs

export const fetchNotifications = async (userId) => {
  try {
    // Utilisation de la jointure implicite de Supabase pour récupérer les informations associées
    const { data, error } = await supabase
      .from('notifications')
      .select(`
        *,
        invitations:data->invitation_id (
          id,
          list_id,
          invited_by,
          email,
          status
        ),
        users:data->invited_by (
          email
        ),
        lists:data->list_id (
          title
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    
    // Enrichir les données avec des informations utiles
    const enrichedData = data.map(notification => {
      const enriched = { ...notification };
      
      // Ajouter le nom de l'invitant
      if (notification.users && notification.users.email) {
        enriched.inviterName = notification.users.email.split('@')[0];
      }
      
      // Titre de la liste
      if (notification.lists && notification.lists.title) {
        enriched.listTitle = notification.lists.title;
      }
      
      return enriched;
    });
    
    return { data: enrichedData };
  } catch (error) {
    console.error('Erreur lors de la récupération des notifications:', error);
    return { error };
  }
};

export const markNotificationAsRead = async (notificationId) => {
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)
      .select();
    
    if (error) throw error;
    
    return { data };
  } catch (error) {
    console.error('Erreur lors du marquage de la notification comme lue:', error);
    return { error };
  }
};

export const rejectInvitation = async (invitationId) => {
  try {
    // Mettre à jour le statut de l'invitation
    const { error: invitationError } = await supabase
      .from('invitations')
      .update({ status: 'rejected' })
      .eq('id', invitationId);
    
    if (invitationError) throw invitationError;
    
    // Récupérer les notifications associées pour les marquer comme lues
    const { data: userData } = await supabase.auth.getUser();
    
    if (userData && userData.user) {
      const { data: notifications } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', userData.user.id)
        .eq('type', 'list_invitation')
        .filter('data->invitation_id', 'eq', invitationId);
      
      if (notifications && notifications.length > 0) {
        // Marquer les notifications comme lues
        await supabase
          .from('notifications')
          .update({ read: true })
          .in('id', notifications.map(n => n.id));
      }
    }
    
    return { success: true };
  } catch (error) {
    console.error('Erreur lors du rejet de l\'invitation:', error);
    return { error };
  }
};

export async function acceptInvitation(invitationId) {
  try {
    // 1. Récupérer les détails de l'invitation
    const { data: invitation, error: invitationError } = await supabase
      .from('invitations')
      .select('id, list_id, email, status')
      .eq('id', invitationId)
      .single();
      
    if (invitationError) throw invitationError;
    
    // Si l'invitation est déjà acceptée, ne rien faire
    if (invitation.status === 'accepted') {
      return { success: true, alreadyAccepted: true, listId: invitation.list_id };
    }
    
    // 2. Marquer l'invitation comme acceptée
    const { error: updateError } = await supabase
      .from('invitations')
      .update({ status: 'accepted' })
      .eq('id', invitationId);
      
    if (updateError) throw updateError;
    
    // 3. Trouver l'ID de l'utilisateur actuel
    const { data: userData, error: userError } = await supabase.auth.getUser();
    
    if (userError) throw userError;
    
    const userId = userData.user.id;
    
    // 4. Vérifier si l'utilisateur est déjà membre de la liste
    const { data: existingMember, error: memberCheckError } = await supabase
      .from('list_members')
      .select('id')
      .eq('list_id', invitation.list_id)
      .eq('user_id', userId)
      .maybeSingle();
      
    if (memberCheckError) throw memberCheckError;
    
    // Si l'utilisateur est déjà membre, ne pas l'ajouter à nouveau
    if (existingMember) {
      return { success: true, alreadyMember: true, listId: invitation.list_id };
    }
    
    // 5. Ajouter l'utilisateur comme membre de la liste
    const { error: insertError } = await supabase
      .from('list_members')
      .insert({
        list_id: invitation.list_id,
        user_id: userId,
        role: 'member'
      });
      
    if (insertError) throw insertError;
    
    // 6. Marquer la notification comme lue si elle existe
    const { data: notifications, error: notifError } = await supabase
      .from('notifications')
      .select('id')
      .eq('user_id', userId)
      .eq('type', 'list_invitation')
      .filter('data->invitation_id', 'eq', invitationId);
      
    if (!notifError && notifications?.length > 0) {
      await supabase
        .from('notifications')
        .update({ read: true })
        .in('id', notifications.map(n => n.id));
    }
    
    console.log(`Invitation ${invitationId} acceptée avec succès pour la liste ${invitation.list_id}`);
    
    return { success: true, listId: invitation.list_id };
  } catch (error) {
    console.error('Erreur dans acceptInvitation:', error);
    return { error: error.message || 'Une erreur est survenue lors de l\'acceptation de l\'invitation' };
  }
}

// Vérifier si un utilisateur existe déjà avec cet email
export async function checkUserExists(email) {
  try {
    // Utiliser directement la table auth.users qui contient tous les utilisateurs enregistrés
    const { data, error } = await supabase
      .from('users') // Ou bien 'auth.users' selon votre configuration
      .select('id')
      .eq('email', email)
      .maybeSingle();
    
    if (error) {
      // Si c'est une erreur de table qui n'existe pas, retourner simplement false
      if (error.message && (
          error.message.includes('does not exist') || 
          error.message.includes('permission denied'))) {
        console.log('Vérification utilisateur: accès direct à auth.users non autorisé, utilisation de la méthode alternative');
        
        // Méthode alternative: utiliser signIn pour vérifier si l'utilisateur existe
        // Cette méthode est moins précise mais peut fonctionner comme solution temporaire
        const { data: authData, error: authError } = await supabase.auth.signInWithOtp({
          email: email,
          options: {
            shouldCreateUser: false, // Ne pas créer d'utilisateur s'il n'existe pas
          }
        });
        
        // Si pas d'erreur, l'utilisateur existe
        if (!authError) {
          return { exists: true, error: null };
        }
        
        // Si l'erreur indique que l'utilisateur n'existe pas
        if (authError.message && authError.message.includes('not found')) {
          return { exists: false, error: null };
        }
        
        return { exists: false, error: authError };
      }
      
      return { exists: false, error };
    }
    
    return { exists: Boolean(data), error: null };
  } catch (error) {
    console.error('Erreur lors de la vérification de l\'utilisateur:', error);
    // En cas d'erreur, supposer que l'utilisateur n'existe pas, mais autoriser l'invitation
    return { exists: false, error: null };
  }
}

// Version simplifiée utilisant une fonction RPC
export const getListMembers = async (listId) => {
  try {
    // Appeler la fonction RPC
    const { data, error } = await supabase.rpc('get_list_members', {
      list_id_param: listId
    });
    
    if (error) {
      console.error("Erreur RPC lors de la récupération des membres:", error);
      return { data: [] };
    }
    
    // La fonction RPC retourne directement un tableau JSON
    return { data: data || [] };
  } catch (error) {
    console.error('Erreur lors de la récupération des membres:', error);
    return { data: [] };
  }
};