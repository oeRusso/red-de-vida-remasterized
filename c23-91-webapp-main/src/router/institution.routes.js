import express from "express";
import {
  getInstitutions,
  getInstitutionAppointments,
  createInstitution,
  updateInstitution,
  deleteInstitution,
} from "../controllers/institution.controller.js";

const router = express.Router();

// GET
router.get("/institutions", getInstitutions);
router.get("/institutions/:id/appointments", getInstitutionAppointments);

// POST
router.post("/institutions", createInstitution);

// UPDATE
router.put("/institutions/:id", updateInstitution);

// DELETE
router.delete("/institutions/:id", deleteInstitution);

export default router;
