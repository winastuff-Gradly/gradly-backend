// Routes crédits

import express from 'express';
import { supabase } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { catchAsync } from '../middleware/catchAsync.js';

const router = express.Router();

// GET / - Crédits actuels
router.get('/',
  authenticate,
  catchAsync(async (req, res) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('credits')
      .eq('id', req.user.id)
      .single();

    if (error) throw error;

    res.json({ credits: data.credits });
  })
);

// GET /history - Historique transactions
router.get('/history',
  authenticate,
  catchAsync(async (req, res) => {
    const { data, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    res.json({ transactions: data });
  })
);

export default router;