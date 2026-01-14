// ⭐⭐⭐ CRITIQUE : Routes internes protégées par X-Cron-Secret

import express from 'express';
import { supabase } from '../config/database.js';
import { catchAsync } from '../middleware/catchAsync.js';
import logger from '../config/logger.js';

const router = express.Router();

// Middleware protection cron
const protectCronEndpoint = (req, res, next) => {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers['x-cron-secret'];

  if (!cronSecret) {
    return res.status(500).json({
      error: 'CRON_SECRET not configured',
    });
  }

  if (authHeader !== cronSecret) {
    logger.error(`❌ Unauthorized cron attempt: ${req.ip}`);
    return res.status(403).json({
      error: 'Forbidden',
    });
  }

  next();
};

// ⭐⭐⭐ POST /reconcile - Libérer users bloqués
router.post('/reconcile',
  protectCronEndpoint,
  catchAsync(async (req, res) => {
    const { data, error } = await supabase.rpc('reconcile_conversation_states');

    if (error) {
      logger.error('Erreur reconcile:', error);
      throw error;
    }

    const count = data || 0;
    logger.info(`🔄 Cron reconcile: ${count} users libérés`);

    res.json({
      success: true,
      users_freed: count,
      timestamp: new Date().toISOString(),
    });
  })
);

export default router;