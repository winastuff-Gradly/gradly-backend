/**
 * 🔄 SCRIPT RECONCILE - LIBÉRATION USERS BLOQUÉS
 * 
 * Cron job quotidien (3h du matin) qui libère les users avec in_conversation=true
 * mais sans conversation active (bug, crash, erreur).
 * 
 * Appelle l'endpoint protégé : POST /api/internal/reconcile
 * Avec le header X-Cron-Secret pour sécurité.
 * 
 * Usage manuel : npm run reconcile
 * Cron automatique : Configurer sur Railway, cron-job.org, etc.
 */

import 'dotenv/config';
import fetch from 'node-fetch';

// ⚙️ CONFIGURATION
const API_URL = process.env.API_URL || 'http://localhost:3000';
const CRON_SECRET = process.env.CRON_SECRET;

if (!CRON_SECRET) {
  console.error('❌ Variable CRON_SECRET manquante dans .env');
  console.error('   Ajoute : CRON_SECRET=your_very_long_random_secret_here_min_32_chars');
  process.exit(1);
}

/**
 * 🔄 Fonction principale de réconciliation
 */
async function reconcile() {
  try {
    console.log('🔄 Démarrage de la réconciliation...');
    console.log(`📍 API URL : ${API_URL}/api/internal/reconcile\n`);

    const response = await fetch(`${API_URL}/api/internal/reconcile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Cron-Secret': CRON_SECRET,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erreur ${response.status} : ${errorText}`);
    }

    const data = await response.json();

    console.log('✅ Réconciliation réussie !');
    console.log(`📊 Résultats :`);
    console.log(`   - Users libérés : ${data.users_freed || 0}`);
    console.log(`   - Timestamp : ${data.timestamp}`);

    if (data.users_freed === 0) {
      console.log('   ℹ️  Aucun user bloqué à libérer.');
    } else {
      console.log(`   ✅ ${data.users_freed} user(s) ont été libérés.`);
    }

    console.log('\n🎉 Réconciliation terminée avec succès !');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Erreur lors de la réconciliation :');
    console.error(error.message);
    
    // Détails pour debug
    if (error.message.includes('403')) {
      console.error('\n🔒 Erreur 403 : Secret invalide ou endpoint non protégé correctement.');
      console.error('   Vérifie que CRON_SECRET correspond entre .env et le header.');
    } else if (error.message.includes('ECONNREFUSED')) {
      console.error('\n🔌 Erreur connexion : Backend non accessible.');
      console.error(`   Vérifie que ${API_URL} est bien démarré.`);
    }

    process.exit(1);
  }
}

// 🚀 Exécution
reconcile();