import Donation from "../models/donation.model.js";
import logger from "../config/logger.js";

// GET - Obtener todas las donaciones.
export const getDonations = async (req, res) => {
  try {
    const donations = await Donation.find()
      .populate("userId")
      .populate("institutionId");

    logger.info("Donations fetched successfully");
    res.status(200).json({
      status: "success",
      payload: donations,
    });
  } catch (error) {
    logger.error("Error fetching donations:", error.message);
    res.status(500).json({ status: "error", message: "Internal server error." });
  }
};
