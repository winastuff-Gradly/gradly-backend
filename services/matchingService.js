// ⭐⭐⭐ CRITIQUE : Service de matching avec géolocalisation 3 niveaux
// Niveau 1 : Géo (distance_max) → Niveau 2 : Ville → Niveau 3 : Global
// Formule compatibility_score : 25 points × 4 questions = 0-100

import { supabase } from '../config/database.js';
import logger from '../config/logger.js';
import { haversine } from '../utils/geoUtils.js';
import * as cache from './cacheService.js';

/**
 * Calcul du score de compatibilité basé sur les 4 questions initiales
 * Chaque question vaut 25 points si elle match
 * 
 * @param {Object} user1 - Premier utilisateur avec ses réponses
 * @param {Object} user2 - Deuxième utilisateur avec ses réponses
 * @returns {number} - Score de 0 à 100
 */
export const calculateCompatibilityScore = (user1, user2) => {
  let score = 0;

  // Q1 : Fumeur (25 points si match)
  if (user1.q1_smoke === user2.q1_smoke) {
    score += 25;
  }

  // Q2 : Relation sérieuse (25 points si match)
  if (user1.q2_serious === user2.q2_serious) {
    score += 25;
  }

  // Q3 : Matin ou soir (25 points si match)
  if (user1.q3_morning === user2.q3_morning) {
    score += 25;
  }

  // Q4 : Ville ou campagne (25 points si match)
  if (user1.q4_city === user2.q4_city) {
    score += 25;
  }

  return score;
};

/**
 * Filtrer les candidats selon les critères de base
 * 
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} userProfile - Profil de l'utilisateur
 * @returns {Promise<Array>} - Liste des candidats potentiels
 */
const getBaseCandidates = async (userId, userProfile) => {
  // Récupérer les users bloqués par l'utilisateur
  const { data: blockedUsers } = await supabase
    .from('blocks')
    .select('blocked_id')
    .eq('blocker_id', userId);

  const blockedIds = blockedUsers?.map(b => b.blocked_id) || [];

  // Récupérer les users qui ont bloqué l'utilisateur
  const { data: blockingUsers } = await supabase
    .from('blocks')
    .select('blocker_id')
    .eq('blocked_id', userId);

  const blockingIds = blockingUsers?.map(b => b.blocker_id) || [];

  // Combiner toutes les exclusions
  const excludedIds = [userId, ...blockedIds, ...blockingIds];

  // Query de base avec tous les filtres
  const { data: candidates, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('sex', userProfile.looking_for)
    .eq('looking_for', userProfile.sex)
    .eq('in_conversation', false)
    .eq('is_blocked', false)
    .not('id', 'in', `(${excludedIds.join(',')})`)
    .gte('calculate_age(birthdate)', userProfile.age_min || 18)
    .lte('calculate_age(birthdate)', userProfile.age_max || 99);

  if (error) {
    logger.error('Erreur récupération candidats:', error);
    throw error;
  }

  return candidates || [];
};

/**
 * ⭐⭐⭐ NIVEAU 1 : Matching géographique (si lat/lon disponibles)
 * Filtre les candidats dans un rayon de distance_max km
 * 
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} userProfile - Profil avec lat/lon
 * @returns {Promise<Object|null>} - Meilleur match ou null
 */
const findMatchGeo = async (userId, userProfile) => {
  // Vérifier si l'utilisateur a des coordonnées
  if (!userProfile.lat || !userProfile.lon) {
    return null;
  }

  const candidates = await getBaseCandidates(userId, userProfile);

  // Filtrer les candidats avec coordonnées dans le rayon
  const candidatesWithDistance = candidates
    .filter(c => c.lat && c.lon)
    .map(candidate => {
      const distance = haversine(
        userProfile.lat,
        userProfile.lon,
        candidate.lat,
        candidate.lon
      );
      return { ...candidate, distance };
    })
    .filter(c => c.distance <= (userProfile.distance_max || 50))
    .sort((a, b) => a.distance - b.distance); // Trier par distance croissante

  if (candidatesWithDistance.length === 0) {
    return null;
  }

  // Calculer les scores de compatibilité
  const candidatesWithScore = candidatesWithDistance.map(candidate => ({
    ...candidate,
    compatibility_score: calculateCompatibilityScore(userProfile, candidate),
  }));

  // Trier par score décroissant, puis par distance croissante
  candidatesWithScore.sort((a, b) => {
    if (b.compatibility_score !== a.compatibility_score) {
      return b.compatibility_score - a.compatibility_score;
    }
    return a.distance - b.distance;
  });

  // Retourner le meilleur match
  return {
    candidate: candidatesWithScore[0],
    level: 'geo',
  };
};

/**
 * ⭐⭐ NIVEAU 2 : Fallback même ville
 * Si niveau 1 sans résultat, chercher dans la même ville
 * 
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} userProfile - Profil utilisateur
 * @returns {Promise<Object|null>} - Meilleur match ou null
 */
const findMatchCity = async (userId, userProfile) => {
  const candidates = await getBaseCandidates(userId, userProfile);

  // Filtrer les candidats de la même ville
  const sameCityCandidates = candidates.filter(
    c => c.city && c.city.toLowerCase() === userProfile.city.toLowerCase()
  );

  if (sameCityCandidates.length === 0) {
    return null;
  }

  // Calculer les scores de compatibilité
  const candidatesWithScore = sameCityCandidates.map(candidate => ({
    ...candidate,
    compatibility_score: calculateCompatibilityScore(userProfile, candidate),
    distance: null, // Pas de distance précise
  }));

  // Trier par score décroissant
  candidatesWithScore.sort((a, b) => b.compatibility_score - a.compatibility_score);

  return {
    candidate: candidatesWithScore[0],
    level: 'city',
  };
};

/**
 * ⭐ NIVEAU 3 : Fallback global
 * Si niveaux 1 et 2 sans résultat, chercher globalement
 * 
 * @param {string} userId - ID de l'utilisateur
 * @param {Object} userProfile - Profil utilisateur
 * @returns {Promise<Object|null>} - Meilleur match ou null
 */
const findMatchGlobal = async (userId, userProfile) => {
  const candidates = await getBaseCandidates(userId, userProfile);

  if (candidates.length === 0) {
    return null;
  }

  // Calculer les scores de compatibilité
  const candidatesWithScore = candidates.map(candidate => ({
    ...candidate,
    compatibility_score: calculateCompatibilityScore(userProfile, candidate),
    distance: null,
  }));

  // Trier par score décroissant
  candidatesWithScore.sort((a, b) => b.compatibility_score - a.compatibility_score);

  // Limiter à 10 candidats pour performance
  const topCandidates = candidatesWithScore.slice(0, 10);

  return {
    candidate: topCandidates[0],
    level: 'global',
  };
};

/**
 * ⭐⭐⭐ FONCTION PRINCIPALE : Trouver un match avec 3 niveaux
 * 
 * @param {string} userId - ID de l'utilisateur cherchant un match
 * @returns {Promise<Object|null>} - Match trouvé ou null
 */
export const findMatch = async (userId) => {
  try {
    logger.info(`🔍 Recherche de match pour user: ${userId}`);

    // Vérifier le cache Redis (si activé)
    const cachedResult = await cache.get(`match_candidates:${userId}`);
    if (cachedResult) {
      logger.info(`✅ Cache hit pour user ${userId}`);
      return JSON.parse(cachedResult);
    }

    // 1. Récupérer le profil de l'utilisateur
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !userProfile) {
      logger.error('Erreur récupération profil:', profileError);
      throw new Error('Profil utilisateur introuvable');
    }

    // Vérifier que le user n'est pas déjà en conversation
    if (userProfile.in_conversation) {
      logger.warn(`User ${userId} déjà en conversation`);
      return null;
    }

    // ⭐⭐⭐ NIVEAU 1 : Matching géographique
    let match = await findMatchGeo(userId, userProfile);
    
    if (match) {
      logger.info(`✅ Match trouvé (niveau géo) : user ${userId} → ${match.candidate.id} (${match.candidate.distance}km, score: ${match.candidate.compatibility_score}%)`);
    } else {
      // ⭐⭐ NIVEAU 2 : Fallback même ville
      match = await findMatchCity(userId, userProfile);
      
      if (match) {
        logger.info(`✅ Match trouvé (niveau ville) : user ${userId} → ${match.candidate.id} (même ville, score: ${match.candidate.compatibility_score}%)`);
      } else {
        // ⭐ NIVEAU 3 : Fallback global
        match = await findMatchGlobal(userId, userProfile);
        
        if (match) {
          logger.info(`✅ Match trouvé (niveau global) : user ${userId} → ${match.candidate.id} (score: ${match.candidate.compatibility_score}%)`);
        } else {
          logger.info(`❌ Aucun match trouvé pour user ${userId}`);
          return null;
        }
      }
    }

    // Créer l'entrée match dans la DB
    const { data: createdMatch, error: matchError } = await supabase
      .from('matches')
      .insert({
        user1_id: userId,
        user2_id: match.candidate.id,
        compatibility_score: match.candidate.compatibility_score,
        distance: match.candidate.distance,
        is_active: true,
      })
      .select()
      .single();

    if (matchError) {
      logger.error('Erreur création match:', matchError);
      throw matchError;
    }

    // ⭐⭐⭐ CRITIQUE : Logger dans matching.log avec détails complets
    logger.info(`Match created: user1=${userId} user2=${match.candidate.id} score=${match.candidate.compatibility_score} distance=${match.candidate.distance || 'N/A'}km level=${match.level}`);

    // Mettre en cache le résultat (TTL 5 min)
    await cache.set(
      `match_candidates:${userId}`,
      JSON.stringify({
        match: createdMatch,
        candidate: match.candidate,
        level: match.level,
      }),
      300
    );

    return {
      match: createdMatch,
      candidate: match.candidate,
      level: match.level,
    };
  } catch (err) {
    logger.error('Erreur findMatch:', err);
    throw err;
  }
};

/**
 * Invalider le cache de matching pour un user
 * À appeler après des actions critiques (update profil, fin conversation)
 */
export const invalidateMatchCache = async (userId) => {
  await cache.del(`match_candidates:${userId}`);
  logger.info(`Cache invalidé pour user ${userId}`);
};

export default {
  findMatch,
  calculateCompatibilityScore,
  invalidateMatchCache,
};