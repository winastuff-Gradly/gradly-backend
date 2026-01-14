// ⭐⭐⭐ CRITIQUE : Routes admin protégées par adminAuth

import express from 'express';
import { supabase } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { adminAuth } from '../middleware/adminAuth.js';
import { catchAsync } from '../middleware/catchAsync.js';
import { getGlobalStats, getConversionMetrics } from '../services/analyticsService.js';

const router = express.Router();

// ⚠️ Toutes les routes protégées par adminAuth
router.use(authenticate);
router.use(adminAuth);

// GET /stats - Stats globales
router.get('/stats',
  catchAsync(async (req, res) => {
    const stats = await getGlobalStats();
    const conversion = await getConversionMetrics();

    res.json({ ...stats, ...conversion });
  })
);

// GET /reports - Liste reports
router.get('/reports',
  catchAsync(async (req, res) => {
    const { status, limit = 20 } = req.query;

    let query = supabase
      .from('reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json({ reports: data });
  })
);

// POST /reports/:id/action - Actions report
router.post('/reports/:id/action',
  catchAsync(async (req, res) => {
    const { id } = req.params;
    const { action, reason } = req.body;

    // Logger l'action admin
    await supabase
      .from('admin_actions')
      .insert({
        admin_id: req.user.id,
        admin_email: req.user.email,
        action_type: action,
        target_report_id: id,
        details: { reason },
      });

    // Exécuter l'action (block, delete, dismiss)
    // TODO: Implémenter selon l'action

    res.json({ message: 'Action effectuée' });
  })
);

// GET /users - Liste users
router.get('/users',
  catchAsync(async (req, res) => {
    const { search, limit = 50 } = req.query;

    let query = supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (search) {
      query = query.or(`email.ilike.%${search}%,first_name.ilike.%${search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;

    res.json({ users: data });
  })
);

export default router;