// ============================================================================
// GRADLY V2.5 - DATABASE CONFIGURATION
// ============================================================================
// Supabase client avec service key pour opérations admin
// ============================================================================

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Charger variables d'environnement
dotenv.config();

// Vérifier que les variables existent
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  throw new Error(
    '❌ SUPABASE_URL et SUPABASE_SERVICE_KEY doivent être définis dans .env'
  );
}

// ============================================================================
// CLIENT SUPABASE AVEC SERVICE KEY (Opérations admin)
// ============================================================================
// IMPORTANT : Service key pour contourner RLS dans opérations backend critiques
// Ex: Trigger handle_new_user, RPC functions, etc.

export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
    detectSessionInUrl: false
  },
  db: {
    schema: 'public'
  }
});

// ============================================================================
// FONCTION DE TEST CONNEXION
// ============================================================================
export async function testDatabaseConnection() {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);

    if (error) {
      console.error('❌ Erreur connexion Supabase:', error.message);
      return false;
    }

    console.log('✅ Connexion Supabase établie avec succès');
    return true;
  } catch (err) {
    console.error('❌ Erreur test connexion Supabase:', err.message);
    return false;
  }
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Exécuter une requête avec gestion d'erreur
 * @param {Function} queryFn - Fonction de requête Supabase
 * @returns {Object} { data, error }
 */
export async function executeQuery(queryFn) {
  try {
    const result = await queryFn();
    return result;
  } catch (err) {
    console.error('Erreur exécution requête:', err);
    return { data: null, error: err };
  }
}

/**
 * Exécuter une RPC function Supabase
 * @param {string} fnName - Nom de la fonction RPC
 * @param {Object} params - Paramètres de la fonction
 * @returns {Object} { data, error }
 */
export async function callRPC(fnName, params = {}) {
  try {
    const { data, error } = await supabase.rpc(fnName, params);
    
    if (error) {
      console.error(`Erreur RPC ${fnName}:`, error.message);
    }
    
    return { data, error };
  } catch (err) {
    console.error(`Erreur appel RPC ${fnName}:`, err);
    return { data: null, error: err };
  }
}

// ============================================================================
// EXPORT DEFAULT
// ============================================================================
export default supabase;