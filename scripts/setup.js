/**
 * 🚀 SCRIPT SETUP - INSTALLATION COMPLÈTE GRADLY BACKEND
 * 
 * Vérifie et configure tout l'environnement backend en une commande.
 * 
 * Checklist :
 * 1. ✅ Vérifier fichier .env existe
 * 2. ✅ Vérifier variables environnement critiques
 * 3. ✅ Vérifier connexion Supabase
 * 4. ✅ Vérifier clés Stripe valides
 * 5. ✅ Seed questions (optionnel)
 * 6. ✅ Test health check
 * 
 * Usage : npm run setup
 */

import 'dotenv/config';
import { supabase } from '../config/database.js';
import Stripe from 'stripe';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 🎨 Couleurs console
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
};

/**
 * 1️⃣ Vérifier fichier .env
 */
async function checkEnvFile() {
  console.log('\n1️⃣  Vérification fichier .env...');
  
  const envPath = path.join(__dirname, '..', '.env');
  
  if (!fs.existsSync(envPath)) {
    log.error('Fichier .env manquant !');
    log.info('Copie .env.example vers .env et configure les variables.');
    return false;
  }
  
  log.success('Fichier .env existe');
  return true;
}

/**
 * 2️⃣ Vérifier variables environnement critiques
 */
async function checkEnvVariables() {
  console.log('\n2️⃣  Vérification variables environnement...');
  
  const requiredVars = [
    'PORT',
    'NODE_ENV',
    'FRONTEND_URL',
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_KEY',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'CRON_SECRET',
  ];
  
  let allPresent = true;
  
  for (const varName of requiredVars) {
    const value = process.env[varName];
    if (!value || value === 'xxx' || value.includes('your_')) {
      log.error(`${varName} : manquant ou non configuré`);
      allPresent = false;
    } else {
      // Masquer valeur sensible
      const maskedValue = value.substring(0, 10) + '...';
      log.success(`${varName} : ${maskedValue}`);
    }
  }
  
  if (!allPresent) {
    log.warning('Configure toutes les variables dans .env avant de continuer.');
    return false;
  }
  
  log.success('Toutes les variables critiques sont configurées');
  return true;
}

/**
 * 3️⃣ Vérifier connexion Supabase
 */
async function checkSupabase() {
  console.log('\n3️⃣  Vérification connexion Supabase...');
  
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .limit(1);
    
    if (error) {
      log.error(`Connexion Supabase échouée : ${error.message}`);
      log.info('Vérifie SUPABASE_URL et SUPABASE_SERVICE_KEY dans .env');
      return false;
    }
    
    log.success('Connexion Supabase OK');
    
    // Vérifier tables essentielles
    const tables = ['profiles', 'questions', 'matches', 'conversations', 'messages'];
    
    for (const table of tables) {
      const { error: tableError } = await supabase
        .from(table)
        .select('id')
        .limit(1);
      
      if (tableError) {
        log.error(`Table "${table}" manquante ou inaccessible`);
        log.info('Exécute les 3 fichiers SQL dans Supabase SQL Editor :');
        log.info('  - supabase-sql/1-database.sql');
        log.info('  - supabase-sql/2-functions.sql');
        log.info('  - supabase-sql/3-seeds.sql');
        return false;
      }
    }
    
    log.success('Toutes les tables essentielles sont présentes');
    return true;
    
  } catch (error) {
    log.error(`Erreur Supabase : ${error.message}`);
    return false;
  }
}

/**
 * 4️⃣ Vérifier clés Stripe
 */
async function checkStripe() {
  console.log('\n4️⃣  Vérification clés Stripe...');
  
  try {
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    
    // Test connexion avec liste customers (limite 1)
    await stripe.customers.list({ limit: 1 });
    
    log.success('Clés Stripe valides');
    
    // Vérifier mode (test ou live)
    const mode = process.env.STRIPE_SECRET_KEY.startsWith('sk_test_') ? 'TEST' : 'LIVE';
    log.info(`Mode Stripe : ${mode}`);
    
    if (process.env.NODE_ENV === 'production' && mode === 'TEST') {
      log.warning('⚠️  Tu es en production avec des clés Stripe TEST !');
      log.warning('   Bascule vers les clés LIVE avant de déployer.');
    }
    
    return true;
    
  } catch (error) {
    log.error(`Clés Stripe invalides : ${error.message}`);
    log.info('Vérifie STRIPE_SECRET_KEY dans .env');
    return false;
  }
}

/**
 * 5️⃣ Seed questions (optionnel)
 */
async function seedQuestions() {
  console.log('\n5️⃣  Vérification questions...');
  
  try {
    const { data: questions, error } = await supabase
      .from('questions')
      .select('question_order')
      .order('question_order', { ascending: true });
    
    if (error) {
      log.error(`Erreur récupération questions : ${error.message}`);
      return false;
    }
    
    if (!questions || questions.length === 0) {
      log.warning('Aucune question dans la base de données.');
      log.info('Exécute : npm run seed');
      return false;
    }
    
    log.success(`${questions.length} questions présentes`);
    
    // Vérifier que les 70 questions sont bien présentes (5-74)
    const expectedOrders = Array.from({ length: 70 }, (_, i) => i + 5);
    const presentOrders = questions.map(q => q.question_order);
    const missingOrders = expectedOrders.filter(o => !presentOrders.includes(o));
    
    if (missingOrders.length > 0) {
      log.warning(`Questions manquantes : ${missingOrders.join(', ')}`);
      log.info('Exécute : npm run seed');
      return false;
    }
    
    log.success('Toutes les 70 questions (5-74) sont présentes');
    return true;
    
  } catch (error) {
    log.error(`Erreur vérification questions : ${error.message}`);
    return false;
  }
}

/**
 * 6️⃣ Test health check
 */
async function testHealthCheck() {
  console.log('\n6️⃣  Test health check endpoint...');
  
  try {
    const port = process.env.PORT || 3000;
    const healthUrl = `http://localhost:${port}/api/health`;
    
    log.info(`Tentative connexion : ${healthUrl}`);
    log.warning('Le serveur doit être démarré (npm run dev) pour ce test.');
    
    const response = await fetch(healthUrl, {
      timeout: 5000,
    });
    
    if (!response.ok) {
      log.warning('Health check retourne une erreur');
      return false;
    }
    
    const data = await response.json();
    
    log.success('Health check OK');
    log.info(`Status : ${data.status}`);
    log.info(`Database : ${data.database}`);
    log.info(`Stripe : ${data.stripe}`);
    log.info(`Version : ${data.version}`);
    
    return true;
    
  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      log.warning('Serveur non démarré (normal lors du setup initial)');
      log.info('Démarre avec : npm run dev');
    } else {
      log.error(`Erreur health check : ${error.message}`);
    }
    return false;
  }
}

/**
 * 🚀 Fonction principale
 */
async function setup() {
  console.log('\n🚀 ════════════════════════════════════════════════════');
  console.log('   GRADLY V2.5 - SETUP BACKEND');
  console.log('   ════════════════════════════════════════════════════\n');
  
  const checks = [
    { name: 'Fichier .env', fn: checkEnvFile },
    { name: 'Variables environnement', fn: checkEnvVariables },
    { name: 'Connexion Supabase', fn: checkSupabase },
    { name: 'Clés Stripe', fn: checkStripe },
    { name: 'Questions (seed)', fn: seedQuestions },
    { name: 'Health check', fn: testHealthCheck },
  ];
  
  let allPassed = true;
  
  for (const check of checks) {
    const passed = await check.fn();
    if (!passed) {
      allPassed = false;
    }
  }
  
  console.log('\n════════════════════════════════════════════════════');
  
  if (allPassed) {
    log.success('✅ SETUP TERMINÉ AVEC SUCCÈS !');
    console.log('\n🎉 Ton backend Gradly est prêt à démarrer !');
    console.log('   Démarre avec : npm run dev\n');
    process.exit(0);
  } else {
    log.error('❌ SETUP INCOMPLET');
    console.log('\n⚠️  Corrige les erreurs ci-dessus avant de continuer.\n');
    process.exit(1);
  }
}

// 🚀 Exécution
setup();