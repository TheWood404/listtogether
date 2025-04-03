// app/invitation/[inviteId]/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase, acceptInvitation } from '@/app/lib/supabase';

export default function InvitationPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [invitation, setInvitation] = useState(null);
  const [list, setList] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const params = useParams();
  const router = useRouter();
  const inviteId = params.inviteId;

  // Check authentication status
  useEffect(() => {
    const checkAuth = async () => {
      const { data } = await supabase.auth.getSession();
      setIsAuthenticated(!!data.session);
      setLoading(false);
    };

    checkAuth();

    // Subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => {
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  // Fetch invitation details
  useEffect(() => {
    const fetchInvitation = async () => {
      if (!inviteId) return;

      try {
        const { data, error } = await supabase
          .from('invitations')
          .select(`
            *,
            list:list_id (
              id,
              title,
              description
            )
          `)
          .eq('token', inviteId)
          .single();

        if (error) {
          throw error;
        }

        setInvitation(data);
        setList(data.list);
      } catch (error) {
        setError('Cette invitation n\'est pas valide ou a expiré.');
      } finally {
        setLoading(false);
      }
    };

    fetchInvitation();
  }, [inviteId]);

  const handleAcceptInvitation = async () => {
    if (!isAuthenticated) {
      // Redirect to login page with redirect back to this page
      router.push(`/auth/login?redirect=/invitation/${inviteId}`);
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await acceptInvitation(inviteId);
      
      if (error) {
        throw error;
      }
      
      // Redirect to the list page
      router.push(`/list/${data.listId}`);
      router.refresh();
    } catch (error) {
      setError(error.message || 'Une erreur est survenue lors de l\'acceptation de l\'invitation');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <div className="text-red-500 mb-4">
            <svg className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Invitation invalide</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  if (!invitation || !list) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-50 p-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
          <h2 className="text-xl font-semibold text-gray-800 mb-2">Invitation introuvable</h2>
          <p className="text-gray-600 mb-4">Cette invitation n'existe pas ou a expiré.</p>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-800 mb-2">Invitation à rejoindre une liste</h2>
        
        <div className="bg-gray-50 p-4 rounded-md mb-4">
          <h3 className="font-medium text-gray-800">{list.title}</h3>
          {list.description && (
            <p className="text-sm text-gray-500 mt-1">{list.description}</p>
          )}
        </div>
        
        <p className="text-gray-600 mb-6">
          Vous avez été invité à collaborer sur cette liste partagée. Acceptez l'invitation pour commencer à l'utiliser.
        </p>
        
        {!isAuthenticated ? (
          <div>
            <p className="text-sm text-gray-500 mb-4">
              Vous devez vous connecter ou créer un compte pour rejoindre cette liste.
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.push(`/auth/login?redirect=/invitation/${inviteId}`)}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Se connecter
              </button>
              <button
                onClick={() => router.push(`/auth/register?redirect=/invitation/${inviteId}`)}
                className="w-full px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Créer un compte
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <button
              onClick={handleAcceptInvitation}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
            >
              {loading ? 'Acceptation...' : 'Accepter l\'invitation'}
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full px-4 py-2 border border-gray-300 bg-white text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Ignorer
            </button>
          </div>
        )}
      </div>
    </div>
  );
} 