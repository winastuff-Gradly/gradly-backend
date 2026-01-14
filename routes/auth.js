// ⭐⭐⭐ CRITIQUE : Routes authentification avec géocodage automatique

import express from 'express';
import { supabase } from '../config/database.js';
import { authenticate } from '../middleware/auth.js';
import { rateLimitStrict } from '../middleware/rateLimit.js';
import { catchAsync } from '../middleware/catchAsync.js';
import { validateRequest, commonSchemas } from '../middleware/validateRequest.js';
import { geocode } from '../services/geocodeService.js';
import Joi from 'joi';
import logger from '../config/logger.js';

const router = express.Router();

// ⭐⭐⭐ POST /register - Inscription avec géocodage automatique
router.post('/register', 
  rateLimitStrict,
  validateRequest({
    body: Joi.object({
      email: commonSchemas.email,
      password: commonSchemas.password,
      first_name: Joi.string().min(2).max(50).required(),
      birthdate: commonSchemas.birthdate,
      city: Joi.string().min(2).max(100).required(),
      postal_code: commonSchemas.postalCode,
      sex: Joi.string().valid('man', 'woman').required(),
      looking_for: Joi.string().valid('man', 'woman').required(),
      // 4 questions initiales
      q1_smoke: Joi.boolean().required(),
      q2_serious: Joi.boolean().required(),
      q3_morning: Joi.boolean().required(),
      q4_city: Joi.string().required(),
    }),
  }),
  catchAsync(async (req, res) => {
    const {
      email,
      password,
      first_name,
      birthdate,
      city,
      postal_code,
      sex,
      looking_for,
      q1_smoke,
      q2_serious,
      q3_morning,
      q4_city,
    } = req.body;

    // 1. Créer l'utilisateur dans Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          first_name,
          birthdate,
          city,
          postal_code,
          sex,
          looking_for,
          q1_smoke,
          q2_serious,
          q3_morning,
          q4_city,
        },
      },
    });

    if (authError) {
      logger.error('Erreur inscription:', authError);
      return res.status(400).json({
        error: 'Erreur lors de l\'inscription',
        message: authError.message,
      });
    }

    const userId = authData.user.id;

    // 2. ⭐⭐⭐ CRITIQUE : Géocodage automatique après inscription
    try {
      const geoResult = await geocode(city, postal_code);
      
      if (geoResult) {
        // Mettre à jour le profil avec les coordonnées
        await supabase
          .from('profiles')
          .update({
            lat: geoResult.lat,
            lon: geoResult.lon,
          })
          .eq('id', userId);

        logger.info(`✅ Géolocalisation réussie pour ${email}: (${geoResult.lat}, ${geoResult.lon})`);
      } else {
        logger.warn(`⚠️ Géolocalisation échouée pour ${email} (${city}, ${postal_code}) - pas bloquant`);
      }
    } catch (geoError) {
      logger.error('Erreur géocodage:', geoError);
      // Ne pas bloquer l'inscription si le géocodage échoue
    }

    logger.info(`✅ Nouvel utilisateur inscrit: ${email}`);

    res.status(201).json({
      message: 'Inscription réussie ! Bienvenue sur Gradly 💘',
      user: {
        id: authData.user.id,
        email: authData.user.email,
      },
      session: authData.session,
    });
  })
);

// ⭐⭐ POST /login - Connexion
router.post('/login',
  rateLimitStrict,
  validateRequest({
    body: Joi.object({
      email: commonSchemas.email,
      password: Joi.string().required(),
    }),
  }),
  catchAsync(async (req, res) => {
    const { email, password } = req.body;

    // Connexion Supabase
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      logger.warn(`Échec connexion: ${email}`);
      return res.status(401).json({
        error: 'Identifiants incorrects',
        message: 'Email ou mot de passe incorrect',
      });
    }

    const userId = authData.user.id;

    // Vérifier si le compte est bloqué
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_blocked, photo_path')
      .eq('id', userId)
      .single();

    if (profile?.is_blocked) {
      logger.warn(`Tentative connexion compte bloqué: ${email}`);
      return res.status(403).json({
        error: 'Compte bloqué',
        message: 'Votre compte a été bloqué. Contactez le support.',
      });
    }

    // Mettre à jour last_seen
    await supabase
      .from('profiles')
      .update({ last_seen: new Date().toISOString() })
      .eq('id', userId);

    logger.info(`✅ Connexion réussie: ${email}`);

    res.json({
      message: 'Connexion réussie',
      user: authData.user,
      session: authData.session,
      hasPhoto: !!profile?.photo_path, // Indiquer au frontend si photo manquante
    });
  })
);

// GET /me - Profil utilisateur connecté
router.get('/me',
  authenticate,
  catchAsync(async (req, res) => {
    const userId = req.user.id;

    const { data: profile, error } = await supabase
      .from('profiles_with_subscription')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      return res.status(404).json({
        error: 'Profil non trouvé',
      });
    }

    res.json(profile);
  })
);

// POST /logout - Déconnexion
router.post('/logout',
  authenticate,
  catchAsync(async (req, res) => {
    await supabase.auth.signOut();
    
    res.json({
      message: 'Déconnexion réussie',
    });
  })
);

export default router;