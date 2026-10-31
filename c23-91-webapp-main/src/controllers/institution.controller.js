import Institution from "../models/institution.model.js";
import logger from "../config/logger.js";

// GET - Obtener instituciones.
export const getInstitutions = async (req, res) => {
  try {
    const institutions = await Institution.find()
      .populate("donations")
      .populate("appointments");

    logger.info("Institutions fetched successfully");
    res.status(200).json({
      status: "success",
      payload: institutions,
    });
  } catch (error) {
    logger.error("Error fetching institutions:", error.message);
    res.status(500).json({ status: "error", message: "Internal server error." });
  }
};

// GET - Obtener citas de una institución por ID.
export const getInstitutionAppointments = async (req, res) => {
  try {
    const { id } = req.params;

    const institution = await Institution.findById(id).populate("appointments");

    if (!institution) {
      logger.warn(`Institution not found with ID: ${id}`);
      return res.status(404).json({
        status: "error",
        message: "Institution not found.",
      });
    }

    logger.info(`Institution appointments fetched successfully: ${institution.name}`);
    res.status(200).json({
      status: "success",
      message: "Institution appointments fetched successfully.",
      payload: {
        institutionId: institution._id,
        operatingHours: institution.operatingHours,
        appointments: institution.appointments,
      },
    });
  } catch (error) {
    logger.error("Error fetching institution appointments:", error.message);
    res.status(500).json({ status: "error", message: "Internal server error." });
  }
};

// POST - Crear una nueva institución.
export const createInstitution = async (req, res) => {
  try {
    const { email } = req.body;

    const existingInstitution = await Institution.findOne({ email });
    if (existingInstitution) {
      logger.warn(`Duplicate email: ${email}`);
      return res.status(409).json({ status: "error", message: "Email already registered." });
    }

    const newInstitution = new Institution(req.body);
    const savedInstitution = await newInstitution.save();

    logger.info(`Institution created successfully: ${savedInstitution.name}`);

    res.status(201).json({
      status: "success",
      message: "Institution created successfully.",
      payload: savedInstitution,
    });
  } catch (error) {
    if (error.code === 11000) {
      logger.warn(`Duplicate key error: ${error.message}`);
      return res.status(409).json({ status: "error", message: "Duplicate key error." });
    }

    logger.error("Error creating institution:", error.message);
    res.status(500).json({ status: "error", message: "Internal server error." });
  }
};

// UPDATE - Actualizar institución por ID.
export const updateInstitution = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedInstitution = await Institution.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!updatedInstitution) {
      logger.warn(`Institution not found with ID: ${id}`);
      return res.status(404).json({
        status: "error",
        message: "Institution not found.",
      });
    }

    logger.info(`Institution updated successfully: ${updatedInstitution.name}`);
    res.status(200).json({
      status: "success",
      message: "Institution updated successfully.",
      payload: updatedInstitution,
    });
  } catch (error) {
    logger.error("Error updating institution:", error.message);
    res.status(500).json({ status: "error", message: "Internal server error." });
  }
};

// DELETE - Eliminar institución por ID.
export const deleteInstitution = async (req, res) => {
  try {
    const { id } = req.params;

    const deletedInstitution = await Institution.findByIdAndDelete(id);

    if (!deletedInstitution) {
      logger.warn(`Institution not found with ID: ${id}`);
      return res.status(404).json({
        status: "error",
        message: "Institution not found.",
      });
    }

    logger.info(`Institution deleted successfully: ${deletedInstitution.name}`);
    res.status(200).json({
      status: "success",
      message: "Institution deleted successfully.",
    });
  } catch (error) {
    logger.error("Error deleting institution:", error.message);
    res.status(500).json({ status: "error", message: "Internal server error." });
  }
};
