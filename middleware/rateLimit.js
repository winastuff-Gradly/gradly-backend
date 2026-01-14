// middleware/rateLimit.js
// ⭐⭐ IMPORTANT : Rate Limiting à 3 niveaux
// - Strict : 5 req/15min (login, register)
// - Chat : 30 req/min (send message)
// - Global : 100 req/15min (toutes routes)

import rateLimit from 'express-rate-limit';
import logger from '../config/logger.js';
import { errorMessages } from '../utils/errorMessages.js';

/**
 * Handler personnalisé pour les dépassements de limite
 */
const rateLimitHandler = (req, res) => {
  logger.warn(`Rate limit dépassé: ${req.ip} - ${req.path}`);
  
  res.status(429).json({
    success: false,
    error: {
      message: errorMessages.general.rateLimitExceeded,
      code: 'RATE_LIMIT_EXCEEDED',
      statusCode: 429,
      retryAfter: req.rateLimit?.resetTime
        ? Math.ceil((req.rateLimit.resetTime - Date.now()) / 1000)
        : 900, // 15 minutes par défaut
    },
  });
};

/**
 * Fonction pour obtenir la clé de rate limiting
 * Utilise l'IP + l'email si authentifié pour plus de précision
 */
const keyGenerator = (req) => {
  return req.user?.email 
    ? `${req.ip}-${req.user.email}` 
    : req.ip;
};

/**
 * ⭐⭐⭐ NIVEAU 1 : STRICT (5 req/15min)
 * Utilisé pour les routes sensibles : login, register
 */
export const rateLimitStrict = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requêtes maximum
  message: {
    success: false,
    error: {
      message: 'Trop de tentatives de connexion. Réessayez dans 15 minutes.',
      code: 'RATE_LIMIT_EXCEEDED',
      statusCode: 429,
    },
  },
  standardHeaders: true, // Retourner infos dans headers RateLimit-*
  legacyHeaders: false, // Désactiver headers X-RateLimit-*
  handler: rateLimitHandler,
  keyGenerator,
  skipSuccessfulRequests: false, // Compter même les requêtes réussies
  skipFailedRequests: false, // Compter même les requêtes échouées
});

/**
 * ⭐⭐ NIVEAU 2 : CHAT (30 req/min)
 * Utilisé pour l'envoi de messages dans le chat
 */
export const rateLimitChat = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30, // 30 requêtes maximum (1 message toutes les 2 secondes)
  message: {
    success: false,
    error: {
      message: 'Vous envoyez trop de messages. Ralentissez un peu ! 😊',
      code: 'RATE_LIMIT_EXCEEDED',
      statusCode: 429,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator,
  skipSuccessfulRequests: false,
});

/**
 * ⭐ NIVEAU 3 : GLOBAL (100 req/15min)
 * Appliqué à toutes les routes de l'API
 */
export const rateLimitGlobal = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requêtes maximum
  message: {
    success: false,
    error: {
      message: errorMessages.general.rateLimitExceeded,
      code: 'RATE_LIMIT_EXCEEDED',
      statusCode: 429,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator,
  skipSuccessfulRequests: true, // Ne pas compter les requêtes réussies dans le global
});

/**
 * Rate limiter spécifique pour le matchmaking
 * Plus permissif car l'opération est lourde mais rare
 */
export const rateLimitMatching = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 10, // 10 tentatives de matching max par 5 minutes
  message: {
    success: false,
    error: {
      message: 'Trop de recherches de match. Attendez quelques minutes avant de recommencer.',
      code: 'RATE_LIMIT_EXCEEDED',
      statusCode: 429,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator,
  skipSuccessfulRequests: false,
});

/**
 * Rate limiter pour les webhooks
 * Très permissif mais présent pour éviter les attaques
 */
export const rateLimitWebhook = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 webhooks par minute (très généreux)
  message: {
    error: 'Too many webhook requests',
    message: 'Webhook rate limit exceeded',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.error(`Webhook rate limit dépassé: ${req.ip}`);
    res.status(429).json({
      error: 'Too many requests',
      message: 'Webhook rate limit exceeded',
    });
  },
  keyGenerator: (req) => req.ip, // Seulement IP pour les webhooks
});

/**
 * Rate limiter pour les uploads de photos
 * Protection contre les abus d'upload
 */
export const rateLimitUpload = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 5, // 5 uploads maximum par 10 minutes
  message: {
    success: false,
    error: {
      message: 'Trop d\'uploads de photos. Réessayez dans quelques minutes.',
      code: 'RATE_LIMIT_EXCEEDED',
      statusCode: 429,
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator,
  skipSuccessfulRequests: false,
});

// Export nommés uniquement (pas de default)
export const globalLimiter = rateLimitGlobal;