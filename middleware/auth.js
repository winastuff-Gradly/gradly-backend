// ⭐⭐⭐ CRITIQUE : Middleware d'authentification avec gestion TOKEN_EXPIRED
// Vérifie le token JWT Supabase et retourne code: 'TOKEN_EXPIRED' si expiré

import { supabase } from '../config/database.js';
import logger from '../config/logger.js';

/**
 * Middleware d'authentification
 * Vérifie le token JWT dans le header Authorization
 * 
 * ⚠️ CRITIQUE : Si token expiré, retourner 401 avec code: 'TOKEN_EXPIRED'
 * Ce code exact est utilisé par le frontend pour auto-refresh
 */
export const authenticate = async (req, res, next) => {
  try {
    // Récupérer le token depuis le header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Token manquant',
        message: 'Veuillez vous connecter pour accéder à cette ressource',
      });
    }

    // Extraire le token
    const token = authHeader.split(' ')[1];

    if (!token) {
      return res.status(401).json({
        error: 'Token invalide',
        message: 'Format du token incorrect',
      });
    }

    // ⭐⭐⭐ CRITIQUE : Vérifier le token avec Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    // Si erreur ou user null → Token expiré ou invalide
    if (error || !user) {
      logger.warn(`Token invalide ou expiré: ${error?.message || 'User null'}`);
      
      // ⭐⭐⭐ CRITIQUE : Retourner code: 'TOKEN_EXPIRED' pour l'interceptor frontend
      return res.status(401).json({
        error: 'Token expiré',
        code: 'TOKEN_EXPIRED', // ⚠️ CODE EXACT attendu par le frontend
        message: 'Votre session a expiré. Reconnexion automatique en cours...',
      });
    }

    // Vérifier si le user est bloqué
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_blocked, email')
      .eq('id', user.id)
      .single();

    if (profileError) {
      logger.error('Erreur récupération profil:', profileError);
      return res.status(500).json({
        error: 'Erreur serveur',
        message: 'Impossible de vérifier le profil utilisateur',
      });
    }

    if (profile.is_blocked) {
      logger.warn(`Tentative d'accès par user bloqué: ${profile.email}`);
      return res.status(403).json({
        error: 'Compte bloqué',
        message: 'Votre compte a été bloqué. Contactez le support.',
      });
    }

    // ✅ Token valide et user actif
    // Attacher le user à la requête pour les routes suivantes
    req.user = {
      id: user.id,
      email: user.email,
      ...user.user_metadata,
    };

    // Logger l'accès (uniquement en développement)
    if (process.env.NODE_ENV === 'development') {
      logger.info(`User authentifié: ${user.email} - ${req.method} ${req.path}`);
    }

    next();
  } catch (err) {
    logger.error('Erreur middleware auth:', err);
    
    // En cas d'erreur inattendue, considérer le token comme expiré
    return res.status(401).json({
      error: 'Erreur authentification',
      code: 'TOKEN_EXPIRED',
      message: 'Erreur lors de la vérification du token',
    });
  }
};

/**
 * Middleware optionnel : n'échoue pas si pas de token
 * Utile pour les routes accessibles avec ou sans authentification
 */
export const optionalAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  // Si pas de token, continuer sans user
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  // Sinon, vérifier le token normalement
  await authenticate(req, res, next);
};

export default authenticate;