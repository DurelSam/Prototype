/**
 * SuperUser Middleware
 *
 * Vérifie que l'utilisateur connecté a le rôle SuperUser
 * Protège toutes les routes d'administration SuperUser
 */

exports.isSuperUser = (req, res, next) => {
  try {
    // Vérifier que l'utilisateur est authentifié
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication requise'
      });
    }

    // Vérifier le rôle SuperUser
    if (req.user.role !== 'SuperUser') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé - SuperUser uniquement'
      });
    }

    // L'utilisateur est bien SuperUser, continuer
    next();
  } catch (error) {
    console.error('❌ Erreur dans superUserMiddleware:', error);
    return res.status(500).json({
      success: false,
      message: 'Erreur de vérification des permissions'
    });
  }
};
