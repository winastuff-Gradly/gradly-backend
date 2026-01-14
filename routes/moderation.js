// Routes modération

import express from 'express';
import { supabase } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { catchAsync } from '../middleware/catchAsync.js';

const router = express.Router();

// POST /block - Bloquer user
router.post('/block',
  authenticate,
  catchAsync(async (req, res) => {
    const { blocked_id, reason } = req.body;

    await supabase
      .from('blocks')
      .insert({
        blocker_id: req.user.id,
        blocked_id,
        reason,
      });

    res.json({ message: 'Utilisateur bloqué' });
  })
);

// POST /report - Signaler user
router.post('/report',
  authenticate,
  catchAsync(async (req, res) => {
    const { reported_id, conversation_id, reason, details } = req.body;

    await supabase
      .from('reports')
      .insert({
        reporter_id: req.user.id,
        reported_id,
        conversation_id,
        reason,
        details,
        status: 'pending',
      });

    res.json({ message: 'Signalement enregistré' });
  })
);

export default router;