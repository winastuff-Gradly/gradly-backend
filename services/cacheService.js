// ⭐⭐ IMPORTANT : Cache Redis avec fallback automatique
// Si REDIS_URL vide → pas de cache (retourne null)
// Si REDIS_URL existe → connexion Redis

import { createClient } from 'redis';
import logger from '../config/logger.js';

let client = null;
let isConnected = false;

// Initialiser Redis si REDIS_URL existe
if (process.env.REDIS_URL) {
  client = createClient({
    url: process.env.REDIS_URL,
  });

  client.on('error', (err) => {
    logger.error('❌ Redis error:', err);
    isConnected = false;
  });

  client.on('connect', () => {
    logger.info('✅ Redis connecté');
    isConnected = true;
  });

  // Connexion asynchrone
  client.connect().catch((err) => {
    logger.error('Erreur connexion Redis:', err);
    client = null;
  });
} else {
  logger.info('ℹ️  Redis non configuré (REDIS_URL vide) - cache désactivé');
}

/**
 * Get : Récupérer une valeur du cache
 * @returns {Promise<string|null>}
 */
export const get = async (key) => {
  if (!client || !isConnected) return null;

  try {
    const value = await client.get(key);
    return value;
  } catch (err) {
    logger.error('Erreur cache get:', err);
    return null;
  }
};

/**
 * Set : Sauvegarder une valeur dans le cache
 * @param {number} expirySeconds - TTL en secondes (défaut 300 = 5min)
 */
export const set = async (key, value, expirySeconds = 300) => {
  if (!client || !isConnected) return;

  try {
    await client.set(key, value, { EX: expirySeconds });
  } catch (err) {
    logger.error('Erreur cache set:', err);
  }
};

/**
 * Del : Supprimer une clé du cache
 */
export const del = async (key) => {
  if (!client || !isConnected) return;

  try {
    await client.del(key);
  } catch (err) {
    logger.error('Erreur cache del:', err);
  }
};

/**
 * Vérifier si le cache est actif
 */
export const isActive = () => {
  return client !== null && isConnected;
};

export default {
  get,
  set,
  del,
  isActive,
};