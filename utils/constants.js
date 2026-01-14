// ============================================================================
// GRADLY V2.5 - CONSTANTES GLOBALES
// ============================================================================
// Toutes les constantes utilisées dans l'application
// ============================================================================

// ============================================================================
// APPLICATION
// ============================================================================
export const APP_NAME = 'Gradly';
export const APP_TAGLINE = 'Le cœur avant les yeux 💚';
export const APP_VERSION = '2.5.0';

// ============================================================================
// CRÉDITS
// ============================================================================
export const CREDITS = {
  INITIAL: 7, // Crédits gratuits à l'inscription
  PACK_3: 3, // Pack 3 crédits
  PACK_10: 10, // Pack 10 crédits
  CONVERSATION_COST: 1 // Coût d'une conversation
};

// ============================================================================
// ABONNEMENTS
// ============================================================================
export const SUBSCRIPTIONS = {
  MONTHLY: {
    name: 'Premium Mensuel',
    price: 1499, // 14,99€ en centimes
    interval: 'month',
    badge: '💎'
  },
  YEARLY: {
    name: 'Premium Annuel',
    price: 9900, // 99€ en centimes
    interval: 'year',
    badge: '👑'
  }
};

// ============================================================================
// QUESTIONS
// ============================================================================
export const QUESTIONS = {
  TOTAL: 74, // Nombre total de questions
  INITIAL: 4, // Questions initiales (q1_smoke, q2_serious, q3_morning, q4_city)
  PER_PALIER: 10, // Questions par palier
  PALIERS_TOTAL: 7 // Nombre de paliers
};

// ============================================================================
// MATCHING
// ============================================================================
export const MATCHING = {
  SCORE_MIN: 0,
  SCORE_MAX: 100,
  SCORE_PER_QUESTION: 25, // Points par question initiale
  DISTANCE_DEFAULT: 50, // Distance max par défaut (km)
  DISTANCE_MIN: 10, // Distance min (km)
  DISTANCE_MAX: 200 // Distance max (km)
};

// Niveaux de matching (ordre d'essai)
export const MATCHING_LEVELS = {
  GEO: 'geo', // Niveau 1 : Géolocalisation (distance_max)
  CITY: 'city', // Niveau 2 : Même ville
  GLOBAL: 'global' // Niveau 3 : Global (n'importe où)
};

// ============================================================================
// CHAT / DÉFLOUTAGE
// ============================================================================
export const CHAT = {
  DEFLOUTING_STEP: 1, // +1% par message
  DEFLOUTING_MAX: 100, // 100% = photo complètement défloutée
  MESSAGE_MAX_LENGTH: 2000, // Longueur max d'un message
  MESSAGES_PER_PAGE: 50, // Pagination messages
  SYSTEM_MESSAGE_BIENVENUE:
    '🎉 Bienvenue dans votre conversation Gradly ! Soyez authentique, respectueux et amusez-vous bien ! 💬'
};

// ============================================================================
// STORAGE
// ============================================================================
export const STORAGE = {
  BUCKET_NAME: 'avatars',
  MAX_FILE_SIZE: 8 * 1024 * 1024, // 8 MB
  MAX_DIMENSIONS: 2560, // Largeur/hauteur max en px
  ALLOWED_FORMATS: ['jpg', 'jpeg', 'png', 'webp'],
  SIGNED_URL_EXPIRY: 3600 // 1 heure (en secondes)
};

// ============================================================================
// RATE LIMITING
// ============================================================================
export const RATE_LIMITS = {
  STRICT: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5 // 5 requêtes max
  },
  CHAT: {
    windowMs: 60 * 1000, // 1 minute
    max: 30 // 30 messages max par minute
  },
  GLOBAL: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100 // 100 requêtes max
  }
};

// ============================================================================
// ÂGES
// ============================================================================
export const AGE = {
  MIN: 18, // Âge minimum légal
  MAX: 99, // Âge maximum
  DEFAULT_MIN: 18,
  DEFAULT_MAX: 99
};

// ============================================================================
// GÉOCODAGE
// ============================================================================
export const GEOCODING = {
  PROVIDER: 'OpenStreetMap Nominatim',
  BASE_URL: 'https://nominatim.openstreetmap.org',
  USER_AGENT: 'GradlyApp/1.0 (contact@gradly.me)',
  RATE_LIMIT_MS: 1000, // 1 requête par seconde (obligatoire)
  CACHE_TTL: 90 * 24 * 60 * 60 * 1000, // 90 jours
  DEFAULT_COUNTRY: 'France'
};

// ============================================================================
// ADMIN
// ============================================================================
export const ADMIN = {
  REPORTS_PER_PAGE: 20,
  USERS_PER_PAGE: 50,
  ACTIONS: [
    'block_user',
    'unblock_user',
    'delete_user',
    'dismiss_report',
    'reset_credits',
    'add_credits'
  ]
};

// ============================================================================
// REPORT REASONS
// ============================================================================
export const REPORT_REASONS = {
  HARASSMENT: 'harassment',
  INAPPROPRIATE: 'inappropriate',
  SPAM: 'spam',
  FAKE: 'fake',
  OTHER: 'other'
};

// Traductions françaises
export const REPORT_REASONS_FR = {
  [REPORT_REASONS.HARASSMENT]: 'Harcèlement',
  [REPORT_REASONS.INAPPROPRIATE]: 'Contenu inapproprié',
  [REPORT_REASONS.SPAM]: 'Spam',
  [REPORT_REASONS.FAKE]: 'Faux profil',
  [REPORT_REASONS.OTHER]: 'Autre'
};

// ============================================================================
// STATUTS
// ============================================================================
export const STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  CANCELLED: 'cancelled',
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  RESOLVED: 'resolved',
  DISMISSED: 'dismissed'
};

// ============================================================================
// REGEX PATTERNS
// ============================================================================
export const PATTERNS = {
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PASSWORD: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  POSTAL_CODE: /^[0-9]{4,10}$/, // 4-10 chiffres
  PHONE: /^(?:(?:\+|00)33|0)\s*[1-9](?:[\s.-]*\d{2}){4}$/ // Format français
};

// ============================================================================
// MESSAGES D'ERREUR (voir errorMessages.js pour messages complets)
// ============================================================================
export const ERROR_CODES = {
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  USER_BLOCKED: 'USER_BLOCKED',
  INSUFFICIENT_CREDITS: 'INSUFFICIENT_CREDITS',
  ALREADY_IN_CONVERSATION: 'ALREADY_IN_CONVERSATION',
  NO_MATCH_FOUND: 'NO_MATCH_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED'
};

// ============================================================================
// EXPORT DEFAULT
// ============================================================================
export default {
  APP_NAME,
  APP_TAGLINE,
  APP_VERSION,
  CREDITS,
  SUBSCRIPTIONS,
  QUESTIONS,
  MATCHING,
  MATCHING_LEVELS,
  CHAT,
  STORAGE,
  RATE_LIMITS,
  AGE,
  GEOCODING,
  ADMIN,
  REPORT_REASONS,
  REPORT_REASONS_FR,
  STATUS,
  PATTERNS,
  ERROR_CODES
};