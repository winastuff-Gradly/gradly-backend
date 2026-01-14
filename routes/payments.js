// routes/payments.js
// ⭐⭐⭐ CRITIQUE : Routes paiements avec webhook raw body

import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { catchAsync } from '../middleware/catchAsync.js';
import { createCheckoutSession, handleWebhook } from '../services/stripeService.js';
import { supabase } from '../config/supabase.js';
import logger from '../config/logger.js';

const router = express.Router();

// POST /create-checkout - Créer session paiement
router.post('/create-checkout',
  authenticate,
  catchAsync(async (req, res) => {
    const userId = req.user.id;
    const { price_id } = req.body; // pack3 ou pack10

    const session = await createCheckoutSession(
      userId,
      price_id,
      req.user.email
    );

    res.json({
      url: session.url,
      session_id: session.id,
    });
  })
);

// ⭐⭐⭐ POST /webhook - Webhook Stripe (RAW BODY)
// ⚠️ CRITIQUE : Cette route est déjà configurée avec raw body dans server.js
const webhookHandler = catchAsync(async (req, res) => {
  const signature = req.headers['stripe-signature'];

  try {
    // Le body est déjà en raw grâce à la config dans server.js
    const result = await handleWebhook(req.body, signature);

    logger.info(`✅ Webhook traité: ${result.processed ? 'success' : 'duplicate'}`);

    res.json({ received: true });
  } catch (err) {
    logger.error('❌ Erreur webhook:', err);
    res.status(400).json({
      error: 'Webhook error',
      message: err.message,
    });
  }
});

router.post('/webhook', webhookHandler);

// GET /history - Historique paiements
router.get('/history',
  authenticate,
  catchAsync(async (req, res) => {
    const { data, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('type', 'purchase')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ purchases: data });
  })
);

// Export par défaut du router
export default router;

// Export nommé du webhookHandler
export { webhookHandler };