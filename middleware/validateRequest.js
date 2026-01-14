// ⭐ IMPORTANT : Middleware de validation avec Joi
// Valide les données des requêtes (body, query, params)

import Joi from 'joi';
import logger from '../config/logger.js';
import { errorMessages } from '../utils/errorMessages.js';

/**
 * Middleware de validation générique
 * Permet de valider body, query ou params avec un schéma Joi
 * 
 * @param {Object} schema - Objet contenant les schémas Joi pour body/query/params
 * @returns {Function} - Middleware Express
 * 
 * Exemple d'utilisation:
 * validateRequest({
 *   body: Joi.object({ email: Joi.string().email().required() }),
 *   query: Joi.object({ page: Joi.number().integer().min(1) }),
 * })
 */
export const validateRequest = (schema) => {
  return (req, res, next) => {
    const validationOptions = {
      abortEarly: false, // Retourner toutes les erreurs, pas seulement la première
      allowUnknown: true, // Permettre les champs non définis dans le schéma
      stripUnknown: false, // Ne pas supprimer les champs inconnus
    };

    const errors = [];

    // Valider le body
    if (schema.body) {
      const { error, value } = schema.body.validate(req.body, validationOptions);
      if (error) {
        errors.push(...error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          type: 'body',
        })));
      } else {
        req.body = value; // Utiliser la valeur validée et transformée
      }
    }

    // Valider les query params
    if (schema.query) {
      const { error, value } = schema.query.validate(req.query, validationOptions);
      if (error) {
        errors.push(...error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          type: 'query',
        })));
      } else {
        req.query = value;
      }
    }

    // Valider les params
    if (schema.params) {
      const { error, value } = schema.params.validate(req.params, validationOptions);
      if (error) {
        errors.push(...error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message,
          type: 'params',
        })));
      } else {
        req.params = value;
      }
    }

    // Si erreurs de validation, retourner 400
    if (errors.length > 0) {
      logger.warn('Erreur validation requête:', {
        path: req.path,
        errors,
      });

      return res.status(400).json({
        error: ERROR_MESSAGES.VALIDATION_ERROR,
        message: 'Les données fournies sont invalides',
        errors: errors.map(err => ({
          field: err.field,
          message: err.message.replace(/"/g, ''), // Enlever les guillemets de Joi
        })),
      });
    }

    // Validation réussie
    next();
  };
};

/**
 * Schémas Joi réutilisables pour les validations courantes
 */
export const commonSchemas = {
  // UUID valide
  uuid: Joi.string().uuid({ version: 'uuidv4' }).required(),

  // Email valide
  email: Joi.string().email().required().messages({
    'string.email': 'L\'adresse email n\'est pas valide',
    'any.required': 'L\'email est obligatoire',
  }),

  // Password sécurisé (min 8 caractères, 1 majuscule, 1 symbole)
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[A-Z])(?=.*[!@#$%^&*])/)
    .required()
    .messages({
      'string.min': 'Le mot de passe doit contenir au moins 8 caractères',
      'string.pattern.base': 'Le mot de passe doit contenir au moins 1 majuscule et 1 symbole',
      'any.required': 'Le mot de passe est obligatoire',
    }),

  // Code postal français (5 chiffres) ou international (4-10 caractères)
  postalCode: Joi.string().min(4).max(10).required().messages({
    'string.min': 'Le code postal doit contenir au moins 4 caractères',
    'string.max': 'Le code postal ne peut pas dépasser 10 caractères',
    'any.required': 'Le code postal est obligatoire',
  }),

  // Date de naissance (18+)
  birthdate: Joi.date()
    .max('now')
    .iso()
    .custom((value, helpers) => {
      const age = Math.floor((Date.now() - value.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      if (age < 18) {
        return helpers.error('any.invalid');
      }
      return value;
    })
    .required()
    .messages({
      'date.max': 'La date de naissance ne peut pas être dans le futur',
      'any.invalid': 'Vous devez avoir au moins 18 ans pour utiliser Gradly',
      'any.required': 'La date de naissance est obligatoire',
    }),

  // Pagination
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(50),

  // Tri
  sortBy: Joi.string().valid('created_at', 'updated_at', 'name').default('created_at'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
};

/**
 * Middleware de validation spécifique pour les fichiers
 * Vérifie la présence et le type de fichiers uploadés
 */
export const validateFile = (options = {}) => {
  const {
    required = true,
    maxSize = 8 * 1024 * 1024, // 8 MB par défaut
    allowedTypes = ['image/jpeg', 'image/png', 'image/webp'],
  } = options;

  return (req, res, next) => {
    // Vérifier si un fichier est requis
    if (required && !req.file) {
      return res.status(400).json({
        error: ERROR_MESSAGES.VALIDATION_ERROR,
        message: 'Un fichier est requis',
      });
    }

    // Si pas de fichier et pas requis, continuer
    if (!req.file) {
      return next();
    }

    // Vérifier la taille
    if (req.file.size > maxSize) {
      return res.status(413).json({
        error: ERROR_MESSAGES.FILE_TOO_LARGE,
        message: `Le fichier est trop volumineux (max ${Math.floor(maxSize / 1024 / 1024)} Mo)`,
      });
    }

    // Vérifier le type MIME
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        error: ERROR_MESSAGES.INVALID_FILE_TYPE,
        message: `Type de fichier non autorisé. Types acceptés: ${allowedTypes.join(', ')}`,
      });
    }

    next();
  };
};

export default validateRequest;