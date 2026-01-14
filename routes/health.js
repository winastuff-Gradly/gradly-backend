// ⭐⭐⭐ CRITIQUE : Health check avec cache Stripe (pas bloquant)

import express from 'express';
import { supabase } from '../config/database.js';
import { catchAsync } from '../middleware/catchAsync.js';
import Stripe from 'stripe';

const router = express.Router();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Cache Stripe status (15 min)
let stripeStatus = { reachable: true, lastCheck: Date.now() };
const STRIPE_CHECK_INTERVAL = 15 * 60 * 1000;

// Tâche périodique pour vérifier Stripe
const checkStripeHealth = async () => {
  try {
    await stripe.customers.list({ limit: 1 });
    stripeStatus = { reachable: true, lastCheck: Date.now() };
  } catch (err) {
    stripeStatus = { reachable: false, lastCheck: Date.now() };
  }
};

setInterval(checkStripeHealth, STRIPE_CHECK_INTERVAL);
checkStripeHealth(); // Check initial

// GET /health - Health check rapide
router.get('/',
  catchAsync(async (req, res) => {
    // Test DB (rapide)
    let dbStatus = 'connected';
    try {
      await supabase.from('profiles').select('id').limit(1);
    } catch {
      dbStatus = 'error';
    }

    // Stripe : utiliser cache (pas d'appel bloquant)
    const stripeReachable = stripeStatus.reachable;
    const sentryActive = !!process.env.SENTRY_DSN;

    const status = dbStatus === 'connected' ? 'ok' : 'error';

    res.status(status === 'ok' ? 200 : 500).json({
      status,
      version: '2.5.0',
      database: dbStatus,
      stripe: stripeReachable ? 'reachable' : 'unreachable',
      sentry: sentryActive ? 'active' : 'inactive',
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;