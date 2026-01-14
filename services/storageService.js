// ⭐⭐⭐ CRITIQUE : Service storage avec cleanup automatique
// Supprime TOUTES les anciennes photos avant d'uploader une nouvelle

import { supabase } from '../config/database.js';
import logger from '../config/logger.js';

/**
 * ⭐⭐⭐ Upload d'une photo avec cleanup automatique
 * 1. Lister tous les fichiers du user
 * 2. Supprimer TOUS les fichiers existants
 * 3. Upload nouvelle photo
 * 4. Retourner photo_path
 */
export const uploadPhoto = async (userId, file) => {
  try {
    const bucketName = 'avatars';
    const userFolder = `avatars/${userId}`;
    
    // 1. Lister tous les fichiers existants
    const { data: existingFiles, error: listError } = await supabase
      .storage
      .from(bucketName)
      .list(userId);

    if (listError) {
      logger.error('Erreur liste fichiers:', listError);
    }

    // 2. Supprimer TOUS les fichiers existants
    if (existingFiles && existingFiles.length > 0) {
      const filesToDelete = existingFiles.map(f => `${userId}/${f.name}`);
      
      const { error: deleteError } = await supabase
        .storage
        .from(bucketName)
        .remove(filesToDelete);

      if (deleteError) {
        logger.error('Erreur suppression fichiers:', deleteError);
      } else {
        logger.info(`🗑️ ${filesToDelete.length} ancien(s) fichier(s) supprimé(s) pour user ${userId}`);
      }
    }

    // 3. Upload nouvelle photo
    const fileName = `${userId}/avatar-${Date.now()}.${file.mimetype.split('/')[1]}`;
    
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from(bucketName)
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });

    if (uploadError) {
      logger.error('Erreur upload photo:', uploadError);
      throw uploadError;
    }

    // 4. Retourner le path
    const photoPath = uploadData.path;
    logger.info(`✅ Photo uploadée: ${photoPath}`);

    return photoPath;
  } catch (err) {
    logger.error('Erreur uploadPhoto:', err);
    throw err;
  }
};

/**
 * ⭐⭐⭐ Obtenir une URL signée pour accéder à une photo
 * Expiration : 3600s (1 heure)
 */
export const getSignedUrl = async (photoPath) => {
  try {
    if (!photoPath) return null;

    const { data, error } = await supabase
      .storage
      .from('avatars')
      .createSignedUrl(photoPath, 3600); // 1 heure

    if (error) {
      logger.error('Erreur création URL signée:', error);
      throw error;
    }

    return data.signedUrl;
  } catch (err) {
    logger.error('Erreur getSignedUrl:', err);
    return null;
  }
};

/**
 * Supprimer une photo spécifique
 */
export const deletePhoto = async (photoPath) => {
  try {
    const { error } = await supabase
      .storage
      .from('avatars')
      .remove([photoPath]);

    if (error) {
      logger.error('Erreur suppression photo:', error);
      throw error;
    }

    logger.info(`🗑️ Photo supprimée: ${photoPath}`);
    return true;
  } catch (err) {
    logger.error('Erreur deletePhoto:', err);
    return false;
  }
};

export default {
  uploadPhoto,
  getSignedUrl,
  deletePhoto,
};