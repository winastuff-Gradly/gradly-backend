// ⭐⭐⭐ CRITIQUE : Gestion crédit avec statuts
// Match trouvé → pending
// Chat start → confirmed (débit)
// Erreur/annulation → cancelled (restitution)

import { supabase } from '../config/database.js';
import logger from '../config/logger.js';

/**
 * ⭐⭐⭐ Créer une transaction pending (match trouvé)
 * Le crédit n'est PAS encore déduit
 */
export const createPendingTransaction = async (userId, matchId) => {
  try {
    const { data, error } = await supabase
      .from('credit_transactions')
      .insert({
        user_id: userId,
        amount: -1,
        type: 'usage',
        status: 'pending', // ⚠️ En attente
        description: `Match trouvé (en attente de chat) - Match ID: ${matchId}`,
      })
      .select()
      .single();

    if (error) throw error;

    logger.info(`💳 Transaction pending créée: user=${userId} match=${matchId}`);
    return data;
  } catch (err) {
    logger.error('Erreur création transaction pending:', err);
    throw err;
  }
};

/**
 * ⭐⭐⭐ Confirmer une transaction (chat lancé)
 * Passe de pending → confirmed et débite le crédit
 */
export const confirmTransaction = async (transactionId, userId) => {
  try {
    // 1. Marquer la transaction comme confirmée
    const { error: updateError } = await supabase
      .from('credit_transactions')
      .update({
        status: 'confirmed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', transactionId)
      .eq('user_id', userId);

    if (updateError) throw updateError;

    // 2. Déduire le crédit
    const { error: deductError } = await supabase
      .rpc('deduct_credit', {
        p_user_id: userId,
        p_amount: 1,
      });

    if (deductError) throw deductError;

    logger.info(`✅ Transaction confirmée: ${transactionId} - 1 crédit déduit pour user ${userId}`);
    return true;
  } catch (err) {
    logger.error('Erreur confirmation transaction:', err);
    throw err;
  }
};

/**
 * ⭐⭐⭐ Annuler une transaction (erreur/abandon)
 * Passe de pending → cancelled et ne débite PAS le crédit
 */
export const cancelTransaction = async (transactionId, userId, reason = 'Annulé') => {
  try {
    const { error } = await supabase
      .from('credit_transactions')
      .update({
        status: 'cancelled',
        description: reason,
        updated_at: new Date().toISOString(),
      })
      .eq('id', transactionId)
      .eq('user_id', userId)
      .eq('status', 'pending'); // Seulement si encore pending

    if (error) throw error;

    logger.info(`❌ Transaction annulée: ${transactionId} - crédit restitué pour user ${userId}`);
    return true;
  } catch (err) {
    logger.error('Erreur annulation transaction:', err);
    throw err;
  }
};

/**
 * Obtenir la transaction pending d'un user
 */
export const getPendingTransaction = async (userId) => {
  try {
    const { data, error } = await supabase
      .from('credit_transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // Pas de transaction pending
        return null;
      }
      throw error;
    }

    return data;
  } catch (err) {
    logger.error('Erreur récupération transaction pending:', err);
    return null;
  }
};

/**
 * Vérifier si un user a assez de crédits OU est abonné
 */
export const canStartConversation = async (userId) => {
  try {
    // Vérifier abonnement d'abord
    const { data: profile, error: profileError } = await supabase
      .from('profiles_with_subscription')
      .select('is_subscribed, credits')
      .eq('id', userId)
      .single();

    if (profileError) throw profileError;

    // Si abonné, toujours OK
    if (profile.is_subscribed) {
      return { canStart: true, reason: 'subscribed' };
    }

    // Sinon, vérifier les crédits
    if (profile.credits >= 1) {
      return { canStart: true, reason: 'has_credits' };
    }

    return { canStart: false, reason: 'no_credits' };
  } catch (err) {
    logger.error('Erreur vérification crédits:', err);
    return { canStart: false, reason: 'error' };
  }
};

export default {
  createPendingTransaction,
  confirmTransaction,
  cancelTransaction,
  getPendingTransaction,
  canStartConversation,
};