/**
 * 🌱 SCRIPT SEED - INSERT 70 QUESTIONS
 * 
 * Insère les 70 questions de compatibilité dans la base de données.
 * Les 4 premières questions (q1-q4) sont posées à l'inscription.
 * Les 70 autres sont débloquées par paliers (10 par palier).
 * 
 * Usage : npm run seed
 */

import 'dotenv/config';
import { supabase } from '../config/database.js';

// 🎯 70 QUESTIONS DE COMPATIBILITÉ (order 5 à 74)
const QUESTIONS = [
  // PALIER 1 (Questions 5-14)
  { question_order: 5, question_text: "Tu aimes les animaux de compagnie ?", category: "lifestyle", palier: 1 },
  { question_order: 6, question_text: "Tu es plutôt introverti ou extraverti ?", category: "personality", palier: 1 },
  { question_order: 7, question_text: "Tu crois à l'astrologie ?", category: "beliefs", palier: 1 },
  { question_order: 8, question_text: "Tu préfères les sorties calmes ou animées ?", category: "lifestyle", palier: 1 },
  { question_order: 9, question_text: "Tu es plutôt manuel ou intellectuel ?", category: "personality", palier: 1 },
  { question_order: 10, question_text: "Tu aimes voyager régulièrement ?", category: "lifestyle", palier: 1 },
  { question_order: 11, question_text: "Tu es à l'aise en public ?", category: "personality", palier: 1 },
  { question_order: 12, question_text: "Tu regardes souvent des séries/films ?", category: "hobbies", palier: 1 },
  { question_order: 13, question_text: "Tu fais du sport régulièrement ?", category: "lifestyle", palier: 1 },
  { question_order: 14, question_text: "Tu es plutôt organisé ou spontané ?", category: "personality", palier: 1 },

  // PALIER 2 (Questions 15-24)
  { question_order: 15, question_text: "Tu es végétarien ou végan ?", category: "lifestyle", palier: 2 },
  { question_order: 16, question_text: "Tu aimes cuisiner ?", category: "hobbies", palier: 2 },
  { question_order: 17, question_text: "Tu es plutôt économe ou dépensier ?", category: "values", palier: 2 },
  { question_order: 18, question_text: "Tu veux des enfants un jour ?", category: "future", palier: 2 },
  { question_order: 19, question_text: "Tu es croyant ou athée ?", category: "beliefs", palier: 2 },
  { question_order: 20, question_text: "Tu aimes la lecture ?", category: "hobbies", palier: 2 },
  { question_order: 21, question_text: "Tu es plutôt montagne ou mer ?", category: "lifestyle", palier: 2 },
  { question_order: 22, question_text: "Tu aimes la musique live (concerts) ?", category: "hobbies", palier: 2 },
  { question_order: 23, question_text: "Tu es engagé politiquement ?", category: "values", palier: 2 },
  { question_order: 24, question_text: "Tu es jaloux en couple ?", category: "relationship", palier: 2 },

  // PALIER 3 (Questions 25-34)
  { question_order: 25, question_text: "Tu es plutôt romantique ou pragmatique ?", category: "relationship", palier: 3 },
  { question_order: 26, question_text: "Tu aimes les soirées entre amis ?", category: "social", palier: 3 },
  { question_order: 27, question_text: "Tu te considères comme ambitieux ?", category: "values", palier: 3 },
  { question_order: 28, question_text: "Tu es sensible aux critiques ?", category: "personality", palier: 3 },
  { question_order: 29, question_text: "Tu aimes les jeux vidéo ?", category: "hobbies", palier: 3 },
  { question_order: 30, question_text: "Tu es plutôt indépendant ou fusionnel en couple ?", category: "relationship", palier: 3 },
  { question_order: 31, question_text: "Tu aimes prendre des risques ?", category: "personality", palier: 3 },
  { question_order: 32, question_text: "Tu es plutôt écolo ?", category: "values", palier: 3 },
  { question_order: 33, question_text: "Tu aimes les discussions profondes ?", category: "social", palier: 3 },
  { question_order: 34, question_text: "Tu es rancunier ?", category: "personality", palier: 3 },

  // PALIER 4 (Questions 35-44)
  { question_order: 35, question_text: "Tu pardonnes facilement ?", category: "personality", palier: 4 },
  { question_order: 36, question_text: "Tu es plutôt optimiste ou pessimiste ?", category: "personality", palier: 4 },
  { question_order: 37, question_text: "Tu aimes les surprises ?", category: "personality", palier: 4 },
  { question_order: 38, question_text: "Tu es à l'aise avec l'affection physique ?", category: "relationship", palier: 4 },
  { question_order: 39, question_text: "Tu as besoin de temps seul régulièrement ?", category: "personality", palier: 4 },
  { question_order: 40, question_text: "Tu es plutôt maternel/paternel ?", category: "future", palier: 4 },
  { question_order: 41, question_text: "Tu aimes les débats d'idées ?", category: "social", palier: 4 },
  { question_order: 42, question_text: "Tu es plutôt économie ou écologie ?", category: "values", palier: 4 },
  { question_order: 43, question_text: "Tu crois au coup de foudre ?", category: "beliefs", palier: 4 },
  { question_order: 44, question_text: "Tu es plutôt fidèle ou libre ?", category: "relationship", palier: 4 },

  // PALIER 5 (Questions 45-54)
  { question_order: 45, question_text: "Tu aimes les festivals ?", category: "hobbies", palier: 5 },
  { question_order: 46, question_text: "Tu es plutôt nuit ou jour ?", category: "lifestyle", palier: 5 },
  { question_order: 47, question_text: "Tu aimes les activités créatives ?", category: "hobbies", palier: 5 },
  { question_order: 48, question_text: "Tu es plutôt famille ou amis ?", category: "social", palier: 5 },
  { question_order: 49, question_text: "Tu parles facilement de tes émotions ?", category: "personality", palier: 5 },
  { question_order: 50, question_text: "Tu es plutôt thé ou café ?", category: "lifestyle", palier: 5 },
  { question_order: 51, question_text: "Tu aimes danser ?", category: "hobbies", palier: 5 },
  { question_order: 52, question_text: "Tu es plutôt casanier ou aventurier ?", category: "lifestyle", palier: 5 },
  { question_order: 53, question_text: "Tu crois au destin ?", category: "beliefs", palier: 5 },
  { question_order: 54, question_text: "Tu es plutôt réaliste ou rêveur ?", category: "personality", palier: 5 },

  // PALIER 6 (Questions 55-64)
  { question_order: 55, question_text: "Tu aimes les animaux sauvages ?", category: "lifestyle", palier: 6 },
  { question_order: 56, question_text: "Tu es plutôt minimaliste ou collectionneur ?", category: "lifestyle", palier: 6 },
  { question_order: 57, question_text: "Tu aimes les musées et expositions ?", category: "hobbies", palier: 6 },
  { question_order: 58, question_text: "Tu es plutôt logique ou émotionnel ?", category: "personality", palier: 6 },
  { question_order: 59, question_text: "Tu aimes les traditions familiales ?", category: "values", palier: 6 },
  { question_order: 60, question_text: "Tu es plutôt prudent ou impulsif ?", category: "personality", palier: 6 },
  { question_order: 61, question_text: "Tu aimes les discussions politiques ?", category: "social", palier: 6 },
  { question_order: 62, question_text: "Tu es plutôt leader ou suiveur ?", category: "personality", palier: 6 },
  { question_order: 63, question_text: "Tu aimes les challenges ?", category: "personality", palier: 6 },
  { question_order: 64, question_text: "Tu es plutôt confiant ou méfiant ?", category: "personality", palier: 6 },

  // PALIER 7 (Questions 65-74)
  { question_order: 65, question_text: "Tu aimes les soirées tranquilles à la maison ?", category: "lifestyle", palier: 7 },
  { question_order: 66, question_text: "Tu es plutôt généreux ou raisonnable ?", category: "values", palier: 7 },
  { question_order: 67, question_text: "Tu aimes les discussions philosophiques ?", category: "social", palier: 7 },
  { question_order: 68, question_text: "Tu es plutôt patient ou impatient ?", category: "personality", palier: 7 },
  { question_order: 69, question_text: "Tu aimes apprendre de nouvelles choses ?", category: "personality", palier: 7 },
  { question_order: 70, question_text: "Tu es plutôt strict ou flexible ?", category: "values", palier: 7 },
  { question_order: 71, question_text: "Tu aimes les comédies ou les drames ?", category: "hobbies", palier: 7 },
  { question_order: 72, question_text: "Tu es plutôt ordre ou chaos ?", category: "lifestyle", palier: 7 },
  { question_order: 73, question_text: "Tu aimes les activités en plein air ?", category: "hobbies", palier: 7 },
  { question_order: 74, question_text: "Tu es plutôt présent ou tourné vers l'avenir ?", category: "personality", palier: 7 },
];

/**
 * 🌱 Fonction principale de seeding
 */
async function seed() {
  try {
    console.log('🌱 Démarrage du seeding...\n');

    // 1. Vérifier connexion Supabase
    const { data: testConnection, error: connectionError } = await supabase
      .from('questions')
      .select('id')
      .limit(1);

    if (connectionError) {
      throw new Error(`Connexion Supabase échouée : ${connectionError.message}`);
    }

    console.log('✅ Connexion Supabase OK\n');

    // 2. Vérifier si des questions existent déjà
    const { data: existingQuestions, error: checkError } = await supabase
      .from('questions')
      .select('question_order')
      .order('question_order', { ascending: true });

    if (checkError) {
      throw new Error(`Erreur vérification questions : ${checkError.message}`);
    }

    if (existingQuestions && existingQuestions.length > 0) {
      console.log(`⚠️  ${existingQuestions.length} questions déjà présentes dans la base.`);
      console.log('   Questions existantes :', existingQuestions.map(q => q.question_order).join(', '));
      
      const readline = require('readline').createInterface({
        input: process.stdin,
        output: process.stdout
      });

      await new Promise((resolve) => {
        readline.question('\n   Supprimer et réinsérer ? (y/N) : ', (answer) => {
          readline.close();
          if (answer.toLowerCase() !== 'y') {
            console.log('❌ Seeding annulé.');
            process.exit(0);
          }
          resolve();
        });
      });

      // Supprimer toutes les questions existantes
      const { error: deleteError } = await supabase
        .from('questions')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

      if (deleteError) {
        throw new Error(`Erreur suppression questions : ${deleteError.message}`);
      }

      console.log('🗑️  Questions existantes supprimées.\n');
    }

    // 3. Insérer les 70 questions
    console.log('📝 Insertion de 70 questions...\n');

    const { data, error } = await supabase
      .from('questions')
      .insert(QUESTIONS)
      .select();

    if (error) {
      throw new Error(`Erreur insertion questions : ${error.message}`);
    }

    console.log(`✅ ${data.length} questions insérées avec succès !\n`);

    // 4. Afficher statistiques
    const palierCount = QUESTIONS.reduce((acc, q) => {
      acc[q.palier] = (acc[q.palier] || 0) + 1;
      return acc;
    }, {});

    console.log('📊 Statistiques par palier :');
    Object.keys(palierCount).sort().forEach(palier => {
      console.log(`   Palier ${palier} : ${palierCount[palier]} questions`);
    });

    console.log('\n🎉 Seeding terminé avec succès !');
    process.exit(0);

  } catch (error) {
    console.error('\n❌ Erreur lors du seeding :', error.message);
    process.exit(1);
  }
}

// 🚀 Exécution
seed();