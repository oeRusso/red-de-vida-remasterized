import express from "express";
import { getDonations } from "../controllers/donation.controller.js";

const router = express.Router();

// GET
router.get("/donations", getDonations);

export default router;
