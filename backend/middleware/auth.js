// backend/middleware/auth.js
const admin = require("firebase-admin");

// Middleware para verificar o token JWT do Firebase
const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res
        .status(401)
        .json({ message: "Acesso não autorizado. Token não fornecido." });
    }

    const token = authHeader.split(" ")[1];

    // Verifica o token com o Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(token);

    // Adiciona o usuário decodificado ao objeto de requisição
    req.user = decodedToken;
    next();
  } catch (error) {
    console.error("Erro de autenticação:", error);
    res.status(401).json({ message: "Acesso não autorizado. Token inválido." });
  }
};

module.exports = authMiddleware;
