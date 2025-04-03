// app/lib/stripe.js
import Stripe from 'stripe';
import { supabase } from './supabase';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

if (!stripeSecretKey) {
  throw new Error('La clé secrète Stripe n\'est pas définie');
}

const stripe = new Stripe(stripeSecretKey);

export const createCheckoutSession = async ({ priceId, customerId, userId, mode = 'subscription' }) => {
  try {
    // Si l'utilisateur n'a pas de customerId, créez-en un
    let customer = customerId;
    
    if (!customer) {
      const { data: userData } = await supabase.auth.getUser();
      const email = userData.user.email;
      
      const customerData = await stripe.customers.create({
        email,
        metadata: {
          userId,
        },
      });
      
      customer = customerData.id;
      
      // Enregistrer le customerId dans la base de données
      await supabase
        .from('user_subscriptions')
        .upsert({
          user_id: userId,
          stripe_customer_id: customer,
          status: 'incomplete',
        });
    }
    
    // Créer la session de paiement
    const session = await stripe.checkout.sessions.create({
      customer,
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/pro`,
      metadata: {
        userId,
      },
    });
    
    return { sessionId: session.id };
  } catch (error) {
    console.error('Erreur lors de la création de la session de paiement:', error);
    throw error;
  }
};

export const getSubscription = async (subscriptionId) => {
  try {
    const subscription = await stripe.subscriptions.retrieve(subscriptionId);
    return subscription;
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'abonnement:', error);
    throw error;
  }
};

export const cancelSubscription = async (subscriptionId) => {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: true,
    });
    return subscription;
  } catch (error) {
    console.error('Erreur lors de l\'annulation de l\'abonnement:', error);
    throw error;
  }
};

export const reactivateSubscription = async (subscriptionId) => {
  try {
    const subscription = await stripe.subscriptions.update(subscriptionId, {
      cancel_at_period_end: false,
    });
    return subscription;
  } catch (error) {
    console.error('Erreur lors de la réactivation de l\'abonnement:', error);
    throw error;
  }
};

// Gestion des webhooks
export const handleWebhook = async (event) => {
  const { type, data } = event;
  
  try {
    switch (type) {
      case 'checkout.session.completed': {
        const session = data.object;
        const userId = session.metadata.userId;
        const customerId = session.customer;
        const subscriptionId = session.subscription;
        
        if (subscriptionId) {
          // Récupérer les détails de l'abonnement
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          const planId = subscription.items.data[0].price.product;
          
          // Déterminer le plan en fonction du produit Stripe
          const { data: plans } = await supabase
            .from('subscription_plans')
            .select('id')
            .eq('name', 'Pro')
            .single();
          
          const planIdInDb = plans?.id;
          
          // Mettre à jour l'abonnement utilisateur
          await supabase
            .from('user_subscriptions')
            .upsert({
              user_id: userId,
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              plan_id: planIdInDb,
              status: subscription.status,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            });
        }
        break;
      }
      
      case 'customer.subscription.updated': {
        const subscription = data.object;
        const customerId = subscription.customer;
        
        // Récupérer l'utilisateur par le customerId
        const { data: userData } = await supabase
          .from('user_subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();
        
        if (userData) {
          // Mettre à jour l'abonnement
          await supabase
            .from('user_subscriptions')
            .update({
              status: subscription.status,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            })
            .eq('stripe_customer_id', customerId);
        }
        break;
      }
      
      case 'customer.subscription.deleted': {
        const subscription = data.object;
        const customerId = subscription.customer;
        
        // Récupérer l'utilisateur par le customerId
        const { data: userData } = await supabase
          .from('user_subscriptions')
          .select('user_id')
          .eq('stripe_customer_id', customerId)
          .single();
        
        if (userData) {
          // Mettre à jour l'abonnement
          await supabase
            .from('user_subscriptions')
            .update({
              status: 'canceled',
              plan_id: 1, // plan gratuit
            })
            .eq('stripe_customer_id', customerId);
        }
        break;
      }
    }
    
    return { received: true };
  } catch (error) {
    console.error('Erreur lors du traitement du webhook:', error);
    throw error;
  }
};