// ============================================================================
// GRADLY V2.5 - WINSTON LOGGER CONFIGURATION
// ============================================================================
// 3 transports : error.log, stripe.log, matching.log
// ============================================================================

import winston from 'winston';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

// Obtenir __dirname en ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// ============================================================================
// CRÉER DOSSIER LOGS SI N'EXISTE PAS
// ============================================================================
const logsDir = join(__dirname, '..', 'logs');
if (!existsSync(logsDir)) {
  mkdirSync(logsDir, { recursive: true });
  console.log('📁 Dossier logs/ créé');
}

// ============================================================================
// FORMAT WINSTON
// ============================================================================
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.printf(({ timestamp, level, message, stack }) => {
    if (stack) {
      return `${timestamp} [${level.toUpperCase()}]: ${message}\n${stack}`;
    }
    return `${timestamp} [${level.toUpperCase()}]: ${message}`;
  })
);

// ============================================================================
// LOGGER PRINCIPAL
// ============================================================================
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: logFormat,
  transports: [
    // Transport 1 : ERREURS uniquement (logs/error.log)
    new winston.transports.File({
      filename: join(logsDir, 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    // Transport 2 : TOUS les logs (logs/combined.log)
    new winston.transports.File({
      filename: join(logsDir, 'combined.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),

    // Transport 3 : CONSOLE (développement uniquement)
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
      silent: process.env.NODE_ENV === 'production'
    })
  ],
  exceptionHandlers: [
    new winston.transports.File({
      filename: join(logsDir, 'exceptions.log')
    })
  ],
  rejectionHandlers: [
    new winston.transports.File({
      filename: join(logsDir, 'rejections.log')
    })
  ]
});

// ============================================================================
// LOGGER SPÉCIALISÉ : STRIPE WEBHOOKS
// ============================================================================
export const stripeLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    new winston.transports.File({
      filename: join(logsDir, 'stripe.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    })
  ]
});

// ============================================================================
// LOGGER SPÉCIALISÉ : MATCHING
// ============================================================================
// IMPORTANT : Logger CHAQUE match avec score + distance + niveau
export const matchingLogger = winston.createLogger({
  level: 'info',
  format: logFormat,
  transports: [
    new winston.transports.File({
      filename: join(logsDir, 'matching.log'),
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    })
  ]
});

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Logger une erreur critique avec contexte
 * @param {string} message - Message d'erreur
 * @param {Error} error - Objet Error
 * @param {Object} context - Contexte additionnel
 */
export function logError(message, error, context = {}) {
  logger.error(message, {
    error: error.message,
    stack: error.stack,
    ...context
  });
}

/**
 * Logger un webhook Stripe
 * @param {string} eventType - Type d'événement Stripe
 * @param {string} eventId - ID de l'événement
 * @param {Object} details - Détails additionnels
 */
export function logStripeWebhook(eventType, eventId, details = {}) {
  stripeLogger.info(`Webhook ${eventType}`, {
    event_id: eventId,
    ...details
  });
}

/**
 * Logger un match créé
 * @param {string} user1Id - ID user 1
 * @param {string} user2Id - ID user 2
 * @param {number} score - Score de compatibilité
 * @param {number|null} distance - Distance en km (nullable)
 * @param {string} level - Niveau de matching (geo/city/global)
 */
export function logMatch(user1Id, user2Id, score, distance, level) {
  matchingLogger.info(
    `Match created: user1=${user1Id} user2=${user2Id} score=${score} ${
      distance !== null ? `distance=${distance.toFixed(2)}km` : 'distance=N/A'
    } level=${level}`
  );
}

/**
 * Logger une info importante
 * @param {string} message - Message
 * @param {Object} data - Données additionnelles
 */
export function logInfo(message, data = {}) {
  logger.info(message, data);
}

/**
 * Logger un warning
 * @param {string} message - Message
 * @param {Object} data - Données additionnelles
 */
export function logWarning(message, data = {}) {
  logger.warn(message, data);
}

// ============================================================================
// EXPORT DEFAULT
// ============================================================================
export default logger;