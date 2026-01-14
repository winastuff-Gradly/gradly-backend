// utils/errorMessages.js
// Messages d'erreur en français pour l'application

/**
 * Messages d'erreur standardisés en français
 * Utilisés dans toute l'application backend
 */

const errorMessages = {
  // Erreurs authentification
  auth: {
    invalidCredentials: 'Email ou mot de passe incorrect',
    userNotFound: 'Utilisateur introuvable',
    emailAlreadyExists: 'Cet email est déjà utilisé',
    invalidToken: 'Token invalide ou expiré',
    tokenExpired: 'Votre session a expiré, veuillez vous reconnecter',
    unauthorized: 'Accès non autorisé',
    accountBlocked: 'Votre compte a été bloqué. Contactez le support.',
    photoRequired: 'Une photo de profil est obligatoire',
    noFaceDetected: 'Aucun visage détecté sur la photo',
    weakPassword: 'Le mot de passe doit contenir au moins 8 caractères, une majuscule et un symbole',
    invalidEmail: 'Format d\'email invalide',
  },

  // Erreurs validation
  validation: {
    required: (field) => `Le champ ${field} est obligatoire`,
    minLength: (field, min) => `${field} doit contenir au moins ${min} caractères`,
    maxLength: (field, max) => `${field} ne peut pas dépasser ${max} caractères`,
    invalidFormat: (field) => `Format invalide pour ${field}`,
    invalidAge: 'Vous devez avoir au moins 18 ans',
    invalidPostalCode: 'Code postal invalide (4-10 caractères)',
    invalidCity: 'Ville invalide',
    invalidSex: 'Sexe invalide (man ou woman)',
    invalidLookingFor: 'Recherche invalide (man, woman ou both)',
  },

  // Erreurs matching
  matching: {
    noMatchFound: 'Aucun match trouvé pour le moment. Réessayez plus tard.',
    alreadyInConversation: 'Vous êtes déjà en conversation',
    matchNotFound: 'Match introuvable',
    insufficientQuestions: 'Vous devez répondre à plus de questions avant de matcher',
    noCredits: 'Vous n\'avez plus de crédits. Rechargez votre compte.',
    notSubscribed: 'Vous devez être abonné ou avoir des crédits pour démarrer une conversation',
  },

  // Erreurs conversation
  conversation: {
    notFound: 'Conversation introuvable',
    notActive: 'Cette conversation n\'est plus active',
    notParticipant: 'Vous ne participez pas à cette conversation',
    alreadyEnded: 'Cette conversation est déjà terminée',
    cannotSendMessage: 'Impossible d\'envoyer le message',
    messageEmpty: 'Le message ne peut pas être vide',
    messageTooLong: 'Le message ne peut pas dépasser 2000 caractères',
  },

  // Erreurs crédits
  credits: {
    insufficientCredits: 'Crédits insuffisants',
    invalidAmount: 'Montant invalide',
    transactionNotFound: 'Transaction introuvable',
    transactionFailed: 'La transaction a échoué',
    alreadyProcessed: 'Cette transaction a déjà été traitée',
  },

  // Erreurs paiements (Stripe)
  payments: {
    sessionNotFound: 'Session de paiement introuvable',
    paymentFailed: 'Le paiement a échoué. Réessayez.',
    invalidSignature: 'Signature webhook invalide',
    webhookFailed: 'Erreur lors du traitement du webhook',
    stripeError: 'Erreur Stripe. Veuillez réessayer.',
    cardDeclined: 'Votre carte a été refusée',
  },

  // Erreurs abonnements
  subscription: {
    notFound: 'Abonnement introuvable',
    alreadySubscribed: 'Vous êtes déjà abonné',
    notSubscribed: 'Vous n\'êtes pas abonné',
    cancelFailed: 'Impossible d\'annuler l\'abonnement',
    invalidPlan: 'Plan d\'abonnement invalide (monthly ou yearly)',
  },

  // Erreurs profil
  profile: {
    notFound: 'Profil introuvable',
    updateFailed: 'Impossible de mettre à jour le profil',
    photoUploadFailed: 'Échec de l\'upload de la photo',
    photoTooLarge: 'La photo ne peut pas dépasser 8 Mo',
    invalidPhotoFormat: 'Format de photo invalide (jpg, png, webp uniquement)',
    noFaceDetected: 'Aucun visage détecté sur la photo. Essayez une autre photo.',
    deleteFailed: 'Impossible de supprimer le profil',
  },

  // Erreurs questions
  questions: {
    notFound: 'Question introuvable',
    invalidPalier: 'Palier invalide (1-7)',
    invalidAnswer: 'Réponse invalide',
    alreadyAnswered: 'Vous avez déjà répondu à cette question',
    palierLocked: 'Ce palier n\'est pas encore débloqué',
  },

  // Erreurs modération
  moderation: {
    alreadyBlocked: 'Cet utilisateur est déjà bloqué',
    cannotBlockSelf: 'Vous ne pouvez pas vous bloquer vous-même',
    cannotReportSelf: 'Vous ne pouvez pas vous signaler vous-même',
    reportNotFound: 'Signalement introuvable',
    invalidReason: 'Raison de signalement invalide',
  },

  // Erreurs admin
  admin: {
    accessDenied: 'Accès refusé. Vous n\'êtes pas administrateur.',
    invalidAction: 'Action invalide',
    userNotFound: 'Utilisateur introuvable',
    reportNotFound: 'Signalement introuvable',
    actionFailed: 'L\'action a échoué',
  },

  // Erreurs géocodage
  geocoding: {
    failed: 'Échec du géocodage. Les coordonnées GPS ne sont pas disponibles.',
    invalidCity: 'Ville invalide',
    invalidPostalCode: 'Code postal invalide',
    rateLimitExceeded: 'Limite de requêtes de géocodage dépassée. Réessayez plus tard.',
  },

  // Erreurs storage
  storage: {
    uploadFailed: 'Échec de l\'upload du fichier',
    deleteFailed: 'Échec de la suppression du fichier',
    fileTooLarge: 'Le fichier est trop volumineux (max 8 Mo)',
    invalidFileType: 'Type de fichier invalide',
    fileNotFound: 'Fichier introuvable',
  },

  // Erreurs générales
  general: {
    serverError: 'Erreur serveur. Veuillez réessayer.',
    notFound: 'Ressource introuvable',
    badRequest: 'Requête invalide',
    forbidden: 'Accès interdit',
    maintenance: 'Le service est actuellement en maintenance. Revenez bientôt.',
    rateLimitExceeded: 'Trop de requêtes. Veuillez patienter.',
    networkError: 'Erreur réseau. Vérifiez votre connexion.',
  },
};

/**
 * Obtenir un message d'erreur formaté
 * @param {string} category - Catégorie d'erreur (ex: 'auth', 'validation')
 * @param {string} key - Clé du message (ex: 'invalidCredentials')
 * @param {Array} params - Paramètres additionnels pour les messages dynamiques
 * @returns {string} Message d'erreur formaté
 */
function getErrorMessage(category, key, ...params) {
  try {
    const message = errorMessages[category]?.[key];
    
    if (!message) {
      return errorMessages.general.serverError;
    }

    // Si le message est une fonction (pour messages dynamiques)
    if (typeof message === 'function') {
      return message(...params);
    }

    return message;
  } catch (error) {
    console.error('Error getting error message:', error);
    return errorMessages.general.serverError;
  }
}

/**
 * Créer un objet erreur formaté pour l'API
 * @param {string} category - Catégorie d'erreur
 * @param {string} key - Clé du message
 * @param {number} statusCode - Code HTTP
 * @param {Array} params - Paramètres additionnels
 * @returns {Object} Objet erreur formaté
 */
function createError(category, key, statusCode = 500, ...params) {
  const message = getErrorMessage(category, key, ...params);
  
  return {
    success: false,
    error: {
      message,
      code: `${category.toUpperCase()}_${key.toUpperCase()}`,
      statusCode,
    },
  };
}

export {
  errorMessages,
  getErrorMessage,
  createError,
};