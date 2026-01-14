// ⭐ IMPORTANT : Wrapper pour les fonctions asynchrones
// Évite de répéter try/catch dans chaque route

/**
 * Wrapper pour les routes asynchrones
 * Attrape automatiquement les erreurs et les passe au middleware errorHandler
 * 
 * Utilisation:
 * router.get('/route', catchAsync(async (req, res) => {
 *   const data = await someAsyncFunction();
 *   res.json(data);
 * }));
 * 
 * Sans catchAsync, il faudrait:
 * router.get('/route', async (req, res, next) => {
 *   try {
 *     const data = await someAsyncFunction();
 *     res.json(data);
 *   } catch (err) {
 *     next(err);
 *   }
 * });
 * 
 * @param {Function} fn - Fonction asynchrone de la route
 * @returns {Function} - Middleware Express avec gestion d'erreur
 */
export const catchAsync = (fn) => {
  return (req, res, next) => {
    // Exécuter la fonction et attraper les erreurs
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export default catchAsync;