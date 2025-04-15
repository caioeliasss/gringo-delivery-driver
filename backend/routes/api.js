// backend/routes/api.js
const express = require("express");
const router = express.Router();
const motoboyController = require("../controllers/motoboyController");

// Motoboy routes
router.get("/motoboys", motoboyController.getMotoboys);
router.get("/motoboys/:id", motoboyController.getMotoboyById);
router.post("/motoboys", motoboyController.createMotoboy);
router.put("/motoboys/:id", motoboyController.updateMotoboy);
router.delete("/motoboys/:id", motoboyController.deleteMotoboy);
router.get(
  "/motoboys/firebase/:firebaseUid",
  motoboyController.getMotoboyByFirebaseUid
);

module.exports = router;
