// Service d'envoi d'emails
// Utilise l'API email configurée (Resend, SendGrid, etc.)

import logger from '../config/logger.js';

/**
 * Envoyer un email de bienvenue après inscription
 * @param {string} email - Email du destinataire
 * @param {string} firstName - Prénom de l'utilisateur
 */
export const sendWelcomeEmail = async (email, firstName) => {
  try {
    logger.info(`📧 Envoi email bienvenue à ${email}`);
    
    // TODO: Implémenter avec votre provider email
    // Exemple avec Resend:
    // const { data, error } = await resend.emails.send({
    //   from: process.env.EMAIL_FROM,
    //   to: email,
    //   subject: '🎯 Bienvenue sur Gradly !',
    //   html: `<h1>Bienvenue ${firstName} !</h1><p>Trouve ton match parfait 💘</p>`,
    // });

    logger.info(`✅ Email bienvenue envoyé à ${email}`);
    return { success: true };
  } catch (err) {
    logger.error(`❌ Erreur envoi email à ${email}:`, err);
    return { success: false, error: err.message };
  }
};

/**
 * Envoyer un email de notification de nouveau match
 */
export const sendMatchNotification = async (email, firstName) => {
  try {
    logger.info(`📧 Envoi notification match à ${email}`);
    
    // TODO: Implémenter
    
    return { success: true };
  } catch (err) {
    logger.error('Erreur envoi notification match:', err);
    return { success: false, error: err.message };
  }
};

/**
 * Envoyer un email de confirmation d'achat
 */
export const sendPurchaseConfirmation = async (email, creditsAmount) => {
  try {
    logger.info(`📧 Envoi confirmation achat à ${email} (${creditsAmount} crédits)`);
    
    // TODO: Implémenter
    
    return { success: true };
  } catch (err) {
    logger.error('Erreur envoi confirmation achat:', err);
    return { success: false, error: err.message };
  }
};

export default {
  sendWelcomeEmail,
  sendMatchNotification,
  sendPurchaseConfirmation,
};