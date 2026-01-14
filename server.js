// server.js
import 'dotenv/config';
console.log('✅ 1. dotenv OK');

import express from 'express';
import helmet from 'helmet';
import hpp from 'hpp';
import corsConfig from './config/cors.js';
import securityConfig from './config/security.js';
import logger from './config/logger.js';
console.log('✅ 2. Imports config OK');

// Middleware
import errorHandler from './middleware/errorHandler.js';
import * as rateLimit from './middleware/rateLimit.js';
import sanitize from './middleware/sanitize.js';
import maintenance from './middleware/maintenance.js';
console.log('✅ 3. Imports middleware OK');

// Routes
import healthRoutes from './routes/health.js';
import authRoutes from './routes/auth.js';
import questionsRoutes from './routes/questions.js';
import matchesRoutes from './routes/matches.js';
import chatRoutes from './routes/chat.js';
import creditsRoutes from './routes/credits.js';
import paymentsRoutes from './routes/payments.js';
import subscriptionsRoutes from './routes/subscriptions.js';
import profileRoutes from './routes/profile.js';
import moderationRoutes from './routes/moderation.js';
import internalRoutes from './routes/internal.js';
import adminRoutes from './routes/admin.js';
console.log('✅ 4. Imports routes OK');

const app = express();
console.log('✅ 5. App créé');

// ⚠️ Webhook Stripe TEMPORAIREMENT COMMENTÉ - À réactiver plus tard
/*
app.post(
  '/api/payments/webhook',
  express.raw({ type: 'application/json' }),
  paymentsRoutes.webhookHandler
);
console.log('✅ 6. Webhook configuré');
*/

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(helmet(securityConfig));
app.use(hpp());
app.use(corsConfig);
app.use(sanitize);
app.use('/api/', rateLimit.globalLimiter);
app.use(maintenance);
console.log('✅ 7. Middleware configurés');

if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    logger.info(`${req.method} ${req.path}`);
    next();
  });
}

// Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionsRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/credits', creditsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/subscriptions', subscriptionsRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/moderation', moderationRoutes);
app.use('/api/internal', internalRoutes);
app.use('/api/admin', adminRoutes);
console.log('✅ 8. Routes configurées');

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Gradly API v2.5.0',
    environment: process.env.NODE_ENV,
    status: 'running',
  });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: 'Route non trouvée',
      code: 'NOT_FOUND',
      statusCode: 404,
    },
  });
});

app.use(errorHandler);
console.log('✅ 9. Error handler configuré');

const PORT = process.env.PORT || 3000;

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

console.log("PORT ENV =", process.env.PORT);
console.log('✅ 10. Avant app.listen()');
const server = app.listen(PORT, '0.0.0.0', () => {
  logger.info('='.repeat(50));
  logger.info(`✅ Gradly Backend v2.5.0 - Server running`);
  logger.info('='.repeat(50));
  logger.info(`   Port: ${PORT}`);
  logger.info(`   Environment: ${process.env.NODE_ENV}`);
  logger.info(`   Frontend URL: ${process.env.FRONTEND_URL}`);
  logger.info(`   Maintenance: ${process.env.MAINTENANCE === 'true' ? 'ON ⚠️' : 'OFF'}`);
  logger.info(`   Sentry: disabled (dev mode)`);
  
  if (process.env.REDIS_URL) {
    logger.info('   Redis: active ✅');
  } else {
    logger.info('   Redis: disabled (memory fallback)');
  }
  
  logger.info('='.repeat(50));
  logger.info(`   👉 API: http://localhost:${PORT}`);
  logger.info(`   👉 Health: http://localhost:${PORT}/api/health`);
  logger.info(`   👉 12 routes opérationnelles`);
  logger.info('='.repeat(50));
});
console.log('✅ 11. Après app.listen()');

process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

export default app;