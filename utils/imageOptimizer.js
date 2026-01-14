// utils/imageOptimizer.js
// Compression et optimisation des images (backend)

/**
 * IMPORTANT : Compression des images côté backend
 * - Taille maximale : 8 Mo (validation stricte)
 * - Dimensions maximales : 2560px côté le plus long
 * - Formats acceptés : jpg, png, webp
 * - Qualité : 85% (bon compromis qualité/poids)
 * 
 * Note : Le frontend fait aussi une compression avant upload,
 * mais le backend doit valider et re-compresser si nécessaire
 */

import sharp from 'sharp';
import { errorMessages } from './errorMessages.js';

// Configuration
const MAX_FILE_SIZE_MB = 8; // 8 Mo maximum
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const MAX_DIMENSION_PX = 2560; // Largeur ou hauteur max
const JPEG_QUALITY = 85; // Qualité JPEG (0-100)
const PNG_QUALITY = 85; // Qualité PNG (0-100)
const WEBP_QUALITY = 85; // Qualité WebP (0-100)

// Formats acceptés
const ALLOWED_FORMATS = ['jpg', 'jpeg', 'png', 'webp'];
const ALLOWED_MIMETYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
];

/**
 * Valider le format d'une image
 * @param {string} mimetype - Type MIME du fichier
 * @returns {boolean} true si le format est accepté
 */
function isValidImageFormat(mimetype) {
  return ALLOWED_MIMETYPES.includes(mimetype.toLowerCase());
}

/**
 * Valider la taille d'une image
 * @param {number} sizeBytes - Taille en octets
 * @returns {boolean} true si la taille est acceptée
 */
function isValidImageSize(sizeBytes) {
  return sizeBytes <= MAX_FILE_SIZE_BYTES;
}

/**
 * Obtenir l'extension à partir du mimetype
 * @param {string} mimetype - Type MIME
 * @returns {string} Extension (ex: 'jpg', 'png')
 */
function getExtensionFromMimetype(mimetype) {
  const map = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/webp': 'webp',
  };
  return map[mimetype.toLowerCase()] || 'jpg';
}

/**
 * Optimiser une image (compression + redimensionnement)
 * 
 * @param {Buffer} buffer - Buffer de l'image originale
 * @param {Object} options - Options d'optimisation
 * @param {string} options.format - Format de sortie ('jpg', 'png', 'webp')
 * @param {number} options.maxDimension - Dimension max (défaut: 2560)
 * @param {number} options.quality - Qualité (défaut: 85)
 * @returns {Promise<Buffer>} Buffer de l'image optimisée
 */
async function optimizeImage(buffer, options = {}) {
  try {
    const {
      format = 'jpg',
      maxDimension = MAX_DIMENSION_PX,
      quality = JPEG_QUALITY,
    } = options;

    // Créer l'instance Sharp
    let image = sharp(buffer);

    // Obtenir les métadonnées de l'image
    const metadata = await image.metadata();
    
    // Calculer les nouvelles dimensions si nécessaire
    let width = metadata.width;
    let height = metadata.height;

    if (width > maxDimension || height > maxDimension) {
      // Redimensionner en conservant le ratio
      if (width > height) {
        // Paysage ou carré
        width = maxDimension;
        height = Math.round((metadata.height / metadata.width) * maxDimension);
      } else {
        // Portrait
        height = maxDimension;
        width = Math.round((metadata.width / metadata.height) * maxDimension);
      }

      image = image.resize(width, height, {
        fit: 'inside',
        withoutEnlargement: true,
      });
    }

    // Rotation automatique basée sur les métadonnées EXIF
    image = image.rotate();

    // Appliquer le format et la qualité
    switch (format.toLowerCase()) {
      case 'jpg':
      case 'jpeg':
        image = image.jpeg({
          quality,
          progressive: true, // JPEG progressif (meilleure compression)
          mozjpeg: true, // Utiliser mozjpeg pour meilleure compression
        });
        break;

      case 'png':
        image = image.png({
          quality,
          compressionLevel: 9, // Compression max
          progressive: true,
        });
        break;

      case 'webp':
        image = image.webp({
          quality,
          effort: 6, // Effort de compression (0-6, 6 = max)
        });
        break;

      default:
        // Format par défaut : JPEG
        image = image.jpeg({ quality, progressive: true, mozjpeg: true });
    }

    // Convertir en buffer
    const optimizedBuffer = await image.toBuffer();

    return optimizedBuffer;
  } catch (error) {
    console.error('Error optimizing image:', error);
    throw new Error('Erreur lors de l\'optimisation de l\'image');
  }
}

/**
 * Valider et optimiser une image uploadée
 * 
 * @param {Buffer} buffer - Buffer de l'image
 * @param {string} mimetype - Type MIME du fichier
 * @param {number} size - Taille en octets
 * @returns {Promise<{buffer: Buffer, format: string}>} Image optimisée
 * @throws {Error} Si validation échoue
 */
async function validateAndOptimizeImage(buffer, mimetype, size) {
  try {
    // 1. Vérifier le format
    if (!isValidImageFormat(mimetype)) {
      throw new Error(errorMessages.storage.invalidFileType);
    }

    // 2. Vérifier la taille
    if (!isValidImageSize(size)) {
      throw new Error(errorMessages.storage.fileTooLarge);
    }

    // 3. Obtenir le format de sortie
    const format = getExtensionFromMimetype(mimetype);

    // 4. Optimiser l'image
    const optimizedBuffer = await optimizeImage(buffer, { format });

    // 5. Vérifier que l'image optimisée ne dépasse pas la limite
    if (optimizedBuffer.length > MAX_FILE_SIZE_BYTES) {
      // Si toujours trop grande, réduire la qualité
      const reducedBuffer = await optimizeImage(buffer, {
        format,
        quality: 70, // Qualité réduite
        maxDimension: 1920, // Dimension réduite
      });

      if (reducedBuffer.length > MAX_FILE_SIZE_BYTES) {
        throw new Error(errorMessages.storage.fileTooLarge);
      }

      return {
        buffer: reducedBuffer,
        format,
      };
    }

    return {
      buffer: optimizedBuffer,
      format,
    };
  } catch (error) {
    console.error('Error validating and optimizing image:', error);
    throw error;
  }
}

/**
 * Obtenir les informations d'une image
 * @param {Buffer} buffer - Buffer de l'image
 * @returns {Promise<Object>} Métadonnées de l'image
 */
async function getImageInfo(buffer) {
  try {
    const metadata = await sharp(buffer).metadata();
    
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: metadata.size,
      hasAlpha: metadata.hasAlpha,
      orientation: metadata.orientation,
    };
  } catch (error) {
    console.error('Error getting image info:', error);
    return null;
  }
}

/**
 * Créer une miniature (thumbnail)
 * @param {Buffer} buffer - Buffer de l'image originale
 * @param {number} size - Taille de la miniature (côté du carré)
 * @returns {Promise<Buffer>} Buffer de la miniature
 */
async function createThumbnail(buffer, size = 200) {
  try {
    const thumbnail = await sharp(buffer)
      .resize(size, size, {
        fit: 'cover', // Recadrer pour remplir le carré
        position: 'center',
      })
      .jpeg({ quality: 80 })
      .toBuffer();

    return thumbnail;
  } catch (error) {
    console.error('Error creating thumbnail:', error);
    throw new Error('Erreur lors de la création de la miniature');
  }
}

/**
 * Convertir une image en format spécifique
 * @param {Buffer} buffer - Buffer de l'image originale
 * @param {string} format - Format de sortie ('jpg', 'png', 'webp')
 * @returns {Promise<Buffer>} Buffer de l'image convertie
 */
async function convertImageFormat(buffer, format) {
  try {
    let image = sharp(buffer);

    switch (format.toLowerCase()) {
      case 'jpg':
      case 'jpeg':
        image = image.jpeg({ quality: JPEG_QUALITY, progressive: true });
        break;
      case 'png':
        image = image.png({ quality: PNG_QUALITY });
        break;
      case 'webp':
        image = image.webp({ quality: WEBP_QUALITY });
        break;
      default:
        throw new Error(`Format non supporté: ${format}`);
    }

    return await image.toBuffer();
  } catch (error) {
    console.error('Error converting image format:', error);
    throw new Error('Erreur lors de la conversion de format');
  }
}

export {
  // Fonctions principales
  validateAndOptimizeImage,
  optimizeImage,
  
  // Fonctions utilitaires
  isValidImageFormat,
  isValidImageSize,
  getExtensionFromMimetype,
  getImageInfo,
  createThumbnail,
  convertImageFormat,
  
  // Constantes
  MAX_FILE_SIZE_MB,
  MAX_FILE_SIZE_BYTES,
  MAX_DIMENSION_PX,
  JPEG_QUALITY,
  ALLOWED_FORMATS,
  ALLOWED_MIMETYPES,
};