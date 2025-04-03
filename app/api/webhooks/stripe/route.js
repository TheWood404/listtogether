// app/api/webhooks/stripe/route.js
import { NextResponse } from 'next/server';
import { handleWebhook } from '@/app/lib/stripe';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

export async function POST(request) {
  try {
    const text = await request.text();
    const signature = request.headers.get('stripe-signature');
    
    if (!signature || !webhookSecret) {
      return NextResponse.json(
        { error: 'Signature ou clé webhook manquante' },
        { status: 400 }
      );
    }
    
    // Vérifier la signature
    const event = stripe.webhooks.constructEvent(text, signature, webhookSecret);
    
    // Traiter l'événement
    await handleWebhook(event);
    
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Erreur lors du traitement du webhook:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    );
  }
}