const jwt = require('jsonwebtoken');

// Middleware pour vérifier le token JWT
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Vérifier si le token est dans les headers
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    // Vérifier si le token existe
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Non autorisé - Token manquant'
      });
    }

    // Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Ajouter les informations de l'utilisateur à la requête
    req.user = {
      userId: decoded.userId,
      tenantId: decoded.tenantId,
      role: decoded.role
    };

    next();

  } catch (error) {
    console.error('Erreur d\'authentification:', error.message);

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expiré. Veuillez vous reconnecter.'
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Non autorisé - Token invalide'
    });
  }
};

// Middleware pour vérifier les rôles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Le rôle ${req.user.role} n'est pas autorisé à accéder à cette ressource`
      });
    }
    next();
  };
};

// Middleware pour vérifier que l'utilisateur appartient au même tenant
exports.checkTenant = (req, res, next) => {
  // Si un tenant_id est fourni dans les paramètres ou le body
  const requestTenantId = req.params.tenantId || req.body.tenant_id;

  if (requestTenantId && requestTenantId !== req.user.tenantId.toString()) {
    return res.status(403).json({
      success: false,
      message: 'Accès refusé - Vous ne pouvez accéder qu\'aux données de votre entreprise'
    });
  }

  next();
};
