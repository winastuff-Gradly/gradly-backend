// Routes abonnements

import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { catchAsync } from '../middleware/catchAsync.js';
import { createSubscriptionSession } from '../services/stripeService.js';
import { getActiveSubscription } from '../services/subscriptionService.js';

const router = express.Router();

// POST /create - Créer abonnement
router.post('/create',
  authenticate,
  catchAsync(async (req, res) => {
    const { price_id } = req.body; // monthly ou yearly
    
    const session = await createSubscriptionSession(
      req.user.id,
      price_id,
      req.user.email
    );

    res.json({ url: session.url });
  })
);

// GET /current - Abonnement actif
router.get('/current',
  authenticate,
  catchAsync(async (req, res) => {
    const subscription = await getActiveSubscription(req.user.id);
    
    res.json({ subscription });
  })
);

export default router;