// ============================================================================
// GRADLY V2.5 - CUSTOM ERROR CLASS
// ============================================================================
// Classe d'erreur personnalisée pour gestion centralisée
// ============================================================================

class AppError extends Error {
  /**
   * Créer une erreur personnalisée
   * @param {string} message - Message d'erreur (français)
   * @param {number} statusCode - Code HTTP (400, 401, 403, 404, 500, etc.)
   * @param {string} code - Code d'erreur custom (optionnel)
   * @param {Object} details - Détails additionnels (optionnel)
   */
  constructor(message, statusCode, code = null, details = {}) {
    super(message);

    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    
    // Déterminer si l'erreur est opérationnelle (erreur attendue) ou de programmation
    this.isOperational = true;

    // Déterminer le statut (success: false pour toutes les erreurs)
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    // Capturer stack trace
    Error.captureStackTrace(this, this.constructor);
  }

  /**
   * Convertir l'erreur en objet JSON
   * @returns {Object}
   */
  toJSON() {
    return {
      status: this.status,
      message: this.message,
      code: this.code,
      statusCode: this.statusCode,
      ...(Object.keys(this.details).length > 0 && { details: this.details }),
      ...(process.env.NODE_ENV === 'development' && { stack: this.stack })
    };
  }
}

// ============================================================================
// ERREURS COMMUNES PRÉDÉFINIES
// ============================================================================

export class BadRequestError extends AppError {
  constructor(message = 'Requête invalide', details = {}) {
    super(message, 400, 'BAD_REQUEST', details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = 'Non authentifié', code = 'UNAUTHORIZED') {
    super(message, 401, code);
  }
}

export class TokenExpiredError extends AppError {
  constructor(message = 'Session expirée') {
    super(message, 401, 'TOKEN_EXPIRED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'Accès refusé') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'Ressource non trouvée') {
    super(message, 404, 'NOT_FOUND');
  }
}

export class ConflictError extends AppError {
  constructor(message = 'Conflit détecté', details = {}) {
    super(message, 409, 'CONFLICT', details);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Données invalides', details = {}) {
    super(message, 422, 'VALIDATION_ERROR', details);
  }
}

export class TooManyRequestsError extends AppError {
  constructor(message = 'Trop de requêtes, réessayez plus tard') {
    super(message, 429, 'RATE_LIMIT_EXCEEDED');
  }
}

export class InternalServerError extends AppError {
  constructor(message = 'Erreur serveur interne') {
    super(message, 500, 'INTERNAL_SERVER_ERROR');
  }
}

export class ServiceUnavailableError extends AppError {
  constructor(message = 'Service temporairement indisponible') {
    super(message, 503, 'SERVICE_UNAVAILABLE');
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Créer une erreur personnalisée
 * @param {string} message - Message d'erreur
 * @param {number} statusCode - Code HTTP
 * @param {string} code - Code d'erreur
 * @returns {AppError}
 */
export function createError(message, statusCode, code) {
  return new AppError(message, statusCode, code);
}

/**
 * Vérifier si une erreur est opérationnelle
 * @param {Error} error - Erreur à vérifier
 * @returns {boolean}
 */
export function isOperationalError(error) {
  if (error instanceof AppError) {
    return error.isOperational;
  }
  return false;
}

// ============================================================================
// EXPORT DEFAULT
// ============================================================================
export default AppError;