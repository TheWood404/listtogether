'use client';

import { useState } from 'react';
import { supabase } from '@/app/lib/supabase';

export default function NotificationDiagnostic() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [notificationCount, setNotificationCount] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [invitationsInfo, setInvitationsInfo] = useState(null);

  const runDiagnostic = async () => {
    setLoading(true);
    setResults([]);
    
    try {
      // 1. Vérifier si l'email existe dans la base de données
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', email)
        .single();
      
      if (userError) {
        addResult('error', `Utilisateur non trouvé: ${userError.message}`);
        setUserInfo(null);
      } else {
        addResult('success', `Utilisateur trouvé: ID=${userData.id}`);
        setUserInfo(userData);
        
        // 2. Vérifier les invitations pour cet email
        const { data: invitations, error: invitationsError } = await supabase
          .from('invitations')
          .select('*')
          .eq('email', email);
        
        if (invitationsError) {
          addResult('error', `Erreur lors de la recherche des invitations: ${invitationsError.message}`);
        } else if (!invitations || invitations.length === 0) {
          addResult('warning', `Aucune invitation trouvée pour cet email`);
          setInvitationsInfo([]);
        } else {
          addResult('success', `${invitations.length} invitation(s) trouvée(s)`);
          setInvitationsInfo(invitations);
          
          // 3. Vérifier les notifications pour cet utilisateur
          const { data: notifications, error: notificationsError } = await supabase
            .from('notifications')
            .select('*')
            .eq('user_id', userData.id);
          
          if (notificationsError) {
            addResult('error', `Erreur lors de la recherche des notifications: ${notificationsError.message}`);
          } else if (!notifications || notifications.length === 0) {
            addResult('warning', `Aucune notification trouvée pour cet utilisateur`);
            setNotificationCount(0);
          } else {
            const invitationNotifs = notifications.filter(n => n.type === 'list_invitation');
            addResult('success', `${notifications.length} notification(s) trouvée(s) dont ${invitationNotifs.length} invitation(s)`);
            setNotificationCount(notifications.length);
          }
        }
        
        // 4. Vérifier la structure de la table de notifications
        const { data: notifStructure, error: structureError } = await supabase
          .rpc('check_notification_structure');
        
        if (structureError) {
          addResult('error', `Erreur lors de la vérification de la structure: ${structureError.message}`);
        } else if (notifStructure) {
          addResult('info', `Structure de la table de notifications vérifiée`);
        }
      }
    } catch (error) {
      addResult('error', `Erreur générale: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const createTestNotification = async () => {
    if (!userInfo) {
      addResult('error', 'Aucun utilisateur sélectionné');
      return;
    }
    
    setLoading(true);
    
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert([{
          user_id: userInfo.id,
          type: 'test',
          data: {
            message: 'Ceci est une notification de test',
            created_at: new Date().toISOString()
          },
          read: false
        }])
        .select();
      
      if (error) {
        addResult('error', `Erreur lors de la création de la notification de test: ${error.message}`);
      } else {
        addResult('success', `Notification de test créée avec succès: ID=${data[0].id}`);
        setNotificationCount((prev) => (prev !== null ? prev + 1 : 1));
      }
    } catch (error) {
      addResult('error', `Erreur générale: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  const addResult = (type, message) => {
    setResults(prev => [...prev, { type, message, timestamp: new Date().toISOString() }]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Diagnostic des Notifications</h1>
      
      <div className="mb-6 p-4 bg-gray-100 rounded-lg">
        <h2 className="text-lg font-semibold mb-3">Vérifier un email</h2>
        <div className="flex gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email à vérifier"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
          />
          <button
            onClick={runDiagnostic}
            disabled={loading || !email}
            className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
          >
            {loading ? 'Vérification...' : 'Vérifier'}
          </button>
        </div>
      </div>
      
      {userInfo && (
        <div className="mb-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold">Informations utilisateur</h2>
            <button
              onClick={createTestNotification}
              disabled={loading}
              className="px-3 py-1 bg-green-600 text-white text-sm rounded-md"
            >
              Créer une notification de test
            </button>
          </div>
          
          <div className="mt-2 p-4 bg-white border rounded-md">
            <p><strong>ID:</strong> {userInfo.id}</p>
            <p><strong>Email:</strong> {userInfo.email}</p>
            <p><strong>Notifications:</strong> {notificationCount !== null ? notificationCount : 'Inconnu'}</p>
          </div>
        </div>
      )}
      
      {invitationsInfo && invitationsInfo.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-2">Invitations ({invitationsInfo.length})</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Liste</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Statut</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Créée le</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Expire le</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {invitationsInfo.map((invitation) => (
                  <tr key={invitation.id}>
                    <td className="px-4 py-2 text-sm text-gray-900">{invitation.id.substring(0, 8)}...</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{invitation.list_id.substring(0, 8)}...</td>
                    <td className="px-4 py-2 text-sm">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        invitation.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                        invitation.status === 'accepted' ? 'bg-green-100 text-green-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {invitation.status}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900">{new Date(invitation.created_at).toLocaleString()}</td>
                    <td className="px-4 py-2 text-sm text-gray-900">{new Date(invitation.expires_at).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      
      <div>
        <h2 className="text-lg font-semibold mb-2">Résultats du diagnostic</h2>
        <div className="border rounded-md overflow-hidden">
          {results.length === 0 ? (
            <p className="p-4 text-gray-500">Aucun résultat à afficher</p>
          ) : (
            <div className="max-h-80 overflow-y-auto">
              {results.map((result, index) => (
                <div 
                  key={index}
                  className={`p-3 border-b ${
                    result.type === 'error' ? 'bg-red-50' :
                    result.type === 'warning' ? 'bg-yellow-50' :
                    result.type === 'success' ? 'bg-green-50' :
                    'bg-blue-50'
                  }`}
                >
                  <div className="flex items-start">
                    <span className={`mr-2 ${
                      result.type === 'error' ? 'text-red-500' :
                      result.type === 'warning' ? 'text-yellow-500' :
                      result.type === 'success' ? 'text-green-500' :
                      'text-blue-500'
                    }`}>
                      {result.type === 'error' ? '❌' :
                       result.type === 'warning' ? '⚠️' :
                       result.type === 'success' ? '✅' : 'ℹ️'}
                    </span>
                    <div>
                      <p className="text-sm">{result.message}</p>
                      <p className="text-xs text-gray-500">{new Date(result.timestamp).toLocaleTimeString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Vous devez ajouter cette fonction RPC dans votre base de données Supabase
// 
// CREATE OR REPLACE FUNCTION check_notification_structure()
// RETURNS BOOLEAN
// LANGUAGE plpgsql
// SECURITY DEFINER
// AS $$
// BEGIN
//   -- Vérifier si la table existe
//   IF NOT EXISTS (
//     SELECT FROM pg_tables 
//     WHERE schemaname = 'public' 
//     AND tablename = 'notifications'
//   ) THEN
//     RAISE EXCEPTION 'La table notifications n''existe pas';
//   END IF;
//   
//   -- Vérifier les colonnes nécessaires
//   IF NOT EXISTS (
//     SELECT FROM information_schema.columns 
//     WHERE table_schema = 'public' 
//     AND table_name = 'notifications' 
//     AND column_name = 'user_id'
//   ) THEN
//     RAISE EXCEPTION 'La colonne user_id n''existe pas dans la table notifications';
//   END IF;
//   
//   IF NOT EXISTS (
//     SELECT FROM information_schema.columns 
//     WHERE table_schema = 'public' 
//     AND table_name = 'notifications' 
//     AND column_name = 'type'
//   ) THEN
//     RAISE EXCEPTION 'La colonne type n''existe pas dans la table notifications';
//   END IF;
//   
//   IF NOT EXISTS (
//     SELECT FROM information_schema.columns 
//     WHERE table_schema = 'public' 
//     AND table_name = 'notifications' 
//     AND column_name = 'data'
//   ) THEN
//     RAISE EXCEPTION 'La colonne data n''existe pas dans la table notifications';
//   END IF;
//   
//   RETURN TRUE;
// END;
// $$;