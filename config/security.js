// ============================================================================
// GRADLY V2.5 - SECURITY CONFIGURATION
// ============================================================================
// Helmet + CSP + HPP
// ============================================================================

import helmet from 'helmet';
import hpp from 'hpp';

// ============================================================================
// HELMET CONFIGURATION
// ============================================================================
// Protection contre les vulnérabilités web communes

export const helmetConfig = helmet({
  // Content Security Policy
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      fontSrc: ["'self'", 'https://fonts.gstatic.com'],
      imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
      scriptSrc: ["'self'"],
      connectSrc: [
        "'self'",
        'https://*.supabase.co', // Supabase
        'https://api.stripe.com', // Stripe
        'https://nominatim.openstreetmap.org', // Géocodage
        ...(process.env.NODE_ENV === 'development' ? ['http://localhost:*'] : [])
      ],
      frameSrc: ["'self'", 'https://js.stripe.com'], // Stripe Checkout
      objectSrc: ["'none'"],
      upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null
    }
  },

  // Protection contre clickjacking
  frameguard: {
    action: 'deny'
  },

  // Forcer HTTPS en production
  hsts: {
    maxAge: 31536000, // 1 an
    includeSubDomains: true,
    preload: true
  },

  // Désactiver X-Powered-By
  hidePoweredBy: true,

  // Protection XSS navigateur
  xssFilter: true,

  // Empêcher MIME type sniffing
  noSniff: true,

  // Referrer policy
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  }
});

// ============================================================================
// HPP (HTTP Parameter Pollution Protection)
// ============================================================================
// Empêche l'injection de paramètres HTTP malveillants

export const hppMiddleware = hpp({
  whitelist: [
    'page',
    'limit',
    'sort',
    'order',
    'status',
    'type'
  ]
});

// ============================================================================
// CONFIGURATION CORS SÉCURISÉE
// ============================================================================
// Définie dans config/cors.js

// ============================================================================
// HEADERS DE SÉCURITÉ ADDITIONNELS
// ============================================================================
export function securityHeaders(req, res, next) {
  // Feature Policy (Permissions Policy)
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=(), payment=()'
  );

  // Empêcher mise en cache des données sensibles
  if (req.path.includes('/api/auth') || req.path.includes('/api/profile')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.setHeader('Pragma', 'no-cache');
  }

  next();
}

// ============================================================================
// VALIDATION INPUT (Protection injection)
// ============================================================================
// Définie dans middleware/sanitize.js et middleware/validateRequest.js

// ============================================================================
// EXPORT MIDDLEWARE COMPLET
// ============================================================================
export const securityMiddleware = [
  helmetConfig,
  hppMiddleware,
  securityHeaders
];

export default securityMiddleware;