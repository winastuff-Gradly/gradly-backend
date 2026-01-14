// utils/geoUtils.js
// Fonctions de géolocalisation et calcul de distance (CRITIQUE)

/**
 * IMPORTANTE : Formule de Haversine pour calculer la distance entre 2 points GPS
 * Utilisée pour le matching géographique niveau 1 (distance_max)
 * 
 * Tests attendus :
 * - Paris (48.8566, 2.3522) → Lyon (45.7640, 4.8357) ≈ 390 km
 * - Mâcon (46.3064, 4.8311) → Trévoux (45.9403, 4.7728) ≈ 50 km
 * - Précision ±5 km acceptable
 */

// Rayon moyen de la Terre en kilomètres
export const EARTH_RADIUS_KM = 6371;

/**
 * Convertir des degrés en radians
 * @param {number} degrees - Angle en degrés
 * @returns {number} Angle en radians
 */
export function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Calculer la distance entre deux points GPS avec la formule de Haversine
 * 
 * Formule :
 * a = sin²(Δφ/2) + cos φ1 ⋅ cos φ2 ⋅ sin²(Δλ/2)
 * c = 2 ⋅ atan2(√a, √(1−a))
 * d = R ⋅ c
 * 
 * où φ = latitude, λ = longitude, R = rayon de la Terre
 * 
 * @param {number} lat1 - Latitude du point 1 (degrés)
 * @param {number} lon1 - Longitude du point 1 (degrés)
 * @param {number} lat2 - Latitude du point 2 (degrés)
 * @param {number} lon2 - Longitude du point 2 (degrés)
 * @returns {number} Distance en kilomètres (arrondie à 2 décimales)
 */
export function haversine(lat1, lon1, lat2, lon2) {
  try {
    // Vérifier que toutes les coordonnées sont des nombres valides
    if (
      typeof lat1 !== 'number' || typeof lon1 !== 'number' ||
      typeof lat2 !== 'number' || typeof lon2 !== 'number' ||
      isNaN(lat1) || isNaN(lon1) || isNaN(lat2) || isNaN(lon2)
    ) {
      console.error('Invalid coordinates:', { lat1, lon1, lat2, lon2 });
      return null;
    }

    // Vérifier que les coordonnées sont dans les plages valides
    if (lat1 < -90 || lat1 > 90 || lat2 < -90 || lat2 > 90) {
      console.error('Latitude out of range (-90 to 90):', { lat1, lat2 });
      return null;
    }
    if (lon1 < -180 || lon1 > 180 || lon2 < -180 || lon2 > 180) {
      console.error('Longitude out of range (-180 to 180):', { lon1, lon2 });
      return null;
    }

    // Convertir les coordonnées en radians
    const φ1 = toRadians(lat1);
    const φ2 = toRadians(lat2);
    const Δφ = toRadians(lat2 - lat1);
    const Δλ = toRadians(lon2 - lon1);

    // Appliquer la formule de Haversine
    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) *
      Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const distance = EARTH_RADIUS_KM * c;

    // Arrondir à 2 décimales
    return Math.round(distance * 100) / 100;
  } catch (error) {
    console.error('Error calculating haversine distance:', error);
    return null;
  }
}

/**
 * Vérifier si deux points sont dans un rayon donné
 * @param {number} lat1 - Latitude du point 1
 * @param {number} lon1 - Longitude du point 1
 * @param {number} lat2 - Latitude du point 2
 * @param {number} lon2 - Longitude du point 2
 * @param {number} maxDistanceKm - Distance maximale en km
 * @returns {boolean} true si les points sont dans le rayon
 */
export function isWithinRadius(lat1, lon1, lat2, lon2, maxDistanceKm) {
  const distance = haversine(lat1, lon1, lat2, lon2);
  
  if (distance === null) {
    return false;
  }
  
  return distance <= maxDistanceKm;
}

/**
 * Calculer le point central (centre de gravité) d'une liste de coordonnées
 * Utile pour afficher une carte centrée sur plusieurs points
 * 
 * @param {Array<{lat: number, lon: number}>} coordinates - Liste de coordonnées
 * @returns {{lat: number, lon: number}|null} Coordonnées du centre
 */
export function getCenterPoint(coordinates) {
  try {
    if (!Array.isArray(coordinates) || coordinates.length === 0) {
      return null;
    }

    let x = 0;
    let y = 0;
    let z = 0;

    for (const coord of coordinates) {
      if (
        typeof coord.lat !== 'number' || typeof coord.lon !== 'number' ||
        isNaN(coord.lat) || isNaN(coord.lon)
      ) {
        continue;
      }

      const lat = toRadians(coord.lat);
      const lon = toRadians(coord.lon);

      x += Math.cos(lat) * Math.cos(lon);
      y += Math.cos(lat) * Math.sin(lon);
      z += Math.sin(lat);
    }

    const total = coordinates.length;
    x /= total;
    y /= total;
    z /= total;

    const centralLon = Math.atan2(y, x);
    const centralSquareRoot = Math.sqrt(x * x + y * y);
    const centralLat = Math.atan2(z, centralSquareRoot);

    return {
      lat: Math.round((centralLat * 180 / Math.PI) * 1000000) / 1000000, // 6 décimales
      lon: Math.round((centralLon * 180 / Math.PI) * 1000000) / 1000000,
    };
  } catch (error) {
    console.error('Error calculating center point:', error);
    return null;
  }
}

/**
 * Obtenir un bounding box (rectangle) autour d'un point
 * Utile pour limiter les requêtes SQL de géolocalisation
 * 
 * @param {number} lat - Latitude du centre
 * @param {number} lon - Longitude du centre
 * @param {number} radiusKm - Rayon en km
 * @returns {{minLat: number, maxLat: number, minLon: number, maxLon: number}|null}
 */
export function getBoundingBox(lat, lon, radiusKm) {
  try {
    if (
      typeof lat !== 'number' || typeof lon !== 'number' || typeof radiusKm !== 'number' ||
      isNaN(lat) || isNaN(lon) || isNaN(radiusKm)
    ) {
      return null;
    }

    // Approximation : 1 degré de latitude ≈ 111 km
    // 1 degré de longitude varie selon la latitude : cos(lat) * 111 km
    const latDelta = radiusKm / 111;
    const lonDelta = radiusKm / (111 * Math.cos(toRadians(lat)));

    return {
      minLat: lat - latDelta,
      maxLat: lat + latDelta,
      minLon: lon - lonDelta,
      maxLon: lon + lonDelta,
    };
  } catch (error) {
    console.error('Error calculating bounding box:', error);
    return null;
  }
}

/**
 * Formater une distance en texte lisible
 * @param {number} distanceKm - Distance en kilomètres
 * @returns {string} Distance formatée (ex: "12 km", "1,5 km", "850 m")
 */
export function formatDistance(distanceKm) {
  if (typeof distanceKm !== 'number' || isNaN(distanceKm)) {
    return 'Distance inconnue';
  }

  if (distanceKm < 1) {
    // Afficher en mètres si < 1 km
    const meters = Math.round(distanceKm * 1000);
    return `${meters} m`;
  }

  if (distanceKm < 10) {
    // 1 décimale si < 10 km
    return `${distanceKm.toFixed(1)} km`;
  }

  // Arrondir si >= 10 km
  return `${Math.round(distanceKm)} km`;
}

/**
 * Valider des coordonnées GPS
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {boolean} true si les coordonnées sont valides
 */
export function isValidCoordinates(lat, lon) {
  return (
    typeof lat === 'number' && typeof lon === 'number' &&
    !isNaN(lat) && !isNaN(lon) &&
    lat >= -90 && lat <= 90 &&
    lon >= -180 && lon <= 180
  );
}

/**
 * Exemples de tests pour validation
 * Ces valeurs peuvent être utilisées dans les tests unitaires
 */
export const TEST_COORDINATES = {
  paris: { lat: 48.8566, lon: 2.3522, city: 'Paris' },
  lyon: { lat: 45.7640, lon: 4.8357, city: 'Lyon' },
  macon: { lat: 46.3064, lon: 4.8311, city: 'Mâcon' },
  trevoux: { lat: 45.9403, lon: 4.7728, city: 'Trévoux' },
  marseille: { lat: 43.2965, lon: 5.3698, city: 'Marseille' },
  toulouse: { lat: 43.6047, lon: 1.4442, city: 'Toulouse' },
  
  // Distances attendues (approximatives) :
  // Paris → Lyon : ~390 km
  // Mâcon → Trévoux : ~50 km
  // Paris → Marseille : ~660 km
  // Lyon → Marseille : ~280 km
};