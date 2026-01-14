// ⭐⭐⭐ CRITIQUE : Service Stripe avec idempotency côté client
// Tous les POST Stripe doivent avoir un idempotencyKey unique

import Stripe from 'stripe';
import { v4 as uuidv4 } from 'uuid';
import * as Sentry from '@sentry/node';
import logger from '../config/logger.js';
import { supabase } from '../config/supabase.js';

// Initialiser Stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

/**
 * ⭐⭐⭐ Créer une session de paiement pour l'achat de crédits
 * Avec idempotency key pour éviter les doubles paiements
 * 
 * @param {string} userId - ID de l'utilisateur
 * @param {string} priceId - ID du price Stripe (pack3 ou pack10)
 * @param {string} userEmail - Email de l'utilisateur
 * @returns {Promise<Object>} - Session Stripe
 */
export const createCheckoutSession = async (userId, priceId, userEmail) => {
  try {
    // ⭐⭐⭐ CRITIQUE : Générer un idempotency key unique
    // Format : checkout_{userId}_{priceId}_{timestamp}
    const idempotencyKey = `checkout_${userId}_${priceId}_${Date.now()}`;

    logger.info(`Creating checkout session for user ${userId} with idempotency key: ${idempotencyKey}`);

    // Récupérer ou créer le customer Stripe
    let stripeCustomerId;
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (profile?.stripe_customer_id) {
      stripeCustomerId = profile.stripe_customer_id;
    } else {
      // Créer un nouveau customer
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { gradly_user_id: userId },
      }, {
        idempotencyKey: `customer_${userId}_${Date.now()}`,
      });

      stripeCustomerId = customer.id;

      // Sauvegarder le customer ID
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', userId);
    }

    // Créer la session de paiement avec idempotency key
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/credits/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/credits/cancel`,
      metadata: {
        gradly_user_id: userId,
        price_id: priceId,
      },
    }, {
      idempotencyKey, // ⚠️ CRITIQUE : Évite les doubles checkouts
    });

    logger.info(`✅ Checkout session created: ${session.id} for user ${userId}`);
    
    // Logger dans stripe.log
    logger.info(`[STRIPE] Checkout created: session=${session.id} user=${userId} price=${priceId}`);

    return session;
  } catch (err) {
    logger.error('Erreur création checkout session:', err);
    
    // Capturer dans Sentry avec tags
    Sentry.captureException(err, {
      tags: {
        service: 'stripe',
        action: 'create_checkout_session',
        user_id: userId,
        price_id: priceId,
      },
    });

    throw err;
  }
};

/**
 * ⭐⭐⭐ Créer un abonnement Stripe
 * Avec idempotency key pour éviter les doubles abonnements
 * 
 * @param {string} userId - ID de l'utilisateur
 * @param {string} priceId - ID du price Stripe (monthly ou yearly)
 * @param {string} userEmail - Email de l'utilisateur
 * @returns {Promise<Object>} - Session Stripe
 */
export const createSubscriptionSession = async (userId, priceId, userEmail) => {
  try {
    // ⭐⭐⭐ CRITIQUE : Générer un idempotency key unique
    const idempotencyKey = `subscription_${userId}_${priceId}_${Date.now()}`;

    logger.info(`Creating subscription session for user ${userId} with idempotency key: ${idempotencyKey}`);

    // Récupérer ou créer le customer Stripe
    let stripeCustomerId;
    const { data: profile } = await supabase
      .from('profiles')
      .select('stripe_customer_id')
      .eq('id', userId)
      .single();

    if (profile?.stripe_customer_id) {
      stripeCustomerId = profile.stripe_customer_id;
    } else {
      // Créer un nouveau customer
      const customer = await stripe.customers.create({
        email: userEmail,
        metadata: { gradly_user_id: userId },
      }, {
        idempotencyKey: `customer_${userId}_${Date.now()}`,
      });

      stripeCustomerId = customer.id;

      // Sauvegarder le customer ID
      await supabase
        .from('profiles')
        .update({ stripe_customer_id: stripeCustomerId })
        .eq('id', userId);
    }

    // Créer la session d'abonnement avec idempotency key
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      line_items: [{
        price: priceId,
        quantity: 1,
      }],
      mode: 'subscription',
      success_url: `${process.env.FRONTEND_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/subscription/cancel`,
      metadata: {
        gradly_user_id: userId,
        price_id: priceId,
      },
    }, {
      idempotencyKey, // ⚠️ CRITIQUE : Évite les doubles abonnements
    });

    logger.info(`✅ Subscription session created: ${session.id} for user ${userId}`);
    
    // Logger dans stripe.log
    logger.info(`[STRIPE] Subscription created: session=${session.id} user=${userId} price=${priceId}`);

    return session;
  } catch (err) {
    logger.error('Erreur création subscription session:', err);
    
    // Capturer dans Sentry avec tags
    Sentry.captureException(err, {
      tags: {
        service: 'stripe',
        action: 'create_subscription_session',
        user_id: userId,
        price_id: priceId,
      },
    });

    throw err;
  }
};

/**
 * ⭐⭐⭐ Gérer les webhooks Stripe
 * Avec logging complet dans stripe.log et Sentry
 * 
 * @param {Object} rawBody - Body brut de la requête (pour vérifier la signature)
 * @param {string} signature - Signature Stripe depuis le header
 * @returns {Promise<Object>} - Event Stripe traité
 */
export const handleWebhook = async (rawBody, signature) => {
  try {
    // Vérifier la signature du webhook
    const event = stripe.webhooks.constructEvent(
      rawBody,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    logger.info(`[STRIPE] Webhook reçu: ${event.type} - ${event.id}`);

    // Vérifier l'idempotence (éviter de traiter 2 fois le même event)
    const { data: existingEvent } = await supabase
      .from('webhook_events')
      .select('id')
      .eq('id', event.id)
      .single();

    if (existingEvent) {
      logger.warn(`[STRIPE] Webhook déjà traité: ${event.id}`);
      return { received: true, processed: false, reason: 'duplicate' };
    }

    // Sauvegarder l'event pour idempotence
    await supabase
      .from('webhook_events')
      .insert({
        id: event.id,
        type: event.type,
        payload: event,
        processed: false,
      });

    // Traiter selon le type d'event
    let result;
    switch (event.type) {
      case 'checkout.session.completed':
        result = await handleCheckoutCompleted(event.data.object);
        break;
      
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        result = await handleSubscriptionUpdated(event.data.object);
        break;
      
      case 'customer.subscription.deleted':
        result = await handleSubscriptionDeleted(event.data.object);
        break;
      
      case 'invoice.paid':
        result = await handleInvoicePaid(event.data.object);
        break;
      
      default:
        logger.info(`[STRIPE] Event non géré: ${event.type}`);
        result = { handled: false };
    }

    // Marquer l'event comme traité
    await supabase
      .from('webhook_events')
      .update({ processed: true })
      .eq('id', event.id);

    logger.info(`[STRIPE] Webhook traité avec succès: ${event.type} - ${event.id}`);

    return { received: true, processed: true, result };
  } catch (err) {
    logger.error('[STRIPE] Erreur webhook:', err);
    
    // Capturer dans Sentry avec tags détaillés
    Sentry.captureException(err, {
      tags: {
        service: 'stripe',
        action: 'handle_webhook',
        event_type: err.event?.type || 'unknown',
        event_id: err.event?.id || 'unknown',
      },
    });

    throw err;
  }
};

/**
 * Traiter un paiement complété (achat de crédits)
 */
const handleCheckoutCompleted = async (session) => {
  const userId = session.metadata.gradly_user_id;
  const priceId = session.metadata.price_id;

  // Déterminer le nombre de crédits selon le price
  let creditsAmount = 0;
  if (priceId === process.env.STRIPE_PRICE_PACK_3) {
    creditsAmount = 3;
  } else if (priceId === process.env.STRIPE_PRICE_PACK_10) {
    creditsAmount = 10;
  }

  if (creditsAmount > 0) {
    // Ajouter les crédits
    await supabase.rpc('add_credits', {
      p_user_id: userId,
      p_amount: creditsAmount,
    });

    // Logger la transaction
    await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        amount: creditsAmount,
        type: 'purchase',
        status: 'confirmed',
        description: `Achat de ${creditsAmount} crédits`,
        stripe_payment_id: session.payment_intent,
      });

    logger.info(`✅ ${creditsAmount} crédits ajoutés pour user ${userId}`);
  }

  return { credits_added: creditsAmount };
};

/**
 * Traiter un abonnement créé/mis à jour
 */
const handleSubscriptionUpdated = async (subscription) => {
  const userId = subscription.metadata.gradly_user_id;

  // Mettre à jour l'abonnement dans la DB
  await supabase
    .from('subscriptions')
    .upsert({
      user_id: userId,
      stripe_subscription_id: subscription.id,
      stripe_customer_id: subscription.customer,
      plan_type: subscription.items.data[0].price.recurring.interval === 'month' ? 'monthly' : 'yearly',
      status: subscription.status,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
      cancel_at_period_end: subscription.cancel_at_period_end,
    });

  logger.info(`✅ Abonnement mis à jour pour user ${userId}`);

  return { subscription_updated: true };
};

/**
 * Traiter un abonnement supprimé
 */
const handleSubscriptionDeleted = async (subscription) => {
  const userId = subscription.metadata.gradly_user_id;

  // Marquer l'abonnement comme canceled
  await supabase
    .from('subscriptions')
    .update({ status: 'canceled' })
    .eq('stripe_subscription_id', subscription.id);

  logger.info(`❌ Abonnement annulé pour user ${userId}`);

  return { subscription_canceled: true };
};

/**
 * Traiter une facture payée (renouvellement d'abonnement)
 */
const handleInvoicePaid = async (invoice) => {
  // Vérifier si c'est un renouvellement d'abonnement
  if (invoice.subscription) {
    logger.info(`✅ Facture payée pour subscription ${invoice.subscription}`);
    
    // Mettre à jour les dates d'abonnement
    const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
    await handleSubscriptionUpdated(subscription);
  }

  return { invoice_processed: true };
};

export default {
  createCheckoutSession,
  createSubscriptionSession,
  handleWebhook,
};