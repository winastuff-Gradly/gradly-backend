// ⭐ IMPORTANT : Protection XSS avec nettoyage automatique
// Nettoie tous les inputs utilisateur pour éviter les attaques XSS

import xss from 'xss-clean';
import hpp from 'hpp';
import logger from '../config/logger.js';

/**
 * Middleware de sanitization XSS
 * Nettoie automatiquement req.body, req.query et req.params
 */
export const sanitizeMiddleware = [
  // Protection XSS : nettoie les balises HTML malicieuses
  xss(),
  
  // Protection HPP (HTTP Parameter Pollution)
  // Empêche les attaques par duplication de paramètres
  hpp({
    // Liste blanche des paramètres pouvant être dupliqués (si nécessaire)
    whitelist: [],
  }),
];

/**
 * Sanitize manuelle d'une chaîne
 * Utile pour les cas spécifiques où on veut nettoyer manuellement
 * 
 * @param {string} str - Chaîne à nettoyer
 * @returns {string} - Chaîne nettoyée
 */
export const sanitizeString = (str) => {
  if (typeof str !== 'string') return str;
  
  // Supprimer les balises HTML
  let cleaned = str.replace(/<[^>]*>/g, '');
  
  // Supprimer les caractères de contrôle
  cleaned = cleaned.replace(/[\x00-\x1F\x7F]/g, '');
  
  // Encoder les caractères spéciaux
  cleaned = cleaned
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  
  return cleaned.trim();
};

/**
 * Sanitize un objet récursivement
 * Nettoie toutes les valeurs string d'un objet
 * 
 * @param {Object} obj - Objet à nettoyer
 * @returns {Object} - Objet nettoyé
 */
export const sanitizeObject = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;
  
  const sanitized = Array.isArray(obj) ? [] : {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      
      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
  }
  
  return sanitized;
};

/**
 * Middleware pour nettoyer spécifiquement certains champs
 * Utile pour les champs qui doivent garder certains caractères (bio, messages)
 */
export const sanitizeSpecificFields = (fields = []) => {
  return (req, res, next) => {
    try {
      for (const field of fields) {
        if (req.body[field]) {
          req.body[field] = sanitizeString(req.body[field]);
        }
      }
      next();
    } catch (err) {
      logger.error('Erreur sanitization:', err);
      next(err);
    }
  };
};

/**
 * Validation de longueur des strings
 * Empêche les attaques par Buffer Overflow
 */
export const validateStringLength = (maxLength = 10000) => {
  return (req, res, next) => {
    try {
      const checkLength = (obj) => {
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            const value = obj[key];
            
            if (typeof value === 'string' && value.length > maxLength) {
              return res.status(400).json({
                error: 'Données trop volumineuses',
                message: `Le champ "${key}" dépasse la longueur maximale autorisée (${maxLength} caractères)`,
                field: key,
              });
            }
            
            if (typeof value === 'object' && value !== null) {
              const result = checkLength(value);
              if (result) return result;
            }
          }
        }
      };
      
      if (req.body) checkLength(req.body);
      if (req.query) checkLength(req.query);
      if (req.params) checkLength(req.params);
      
      next();
    } catch (err) {
      logger.error('Erreur validation longueur:', err);
      next(err);
    }
  };
};

/**
 * Middleware pour bloquer les caractères dangereux spécifiques
 * Utile pour les noms de fichiers, slugs, etc.
 */
export const blockDangerousPatterns = (req, res, next) => {
  const dangerousPatterns = [
    /<script[\s\S]*?>[\s\S]*?<\/script>/gi, // Scripts
    /javascript:/gi, // JavaScript protocol
    /on\w+\s*=/gi, // Event handlers (onclick, onerror, etc.)
    /<iframe/gi, // Iframes
    /eval\(/gi, // eval()
    /expression\(/gi, // CSS expressions
    /vbscript:/gi, // VBScript
  ];
  
  const checkPatterns = (obj) => {
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];
        
        if (typeof value === 'string') {
          for (const pattern of dangerousPatterns) {
            if (pattern.test(value)) {
              logger.warn(`Pattern dangereux détecté dans ${key}:`, value);
              return res.status(400).json({
                error: 'Contenu interdit',
                message: 'Votre requête contient des caractères non autorisés',
                field: key,
              });
            }
          }
        }
        
        if (typeof value === 'object' && value !== null) {
          const result = checkPatterns(value);
          if (result) return result;
        }
      }
    }
  };
  
  try {
    if (req.body) {
      const result = checkPatterns(req.body);
      if (result) return result;
    }
    
    next();
  } catch (err) {
    logger.error('Erreur détection patterns:', err);
    next(err);
  }
};

export default sanitizeMiddleware;