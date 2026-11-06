import User from "../models/user.model.js";
import logger from "../config/logger.js";

// GET - Obtener todos los usuarios.
export const getUsers = async (req, res) => {
  try {
    const users = await User.find()
      // .populate("appointments")
      // .populate("donations")
      .populate("awards");

    logger.info("Users fetched successfully");
    res.status(200).json({ status: "success", payload: users });
  } catch (error) {
    logger.error("Error fetching users:", error.message);
    res.status(500).json({ status: "error", message: "Internal server error." });
  }
};

// GET - Obtener un usuario por ID.
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id)
      .populate("appointments")
      .populate("donations")
      .populate("awards");

    if (!user) {
      logger.warn(`User not found with ID: ${id}`);
      return res.status(404).json({ status: "error", message: "User not found" });
    }

    const lastAppointment = user.appointments.length
      ? user.appointments[user.appointments.length - 1]
      : null;

    let lastAppointmentData = null;
    if (lastAppointment) {
      lastAppointmentData = {
        status: lastAppointment.status,
        donationDate:
          lastAppointment.status === "Completed"
            ? lastAppointment.appointmentDate
            : null,
      };
    }

    logger.info(`User fetched successfully: ${user.email}`);
    res.status(200).json({
      status: "success",
      payload: {
        user,
        lastAppointment: lastAppointmentData,
      },
    });
  } catch (error) {
    logger.error("Error fetching user by ID:", error.message);
    res.status(500).json({ status: "error", message: "Internal server error." });
  }
};

// GET - Obtener citas, donaciones y nivel de un usuario por ID.
export const getUserDetailsById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id)
      .populate({
        path: "donations",
        populate: {
          path: "institutionId",
          select: "name address institutionType email dailyDonorCapacity",
        },
      })
      .populate({
        path: "appointments",
        populate: {
          path: "institutionId",
          select: "name address institutionType email dailyDonorCapacity",
        },
      })
      .populate("awards");

    if (!user) {
      logger.warn(`User not found with ID: ${id}`);
      return res.status(404).json({ status: "error", message: "User not found" });
    }

    const { donations, appointments, awards, totalPoints } = user;

    logger.info(`User details fetched successfully: ${user.email}`);
    res.status(200).json({
      status: "success",
      payload: { donations, appointments, awards, totalPoints },
    });
  } catch (error) {
    logger.error("Error fetching user details:", error.message);
    res.status(500).json({ status: "error", message: "Internal server error." });
  }
};

// POST - Crear un nuevo usuario.
export const createUser = async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      birthday,
      gender,
      bloodType,
      email,
      password,
      diseases,
    } = req.body;

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      logger.warn(`Duplicate email: ${email}`);
      return res.status(409).json({ status: "error", message: "Email already registered." });
    }

    const newUser = new User({
      firstName,
      lastName,
      birthday,
      gender,
      bloodType,
      email,
      password,
      diseases,
    });

    const savedUser = await newUser.save();
    logger.info(`User created successfully: ${savedUser.email}`);

    res.status(201).json({
      status: "success",
      message: "User created successfully.",
      payload: savedUser,
    });
  } catch (error) {
    if (error.code === 11000) {
      logger.warn(`Duplicate key error: ${error.message}`);
      return res.status(409).json({ status: "error", message: "Duplicate key error." });
    }

    logger.error("Error creating user:", error.message);
    res.status(500).json({ status: "error", message: "Internal server error." });
  }
};

// PUT - Actualizar información de un usuario.
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedUser = await User.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      logger.warn(`User not found with ID: ${id}`);
      return res.status(404).json({ status: "error", message: "User not found" });
    }

    logger.info(`User updated successfully: ${updatedUser.email}`);
    res.status(200).json({
      status: "success",
      message: "User updated successfully",
      payload: updatedUser,
    });
  } catch (error) {
    logger.error("Error updating user:", error.message);
    res.status(500).json({ status: "error", message: "Internal server error." });
  }
};

// DELETE - Eliminar usuario por ID.
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const deletedUser = await User.findByIdAndDelete(id);

    if (!deletedUser) {
      logger.warn(`User not found with ID: ${id}`);
      return res.status(404).json({ status: "error", message: "User not found" });
    }

    logger.info(`User deleted successfully: ${deletedUser.email}`);
    res.status(200).json({
      status: "success",
      message: "User deleted successfully",
    });
  } catch (error) {
    logger.error("Error deleting user:", error.message);
    res.status(500).json({ status: "error", message: "Internal server error." });
  }
};
