// ============================================================================
// GRADLY V2.5 - STRIPE CONFIGURATION
// ============================================================================
// Client Stripe + Configuration produits/prix
// ============================================================================

import Stripe from 'stripe';
import dotenv from 'dotenv';

dotenv.config();

// Vérifier que la clé Stripe existe
if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('❌ STRIPE_SECRET_KEY doit être définie dans .env');
}

// ============================================================================
// CLIENT STRIPE
// ============================================================================
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16',
  typescript: false,
  telemetry: false
});

// ============================================================================
// CONFIGURATION PRODUITS & PRIX
// ============================================================================
export const STRIPE_PRODUCTS = {
  // Pack 3 crédits : 4,99€
  PACK_3: {
    priceId: process.env.STRIPE_PRICE_PACK_3,
    credits: 3,
    amount: 499, // en centimes
    currency: 'eur',
    name: 'Pack 3 crédits'
  },

  // Pack 10 crédits : 9,99€
  PACK_10: {
    priceId: process.env.STRIPE_PRICE_PACK_10,
    credits: 10,
    amount: 999, // en centimes
    currency: 'eur',
    name: 'Pack 10 crédits'
  },

  // Abonnement mensuel : 14,99€/mois
  MONTHLY: {
    priceId: process.env.STRIPE_PRICE_MONTHLY,
    amount: 1499, // en centimes
    currency: 'eur',
    interval: 'month',
    name: 'Abonnement Mensuel',
    badge: '💎'
  },

  // Abonnement annuel : 99€/an
  YEARLY: {
    priceId: process.env.STRIPE_PRICE_YEARLY,
    amount: 9900, // en centimes
    currency: 'eur',
    interval: 'year',
    name: 'Abonnement Annuel',
    badge: '👑'
  }
};

// ============================================================================
// WEBHOOK SECRET
// ============================================================================
export const STRIPE_WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

if (!STRIPE_WEBHOOK_SECRET) {
  console.warn('⚠️ STRIPE_WEBHOOK_SECRET non défini - Webhooks ne fonctionneront pas');
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Vérifier si un priceId existe dans la configuration
 * @param {string} priceId - ID du prix Stripe
 * @returns {Object|null} Produit correspondant ou null
 */
export function getProductByPriceId(priceId) {
  for (const [key, product] of Object.entries(STRIPE_PRODUCTS)) {
    if (product.priceId === priceId) {
      return { ...product, key };
    }
  }
  return null;
}

/**
 * Vérifier si une clé Stripe est en mode test
 * @param {string} key - Clé Stripe (sk_test_ ou sk_live_)
 * @returns {boolean} true si mode test
 */
export function isTestMode(key = process.env.STRIPE_SECRET_KEY) {
  return key.startsWith('sk_test_');
}

/**
 * Logger le mode Stripe au démarrage
 */
export function logStripeMode() {
  const mode = isTestMode() ? '🧪 TEST' : '🚀 LIVE';
  console.log(`💳 Stripe initialisé en mode ${mode}`);
  
  if (!isTestMode() && process.env.NODE_ENV !== 'production') {
    console.warn('⚠️ ATTENTION : Clé Stripe LIVE en environnement non-production');
  }
}

// ============================================================================
// VÉRIFICATION CONFIGURATION
// ============================================================================
export function validateStripeConfig() {
  const missingPrices = [];
  
  if (!STRIPE_PRODUCTS.PACK_3.priceId) missingPrices.push('STRIPE_PRICE_PACK_3');
  if (!STRIPE_PRODUCTS.PACK_10.priceId) missingPrices.push('STRIPE_PRICE_PACK_10');
  if (!STRIPE_PRODUCTS.MONTHLY.priceId) missingPrices.push('STRIPE_PRICE_MONTHLY');
  if (!STRIPE_PRODUCTS.YEARLY.priceId) missingPrices.push('STRIPE_PRICE_YEARLY');
  
  if (missingPrices.length > 0) {
    console.error('❌ Prix Stripe manquants:', missingPrices.join(', '));
    return false;
  }
  
  console.log('✅ Configuration Stripe valide');
  return true;
}

// ============================================================================
// EXPORT DEFAULT
// ============================================================================
export default stripe;