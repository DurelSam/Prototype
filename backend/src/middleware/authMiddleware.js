const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Middleware pour vérifier le token JWT et récupérer l'utilisateur
exports.protect = async (req, res, next) => {
  try {
    let token;

    // Vérifier si le token est dans les headers
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }

    // Vérifier si le token existe
    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Non autorisé - Token manquant",
      });
    }

    // Vérifier et décoder le token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (err) {
      if (err.name === "TokenExpiredError") {
        return res.status(401).json({
          success: false,
          message: "Token expiré. Veuillez vous reconnecter.",
        });
      }
      return res.status(401).json({
        success: false,
        message: "Non autorisé - Token invalide",
      });
    }

    // Récupérer l'utilisateur depuis la base de données
    const user = await User.findById(decoded.userId).populate('tenant_id', 'companyName');

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Utilisateur non trouvé",
      });
    }

    // Vérifier que le compte est actif
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: "Votre compte a été désactivé",
      });
    }

    // Ajouter l'utilisateur complet à la requête
    req.user = user;

    next();
  } catch (error) {
    console.error("Erreur d'authentification:", error.message);

    return res.status(500).json({
      success: false,
      message: "Erreur d'authentification",
      error: error.message,
    });
  }
};

// Alias pour authenticate (pour utiliser dans les routes)
exports.authenticate = exports.protect;

// Middleware pour vérifier les rôles
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Le rôle ${req.user.role} n'est pas autorisé à accéder à cette ressource`,
      });
    }
    next();
  };
};

// Middleware pour vérifier que l'utilisateur appartient au même tenant
exports.checkTenant = (req, res, next) => {
  // Si un tenant_id est fourni dans les paramètres ou le body
  const requestTenantId = req.params.tenantId || req.body.tenant_id;

  if (requestTenantId && requestTenantId !== req.user.tenant_id.toString()) {
    return res.status(403).json({
      success: false,
      message:
        "Accès refusé - Vous ne pouvez accéder qu'aux données de votre entreprise",
    });
  }

  next();
};
