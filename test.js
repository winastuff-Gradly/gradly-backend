// test.js
console.log('🔍 Test 1: Début du script');

try {
  console.log('🔍 Test 2: Import dotenv...');
  import('dotenv/config').then(() => {
    console.log('✅ dotenv OK');
  }).catch(err => {
    console.error('❌ dotenv ERROR:', err.message);
  });
} catch (err) {
  console.error('❌ Erreur import dotenv:', err.message);
}

console.log('🔍 Test 3: Fin du script');