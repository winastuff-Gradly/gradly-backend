// middleware/adminAuth.js
// ⭐⭐ CRITIQUE : Middleware de protection des routes admin
// Vérifie que l'email du user est dans la whitelist ADMIN_EMAILS

import logger from '../config/logger.js';
import { errorMessages } from '../utils/errorMessages.js';

/**
 * Middleware d'authentification admin
 * Vérifie que le user est authentifié ET que son email est dans ADMIN_EMAILS
 * 
 * ⚠️ CRITIQUE : Doit être utilisé APRÈS le middleware authenticate
 * ⚠️ ADMIN_EMAILS doit être une liste d'emails séparés par des virgules
 * 
 * Exemple .env:
 * ADMIN_EMAILS=admin@gradly.me,christophe@gradly.me
 */
export const adminAuth = (req, res, next) => {
  try {
    // 1. Vérifier que le user est authentifié
    if (!req.user || !req.user.email) {
      logger.warn('Tentative d\'accès admin sans authentification');
      return res.status(401).json({
        success: false,
        error: {
          message: errorMessages.auth.unauthorized,
          code: 'UNAUTHORIZED',
          statusCode: 401,
        },
      });
    }

    // 2. Récupérer la liste des emails admin depuis .env
    const adminEmailsEnv = process.env.ADMIN_EMAILS;

    if (!adminEmailsEnv) {
      logger.error('ADMIN_EMAILS non configuré dans .env');
      return res.status(500).json({
        success: false,
        error: {
          message: 'La liste des administrateurs n\'est pas configurée',
          code: 'ADMIN_CONFIG_MISSING',
          statusCode: 500,
        },
      });
    }

    // 3. Parser la liste d'emails (séparés par des virgules)
    const adminEmails = adminEmailsEnv
      .split(',')
      .map(email => email.trim().toLowerCase())
      .filter(email => email.length > 0);

    if (adminEmails.length === 0) {
      logger.error('ADMIN_EMAILS vide ou invalide');
      return res.status(500).json({
        success: false,
        error: {
          message: 'Aucun administrateur configuré',
          code: 'ADMIN_CONFIG_EMPTY',
          statusCode: 500,
        },
      });
    }

    // 4. Vérifier si l'email du user est dans la whitelist
    const userEmail = req.user.email.trim().toLowerCase();
    const isAdmin = adminEmails.includes(userEmail);

    if (!isAdmin) {
      logger.warn(`Tentative d'accès admin refusée: ${req.user.email} - ${req.path}`);
      return res.status(403).json({
        success: false,
        error: {
          message: errorMessages.admin.accessDenied,
          code: 'ACCESS_DENIED',
          statusCode: 403,
        },
      });
    }

    // ✅ User est admin
    // Ajouter un flag admin pour les routes suivantes
    req.user.isAdmin = true;

    logger.info(`Accès admin autorisé: ${req.user.email} - ${req.method} ${req.path}`);
    next();
  } catch (err) {
    logger.error('Erreur middleware adminAuth:', err);
    return res.status(500).json({
      success: false,
      error: {
        message: errorMessages.general.serverError,
        code: 'INTERNAL_ERROR',
        statusCode: 500,
      },
    });
  }
};

/**
 * Fonction helper pour vérifier si un email est admin
 * Utile en dehors des routes pour vérifier programmatiquement
 * 
 * @param {string} email - Email à vérifier
 * @returns {boolean} - True si admin, false sinon
 */
export const isAdminEmail = (email) => {
  if (!email || typeof email !== 'string') return false;

  const adminEmailsEnv = process.env.ADMIN_EMAILS;
  if (!adminEmailsEnv) return false;

  const adminEmails = adminEmailsEnv
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(e => e.length > 0);

  return adminEmails.includes(email.trim().toLowerCase());
};

/**
 * Fonction pour obtenir la liste des emails admin
 * @returns {string[]} - Liste des emails admin
 */
export const getAdminEmails = () => {
  const adminEmailsEnv = process.env.ADMIN_EMAILS;
  if (!adminEmailsEnv) return [];

  return adminEmailsEnv
    .split(',')
    .map(email => email.trim())
    .filter(email => email.length > 0);
};

export default adminAuth;