// ============================================================================
// GRADLY V2.5 - CORS CONFIGURATION
// ============================================================================
// Configuration CORS stricte (FRONTEND_URL uniquement)
// ============================================================================

import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

// ============================================================================
// CONFIGURATION CORS STRICTE
// ============================================================================
const corsOptions = {
  // Origine autorisée : UNIQUEMENT le frontend
  origin: function (origin, callback) {
    const allowedOrigins = [
      process.env.FRONTEND_URL, // ex: http://localhost:5173 (dev) ou https://app.gradly.me (prod)
      'http://localhost:5173', // Fallback dev
      'http://localhost:3000', // Fallback dev
    ].filter(Boolean);

    // Autoriser les requêtes sans origine (ex: Postman, curl)
    if (!origin) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.warn(`⚠️ Origine CORS refusée: ${origin}`);
      callback(new Error('Non autorisé par CORS'));
    }
  },

  // Méthodes HTTP autorisées
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],

  // Headers autorisés
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin'
  ],

  // Headers exposés au client
  exposedHeaders: ['Content-Length', 'X-Request-Id'],

  // Autoriser les cookies/credentials
  credentials: true,

  // Durée du cache preflight (24h)
  maxAge: 86400,

  // Envoyer status 204 pour OPTIONS
  optionsSuccessStatus: 204
};

// ============================================================================
// MIDDLEWARE CORS
// ============================================================================
export const corsMiddleware = cors(corsOptions);

// ============================================================================
// CORS POUR WEBHOOKS STRIPE (Plus permissif)
// ============================================================================
// Les webhooks Stripe viennent de Stripe, pas du frontend
export const corsWebhook = cors({
  origin: '*', // Accepter toutes origines pour webhooks
  methods: ['POST'],
  allowedHeaders: ['Content-Type', 'Stripe-Signature']
});

// ============================================================================
// EXPORT DEFAULT
// ============================================================================
export default corsMiddleware;