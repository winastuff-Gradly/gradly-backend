// ⭐⭐⭐ CRITIQUE : Géocodage avec OpenStreetMap Nominatim
// Cache DB + Rate limiting 1 req/sec + Header User-Agent obligatoire

import fetch from 'node-fetch';
import { supabase } from '../config/database.js';
import logger from '../config/logger.js';

// Rate limiting : 1 req/sec maximum
const RATE_LIMIT_MS = 1000;
let lastRequestTime = 0;

/**
 * ⭐⭐⭐ Géocoder une adresse (ville + code postal)
 * 1. Check cache DB
 * 2. Si pas en cache, appel Nominatim avec rate limiting
 * 3. Cache le résultat
 * 4. Si erreur, retourner null (pas bloquant)
 */
export const geocode = async (city, postalCode, country = 'France') => {
  try {
    // 1. Check cache DB
    const { data: cached, error: cacheError } = await supabase
      .from('geocode_cache')
      .select('lat, lon')
      .eq('city', city)
      .eq('postal_code', postalCode)
      .eq('country', country)
      .single();

    if (cached && !cacheError) {
      logger.info(`✅ Geocode cache hit: ${city}, ${postalCode}`);
      return { lat: cached.lat, lon: cached.lon };
    }

    // 2. Rate limiting (1 req/sec)
    const now = Date.now();
    const timeSinceLastRequest = now - lastRequestTime;

    if (timeSinceLastRequest < RATE_LIMIT_MS) {
      const waitTime = RATE_LIMIT_MS - timeSinceLastRequest;
      logger.info(`⏳ Rate limiting: attente ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    lastRequestTime = Date.now();

    // 3. Appel Nominatim avec User-Agent obligatoire
    const url = `https://nominatim.openstreetmap.org/search?` +
      `city=${encodeURIComponent(city)}` +
      `&postalcode=${encodeURIComponent(postalCode)}` +
      `&country=${encodeURIComponent(country)}` +
      `&format=json&limit=1`;

    logger.info(`🌍 Geocoding: ${city}, ${postalCode}, ${country}`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'GradlyApp/1.0 (contact@gradly.me)', // ⚠️ OBLIGATOIRE
      },
    });

    // Vérifier rate limit Nominatim
    if (response.status === 429) {
      logger.error('❌ Nominatim rate limit hit');
      return null; // Fallback silencieux
    }

    if (!response.ok) {
      logger.error(`Erreur Nominatim: ${response.status}`);
      return null;
    }

    const data = await response.json();

    if (!data || data.length === 0) {
      logger.warn(`⚠️ Aucun résultat géocodage pour: ${city}, ${postalCode}`);
      return null;
    }

    // 4. Parser et cacher le résultat
    const result = {
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon),
    };

    // Sauvegarder en cache
    await supabase
      .from('geocode_cache')
      .insert({
        city,
        postal_code: postalCode,
        country,
        lat: result.lat,
        lon: result.lon,
      });

    logger.info(`✅ Geocoded: ${city} → (${result.lat}, ${result.lon})`);

    return result;
  } catch (err) {
    logger.error('Erreur geocode:', err);
    // ⚠️ PAS BLOQUANT : retourner null en cas d'erreur
    return null;
  }
};

/**
 * Géocoder plusieurs adresses en batch (avec délai entre chaque)
 */
export const geocodeBatch = async (addresses) => {
  const results = [];

  for (const address of addresses) {
    const result = await geocode(address.city, address.postalCode, address.country);
    results.push({
      ...address,
      ...result,
    });
  }

  return results;
};

export default {
  geocode,
  geocodeBatch,
};