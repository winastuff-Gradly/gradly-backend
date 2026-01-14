// Fonctions utilitaires globales

/**
 * Générer un code aléatoire
 */
export const generateCode = (length = 6) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < length; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
};

/**
 * Sleep async
 */
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Formater un montant en euros
 */
export const formatPrice = (amount) => {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
  }).format(amount);
};

/**
 * Truncate string
 */
export const truncate = (str, length = 100) => {
  if (!str || str.length <= length) return str;
  return str.substring(0, length) + '...';
};

export default {
  generateCode,
  sleep,
  formatPrice,
  truncate,
};