// utils/date.js
// Helpers pour manipulation des dates en UTC (CRITIQUE)

/**
 * IMPORTANT : Toutes les dates sont manipulées en UTC côté serveur
 * Le frontend affiche les dates en heure locale du user avec Intl.DateTimeFormat
 * 
 * Pourquoi UTC ?
 * - Évite les problèmes de fuseaux horaires
 * - Cohérence entre serveur et base de données
 * - Facilite les calculs de dates
 */

/**
 * Obtenir la date/heure actuelle en UTC (format ISO)
 * @returns {string} Date en format ISO UTC (ex: "2025-11-05T14:30:00.000Z")
 */
function nowUTC() {
  return new Date().toISOString();
}

/**
 * Obtenir uniquement la date actuelle en UTC (sans heure)
 * @returns {string} Date en format YYYY-MM-DD (ex: "2025-11-05")
 */
function todayUTC() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Convertir une date en format ISO UTC
 * @param {Date|string|number} date - Date à convertir
 * @returns {string} Date en format ISO UTC
 */
function toUTC(date) {
  try {
    if (!date) {
      return nowUTC();
    }
    
    return new Date(date).toISOString();
  } catch (error) {
    console.error('Error converting to UTC:', error);
    return nowUTC();
  }
}

/**
 * Ajouter des jours à une date
 * @param {Date|string} date - Date de départ
 * @param {number} days - Nombre de jours à ajouter
 * @returns {string} Date en format ISO UTC
 */
function addDays(date, days) {
  const d = new Date(date || Date.now());
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString();
}

/**
 * Ajouter des heures à une date
 * @param {Date|string} date - Date de départ
 * @param {number} hours - Nombre d'heures à ajouter
 * @returns {string} Date en format ISO UTC
 */
function addHours(date, hours) {
  const d = new Date(date || Date.now());
  d.setUTCHours(d.getUTCHours() + hours);
  return d.toISOString();
}

/**
 * Ajouter des minutes à une date
 * @param {Date|string} date - Date de départ
 * @param {number} minutes - Nombre de minutes à ajouter
 * @returns {string} Date en format ISO UTC
 */
function addMinutes(date, minutes) {
  const d = new Date(date || Date.now());
  d.setUTCMinutes(d.getUTCMinutes() + minutes);
  return d.toISOString();
}

/**
 * Soustraire des jours à une date
 * @param {Date|string} date - Date de départ
 * @param {number} days - Nombre de jours à soustraire
 * @returns {string} Date en format ISO UTC
 */
function subtractDays(date, days) {
  return addDays(date, -days);
}

/**
 * Vérifier si une date est dans le passé
 * @param {Date|string} date - Date à vérifier
 * @returns {boolean} true si la date est passée
 */
function isPast(date) {
  return new Date(date) < new Date();
}

/**
 * Vérifier si une date est dans le futur
 * @param {Date|string} date - Date à vérifier
 * @returns {boolean} true si la date est future
 */
function isFuture(date) {
  return new Date(date) > new Date();
}

/**
 * Calculer la différence en jours entre deux dates
 * @param {Date|string} date1 - Première date
 * @param {Date|string} date2 - Deuxième date (défaut: maintenant)
 * @returns {number} Différence en jours (absolu)
 */
function daysBetween(date1, date2 = Date.now()) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * Calculer la différence en heures entre deux dates
 * @param {Date|string} date1 - Première date
 * @param {Date|string} date2 - Deuxième date (défaut: maintenant)
 * @returns {number} Différence en heures (absolu)
 */
function hoursBetween(date1, date2 = Date.now()) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  return Math.floor(diffTime / (1000 * 60 * 60));
}

/**
 * Calculer la différence en minutes entre deux dates
 * @param {Date|string} date1 - Première date
 * @param {Date|string} date2 - Deuxième date (défaut: maintenant)
 * @returns {number} Différence en minutes (absolu)
 */
function minutesBetween(date1, date2 = Date.now()) {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2 - d1);
  return Math.floor(diffTime / (1000 * 60));
}

/**
 * Obtenir le début de la journée en UTC
 * @param {Date|string} date - Date (défaut: aujourd'hui)
 * @returns {string} Date à 00:00:00 en UTC
 */
function startOfDay(date = Date.now()) {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

/**
 * Obtenir la fin de la journée en UTC
 * @param {Date|string} date - Date (défaut: aujourd'hui)
 * @returns {string} Date à 23:59:59 en UTC
 */
function endOfDay(date = Date.now()) {
  const d = new Date(date);
  d.setUTCHours(23, 59, 59, 999);
  return d.toISOString();
}

/**
 * Obtenir le début de la semaine en UTC (lundi)
 * @param {Date|string} date - Date (défaut: aujourd'hui)
 * @returns {string} Date du lundi à 00:00:00 en UTC
 */
function startOfWeek(date = Date.now()) {
  const d = new Date(date);
  const day = d.getUTCDay();
  const diff = d.getUTCDate() - day + (day === 0 ? -6 : 1); // Lundi = 1
  d.setUTCDate(diff);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

/**
 * Obtenir le début du mois en UTC
 * @param {Date|string} date - Date (défaut: aujourd'hui)
 * @returns {string} Date du 1er du mois à 00:00:00 en UTC
 */
function startOfMonth(date = Date.now()) {
  const d = new Date(date);
  d.setUTCDate(1);
  d.setUTCHours(0, 0, 0, 0);
  return d.toISOString();
}

/**
 * Calculer l'âge à partir de la date de naissance
 * @param {Date|string} birthdate - Date de naissance
 * @returns {number} Âge en années
 */
function calculateAge(birthdate) {
  const today = new Date();
  const birth = new Date(birthdate);
  
  let age = today.getUTCFullYear() - birth.getUTCFullYear();
  const monthDiff = today.getUTCMonth() - birth.getUTCMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getUTCDate() < birth.getUTCDate())) {
    age--;
  }
  
  return age;
}

/**
 * Vérifier si une personne a au moins 18 ans
 * @param {Date|string} birthdate - Date de naissance
 * @returns {boolean} true si >= 18 ans
 */
function isAdult(birthdate) {
  return calculateAge(birthdate) >= 18;
}

/**
 * Formater une durée en texte lisible (ex: "2h 30min")
 * @param {number} minutes - Durée en minutes
 * @returns {string} Durée formatée
 */
function formatDuration(minutes) {
  if (minutes < 60) {
    return `${minutes}min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (mins === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${mins}min`;
}

/**
 * Obtenir une date relative (ex: "il y a 2 heures")
 * Note: Pour affichage frontend, utiliser Intl.RelativeTimeFormat
 * Cette fonction est utilisée pour les logs backend
 * @param {Date|string} date - Date à formater
 * @returns {string} Date relative
 */
function timeAgo(date) {
  const now = Date.now();
  const past = new Date(date).getTime();
  const diffSeconds = Math.floor((now - past) / 1000);
  
  if (diffSeconds < 60) {
    return 'à l\'instant';
  }
  
  const diffMinutes = Math.floor(diffSeconds / 60);
  if (diffMinutes < 60) {
    return `il y a ${diffMinutes}min`;
  }
  
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `il y a ${diffHours}h`;
  }
  
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) {
    return `il y a ${diffDays}j`;
  }
  
  const diffWeeks = Math.floor(diffDays / 7);
  if (diffWeeks < 4) {
    return `il y a ${diffWeeks} semaine${diffWeeks > 1 ? 's' : ''}`;
  }
  
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) {
    return `il y a ${diffMonths} mois`;
  }
  
  const diffYears = Math.floor(diffDays / 365);
  return `il y a ${diffYears} an${diffYears > 1 ? 's' : ''}`;
}

export {
  // Dates actuelles
  nowUTC,
  todayUTC,
  toUTC,
  
  // Manipulation dates
  addDays,
  addHours,
  addMinutes,
  subtractDays,
  
  // Vérifications
  isPast,
  isFuture,
  
  // Calculs de différence
  daysBetween,
  hoursBetween,
  minutesBetween,
  
  // Début/fin périodes
  startOfDay,
  endOfDay,
  startOfWeek,
  startOfMonth,
  
  // Âge
  calculateAge,
  isAdult,
  
  // Formatage
  formatDuration,
  timeAgo,
};