// ⭐ IMPORTANT : Mode maintenance global
// Bloque toutes les requêtes sauf /health si MAINTENANCE=true

import logger from '../config/logger.js';

/**
 * Middleware de mode maintenance
 * Si MAINTENANCE=true dans .env, retourne 503 pour toutes les routes sauf /health
 * 
 * ⚠️ Doit être placé AVANT toutes les autres routes dans server.js
 */
export const maintenanceMode = (req, res, next) => {
  // Vérifier si le mode maintenance est activé
  const isMaintenanceMode = process.env.MAINTENANCE === 'true';

  if (!isMaintenanceMode) {
    return next();
  }

  // Routes autorisées même en mode maintenance
  const allowedRoutes = [
    '/api/health',
    '/health',
    '/', // Route racine pour info
  ];

  // Vérifier si la route actuelle est autorisée
  if (allowedRoutes.includes(req.path)) {
    return next();
  }

  // Logger la tentative d'accès pendant la maintenance
  logger.info(`Tentative d'accès en mode maintenance: ${req.method} ${req.path} - IP: ${req.ip}`);

  // Retourner 503 Service Unavailable
  return res.status(503).json({
    error: 'Service en maintenance',
    message: '🚧 Gradly est temporairement en maintenance. Nous reviendrons très bientôt ! 💚',
    status: 'maintenance',
    estimatedReturn: process.env.MAINTENANCE_END || 'Quelques minutes',
    contact: 'contact@gradly.me',
  });
};

/**
 * Fonction pour activer le mode maintenance programmatiquement
 * Utile pour les scripts de déploiement ou les tâches automatisées
 * 
 * ⚠️ Nécessite de redémarrer le serveur pour prendre effet
 */
export const enableMaintenance = () => {
  process.env.MAINTENANCE = 'true';
  logger.warn('⚠️ Mode maintenance ACTIVÉ');
};

/**
 * Fonction pour désactiver le mode maintenance programmatiquement
 * 
 * ⚠️ Nécessite de redémarrer le serveur pour prendre effet
 */
export const disableMaintenance = () => {
  process.env.MAINTENANCE = 'false';
  logger.info('✅ Mode maintenance DÉSACTIVÉ');
};

/**
 * Vérifier si le mode maintenance est activé
 * @returns {boolean}
 */
export const isMaintenanceActive = () => {
  return process.env.MAINTENANCE === 'true';
};

export default maintenanceMode;