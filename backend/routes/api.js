// backend/routes/api.js
const express = require("express");
const router = express.Router();
const motoboyController = require("../controllers/motoboyController");
const authMiddleware = require("../middleware/auth"); // Importe o middleware

// Motoboy routes
router.get("/motoboys", authMiddleware, motoboyController.getMotoboys);
router.get("/motoboys/me", authMiddleware, motoboyController.getMotoboyMe);
router.get("/motoboys/:id", motoboyController.getMotoboyById);
router.post("/motoboys", motoboyController.createMotoboy);
router.put("/motoboys", authMiddleware, motoboyController.updateMotoboy);
router.delete("/motoboys/:id", authMiddleware, motoboyController.deleteMotoboy);
router.get(
  "/motoboys/firebase/:firebaseUid",
  motoboyController.getMotoboyByFirebaseUid
);

module.exports = router;
