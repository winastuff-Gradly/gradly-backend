// ⭐⭐⭐ CRITIQUE : Routes matching avec 3 niveaux (géo → ville → global)

import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { rateLimitMatching } from '../middleware/rateLimit.js';
import { catchAsync } from '../middleware/catchAsync.js';
import { findMatch } from '../services/matchingService.js';
import { supabase } from '../config/database.js';
import logger from '../config/logger.js';

const router = express.Router();

// ⭐⭐⭐ POST /find - Trouver un match (3 niveaux)
router.post('/find',
  authenticate,
  rateLimitMatching,
  catchAsync(async (req, res) => {
    const userId = req.user.id;

    // Vérifier que le user n'est pas déjà en conversation
    const { data: profile } = await supabase
      .from('profiles')
      .select('in_conversation')
      .eq('id', userId)
      .single();

    if (profile?.in_conversation) {
      return res.status(400).json({
        error: 'Déjà en conversation',
        message: 'Vous êtes déjà dans une conversation active',
      });
    }

    // Marquer in_conversation=true immédiatement pour éviter double match
    await supabase
      .from('profiles')
      .update({ in_conversation: true })
      .eq('id', userId);

    try {
      // ⭐⭐⭐ Trouver un match avec l'algorithme 3 niveaux
      const match = await findMatch(userId);

      if (!match) {
        // Aucun match trouvé, libérer le user
        await supabase
          .from('profiles')
          .update({ in_conversation: false })
          .eq('id', userId);

        logger.info(`❌ Aucun match trouvé pour user ${userId}`);

        return res.status(404).json({
          error: 'Aucun match trouvé',
          message: 'Aucune personne compatible n\'est disponible pour le moment. Réessaie bientôt !',
        });
      }

      // Marquer l'autre user comme in_conversation
      await supabase
        .from('profiles')
        .update({ in_conversation: true })
        .eq('id', match.candidate.id);

      logger.info(`✅ Match trouvé: ${userId} ↔ ${match.candidate.id} (niveau: ${match.level})`);

      res.json({
        message: 'Match trouvé ! 💘',
        match: {
          id: match.match.id,
          compatibility_score: match.candidate.compatibility_score,
          distance: match.candidate.distance,
          level: match.level,
          candidate: {
            id: match.candidate.id,
            first_name: match.candidate.first_name,
            photo_path: match.candidate.photo_path,
            bio: match.candidate.bio,
          },
        },
      });
    } catch (err) {
      // En cas d'erreur, libérer le user
      await supabase
        .from('profiles')
        .update({ in_conversation: false })
        .eq('id', userId);

      logger.error('Erreur matching:', err);
      throw err;
    }
  })
);

// GET /current - Match actif
router.get('/current',
  authenticate,
  catchAsync(async (req, res) => {
    const userId = req.user.id;

    const { data, error } = await supabase
      .from('matches')
      .select('*')
      .or(`user1_id.eq.${userId},user2_id.eq.${userId}`)
      .eq('is_active', true)
      .single();

    if (error || !data) {
      return res.json({ match: null });
    }

    res.json({ match: data });
  })
);

export default router;