// middleware/errorHandler.js
// ⭐⭐ IMPORTANT : Gestionnaire d'erreurs centralisé
// Tous les messages d'erreur sont en français

import logger from '../config/logger.js';
import * as Sentry from '@sentry/node';
import AppError from '../utils/AppError.js';
import { errorMessages } from '../utils/errorMessages.js';

/**
 * Gestionnaire d'erreurs centralisé
 * Doit être placé EN DERNIER dans server.js (après Sentry.Handlers.errorHandler())
 * 
 * ⚠️ Tous les messages sont en FRANÇAIS
 */
const errorHandler = (err, req, res, next) => {
  // Logger l'erreur
  logger.error('Erreur capturée:', {
    message: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    user: req.user?.email || 'Non authentifié',
  });

  // Capturer dans Sentry si en production
  if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
    Sentry.captureException(err, {
      tags: {
        path: req.path,
        method: req.method,
      },
      user: req.user ? {
        id: req.user.id,
        email: req.user.email,
      } : undefined,
    });
  }

  // Si c'est une AppError (erreur connue)
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        code: err.code || 'APP_ERROR',
        statusCode: err.statusCode,
      },
    });
  }

  // Erreurs de validation Joi
  if (err.isJoi) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Erreur de validation',
        code: 'VALIDATION_ERROR',
        statusCode: 400,
        details: err.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
        })),
      },
    });
  }

  // Erreurs Supabase spécifiques
  if (err.code) {
    switch (err.code) {
      case '23505': // Violation unique constraint
        return res.status(409).json({
          success: false,
          error: {
            message: 'Cette ressource existe déjà',
            code: 'DUPLICATE_ENTRY',
            statusCode: 409,
          },
        });
      
      case '23503': // Violation foreign key
        return res.status(400).json({
          success: false,
          error: {
            message: 'Référence invalide dans la base de données',
            code: 'INVALID_REFERENCE',
            statusCode: 400,
          },
        });
      
      case '42501': // Insufficient privilege (RLS)
        return res.status(403).json({
          success: false,
          error: {
            message: errorMessages.general.forbidden,
            code: 'ACCESS_DENIED',
            statusCode: 403,
          },
        });
      
      default:
        logger.warn(`Erreur Supabase non gérée: ${err.code}`, err.message);
    }
  }

  // Erreurs Stripe
  if (err.type && err.type.startsWith('Stripe')) {
    logger.error('Erreur Stripe:', err);
    
    return res.status(402).json({
      success: false,
      error: {
        message: errorMessages.payments.stripeError,
        code: 'STRIPE_ERROR',
        statusCode: 402,
        details: process.env.NODE_ENV === 'development' ? err.message : undefined,
      },
    });
  }

  // Erreur de parsing JSON
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Format JSON invalide dans la requête',
        code: 'INVALID_JSON',
        statusCode: 400,
      },
    });
  }

  // Erreur de taille de fichier (multer/express)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({
      success: false,
      error: {
        message: errorMessages.storage.fileTooLarge,
        code: 'FILE_TOO_LARGE',
        statusCode: 413,
      },
    });
  }

  // Erreur réseau/timeout
  if (err.code === 'ECONNREFUSED' || err.code === 'ETIMEDOUT') {
    return res.status(503).json({
      success: false,
      error: {
        message: 'Service temporairement indisponible',
        code: 'SERVICE_UNAVAILABLE',
        statusCode: 503,
      },
    });
  }

  // Erreur 404 personnalisée
  if (err.statusCode === 404 || err.status === 404) {
    return res.status(404).json({
      success: false,
      error: {
        message: err.message || errorMessages.general.notFound,
        code: 'NOT_FOUND',
        statusCode: 404,
      },
    });
  }

  // Erreur inconnue (ne pas exposer les détails en production)
  const statusCode = err.statusCode || err.status || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? errorMessages.general.serverError
    : err.message || errorMessages.general.serverError;

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      code: 'INTERNAL_ERROR',
      statusCode,
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
        details: err.toString(),
      }),
    },
  });
};

/**
 * Gestionnaire 404 (à utiliser avant errorHandler)
 */
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: `La route ${req.method} ${req.path} n'existe pas`,
      code: 'ROUTE_NOT_FOUND',
      statusCode: 404,
      path: req.path,
    },
  });
};

export default errorHandler;