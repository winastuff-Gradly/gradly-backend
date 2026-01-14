// Service d'analytics pour le panel admin
// Fournit des statistiques et métriques business

import { supabase } from '../config/database.js';
import logger from '../config/logger.js';

/**
 * Obtenir les stats globales
 */
export const getGlobalStats = async () => {
  try {
    // Users actifs (dernières 24h)
    const { count: activeUsers24h } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('last_seen', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    // Users actifs (7 jours)
    const { count: activeUsers7d } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('last_seen', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    // Conversations actives
    const { count: activeConversations } = await supabase
      .from('conversations')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true);

    // Revenus du jour (crédits)
    const { data: revenueToday } = await supabase
      .from('credit_transactions')
      .select('amount')
      .eq('type', 'purchase')
      .gte('created_at', new Date().toISOString().split('T')[0]);

    const totalRevenueToday = revenueToday?.reduce((sum, t) => sum + (t.amount * 4.99), 0) || 0;

    return {
      activeUsers24h,
      activeUsers7d,
      activeConversations,
      revenueToday: totalRevenueToday,
    };
  } catch (err) {
    logger.error('Erreur getGlobalStats:', err);
    throw err;
  }
};

/**
 * Obtenir les métriques de conversion
 */
export const getConversionMetrics = async () => {
  try {
    // Total users inscrits
    const { count: totalUsers } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    // Users avec au moins 1 match
    const { count: usersWithMatch } = await supabase
      .from('matches')
      .select('user1_id', { count: 'exact', head: true });

    // Users abonnés
    const { count: subscribedUsers } = await supabase
      .from('subscriptions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'active');

    const conversionToMatch = ((usersWithMatch / totalUsers) * 100).toFixed(2);
    const conversionToSubscription = ((subscribedUsers / totalUsers) * 100).toFixed(2);

    return {
      totalUsers,
      usersWithMatch,
      subscribedUsers,
      conversionToMatch,
      conversionToSubscription,
    };
  } catch (err) {
    logger.error('Erreur getConversionMetrics:', err);
    throw err;
  }
};

export default {
  getGlobalStats,
  getConversionMetrics,
};