// backend/server.js
const express = require("express");
const cors = require("cors");
const admin = require("firebase-admin");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const apiRoutes = require("./routes/api");

// Carregar variáveis de ambiente
dotenv.config();

// Inicializar o app Express
const app = express();

// Inicializar o Firebase Admin SDK
// Nota: Você precisará criar e baixar a serviceAccountKey.json do console do Firebase
// admin.initializeApp({
//   credential: admin.credential.cert(require('./config/serviceAccountKey.json'))
// });

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Conectar ao MongoDB
connectDB();

// Rotas
app.use("/api", apiRoutes);

// Rota de teste
app.get("/", (req, res) => {
  res.json({ message: "API Gringo Delivery funcionando!" });
});

// Porta
const PORT = process.env.PORT || 8080;

// Iniciar o servidor
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});

// Lidar com erros não tratados
process.on("unhandledRejection", (err) => {
  console.log(`Erro: ${err.message}`);
  // Fechar o servidor e sair
  // server.close(() => process.exit(1));
});
