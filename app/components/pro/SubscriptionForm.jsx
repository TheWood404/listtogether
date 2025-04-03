// app/components/pro/SubscriptionForm.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase, getUserSubscription } from '@/app/lib/supabase';
import { createCheckoutSession } from '@/app/lib/stripe';

export default function SubscriptionForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [userSubscription, setUserSubscription] = useState(null);
  const [billingOption, setBillingOption] = useState('monthly'); // 'monthly' ou 'yearly'
  const router = useRouter();
  
  // Prix des abonnements (en centimes)
  const prices = {
    monthly: { amount: 100, id: process.env.NEXT_PUBLIC_STRIPE_MONTHLY_PRICE_ID },
    yearly: { amount: 1000, id: process.env.NEXT_PUBLIC_STRIPE_YEARLY_PRICE_ID },
  };

  useEffect(() => {
    const fetchSubscription = async () => {
      try {
        const { data, error } = await getUserSubscription();
        
        if (error) throw error;
        
        setUserSubscription(data);
      } catch (error) {
        console.error('Erreur lors de la récupération de l\'abonnement:', error);
      }
    };
    
    fetchSubscription();
  }, []);

  const handleSubscribe = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) throw userError;
      
      const priceId = prices[billingOption].id;
      const customerId = userSubscription?.stripe_customer_id;
      
      const { sessionId, error } = await createCheckoutSession({
        priceId,
        customerId,
        userId: userData.user.id,
      });
      
      if (error) throw error;
      
      // Rediriger vers Stripe Checkout
      const stripe = await loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);
      await stripe.redirectToCheckout({ sessionId });
    } catch (error) {
      setError(error.message || 'Une erreur est survenue lors de la création de l\'abonnement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-2xl font-semibold text-gray-800 mb-4">Passez à ListTogether Pro</h2>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}
      
      <div className="mb-6">
        <h3 className="text-lg font-medium text-gray-800 mb-3">Choisissez votre plan</h3>
        
        <div className="flex space-x-4 mb-4">
          <button
            type="button"
            onClick={() => setBillingOption('monthly')}
            className={`flex-1 py-2 px-4 rounded-md ${
              billingOption === 'monthly'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Mensuel
          </button>
          <button
            type="button"
            onClick={() => setBillingOption('yearly')}
            className={`flex-1 py-2 px-4 rounded-md ${
              billingOption === 'yearly'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Annuel
            <span className="ml-1 text-xs">-16%</span>
          </button>
        </div>
        
        <div className="bg-gray-50 p-5 rounded-lg">
          <div className="flex justify-between items-baseline mb-2">
            <h4 className="text-xl font-bold text-gray-800">
              {billingOption === 'monthly' ? '1€' : '10€'}
              <span className="text-sm font-normal text-gray-500">
                /{billingOption === 'monthly' ? 'mois' : 'an'}
              </span>
            </h4>
            {billingOption === 'yearly' && (
              <span className="text-sm text-green-600">Économisez 2€</span>
            )}
          </div>
          
          <ul className="space-y-2 mb-4">
            <li className="flex items-center text-gray-700">
              <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Listes illimitées
            </li>
            <li className="flex items-center text-gray-700">
              <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Notifications en temps réel
            </li>
            <li className="flex items-center text-gray-700">
              <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Personnalisation de l'interface
            </li>
            <li className="flex items-center text-gray-700">
              <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Deadlines sur les tâches
            </li>
            <li className="flex items-center text-gray-700">
              <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Historique des tâches
            </li>
            <li className="flex items-center text-gray-700">
              <svg className="h-5 w-5 text-green-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Chat intégré
            </li>
          </ul>
          
          <button
            type="button"
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {loading ? 'Chargement...' : 'S\'abonner maintenant'}
          </button>
        </div>
      </div>
      
      <div className="text-sm text-gray-500">
        <p>Paiement sécurisé par Stripe. Annulez à tout moment.</p>
      </div>
    </div>
  );
}