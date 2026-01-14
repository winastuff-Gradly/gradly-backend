// config/supabase.js
// Configuration du client Supabase

import { createClient } from '@supabase/supabase-js';

// Vérifier que les variables d'environnement sont présentes
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  throw new Error('SUPABASE_URL et SUPABASE_SERVICE_KEY doivent être définis dans .env');
}

// Créer le client Supabase avec la clé service (backend)
export const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

export default supabase;