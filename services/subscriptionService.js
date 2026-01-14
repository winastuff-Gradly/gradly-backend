// Service de gestion des abonnements

import { supabase } from '../config/database.js';
import logger from '../config/logger.js';

/**
 * Vérifier si un utilisateur est abonné (via la vue)
 */
export const checkSubscription = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('profiles_with_subscription')
      .select('is_subscribed')
      .eq('id', userId)
      .single();

    if (error) throw error;

    return data?.is_subscribed || false;
  } catch (err) {
    logger.error('Erreur vérification abonnement:', err);
    return false;
  }
};

/**
 * Obtenir les détails de l'abonnement actif
 */
export const getActiveSubscription = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'active')
      .gte('current_period_end', new Date().toISOString())
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Pas d'abonnement trouvé
        return null;
      }
      throw error;
    }

    return data;
  } catch (err) {
    logger.error('Erreur récupération abonnement:', err);
    return null;
  }
};

/**
 * Obtenir le badge abonnement (💎 ou 👑)
 */
export const getSubscriptionBadge = async (userId) => {
  const subscription = await getActiveSubscription(userId);
  
  if (!subscription) return null;
  
  return subscription.plan_type === 'yearly' ? '👑' : '💎';
};

export default {
  checkSubscription,
  getActiveSubscription,
  getSubscriptionBadge,
};