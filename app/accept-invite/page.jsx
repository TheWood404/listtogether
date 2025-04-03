'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/app/lib/supabase';

export default function AcceptInvite() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState('Traitement de votre invitation...');

  useEffect(() => {
    const processInvitation = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Token d\'invitation manquant');
        return;
      }
      
      try {
        // Vérifier si l'utilisateur est connecté
        const { data: authData, error: authError } = await supabase.auth.getUser();
        
        if (authError || !authData.user) {
          // Rediriger vers la page de connexion avec le token en paramètre
          router.push(`/auth/login?redirect=/accept-invite&token=${token}`);
          return;
        }
        
        // Utiliser la fonction RPC pour accepter l'invitation (résout le problème RLS)
        const { data, error } = await supabase.rpc('accept_invitation_rpc', {
          invitation_token: token
        });
        
        if (error) {
          console.error('Erreur RPC:', error);
          setStatus('error');
          setMessage('Une erreur est survenue lors de l\'acceptation de l\'invitation. Veuillez réessayer.');
          return;
        }
        
        if (!data.success) {
          setStatus('error');
          setMessage(data.error || 'Échec de l\'acceptation de l\'invitation');
          return;
        }
        
        if (data.already_accepted) {
          setStatus('success');
          setMessage('Cette invitation a déjà été acceptée');
        } else {
          setStatus('success');
          setMessage('Invitation acceptée avec succès!');
        }
        
        // Rediriger vers la liste après un court délai
        setTimeout(() => {
          router.push(`/list/${data.list_id}`);
        }, 1500);
      } catch (error) {
        console.error('Erreur générale:', error);
        setStatus('error');
        setMessage('Une erreur inattendue est survenue');
      }
    };

    processInvitation();
  }, [token, router]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 p-4">
      <div className="text-center max-w-md w-full p-8 bg-white rounded-lg shadow-lg">
        <div className="mb-4">
          {status === 'loading' && (
            <div className="flex justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          )}
          
          {status === 'success' && (
            <div className="flex justify-center">
              <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center text-green-500">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </div>
          )}
          
          {status === 'error' && (
            <div className="flex justify-center">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center text-red-500">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
          )}
        </div>
        
        <h1 className="text-2xl font-bold mb-4">
          {status === 'loading' ? 'Traitement de votre invitation' : 
           status === 'success' ? 'Invitation acceptée' : 'Erreur'}
        </h1>
        
        <p className={`${status === 'error' ? 'text-red-600' : 'text-gray-600'}`}>
          {message}
        </p>
        
        {status === 'error' && (
          <button 
            onClick={() => router.push('/dashboard')}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Retour au tableau de bord
          </button>
        )}
        
        {status === 'success' && (
          <p className="text-sm text-gray-500 mt-4">
            Redirection automatique...
          </p>
        )}
      </div>
    </div>
  );
}