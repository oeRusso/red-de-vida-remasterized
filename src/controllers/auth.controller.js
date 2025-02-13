import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import config from "../config/config.js";
import logger from "../config/logger.js";

// POST - Registrar usuario.
export const registerUser = async (req, res) => {
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

    if (!firstName ||!lastName ||!birthday ||!gender ||!bloodType ||!email ||!password) {
      logger.warn("Missing required fields for user registration");
      return res.status(400).json({ status: "error", message: "All fields are required." });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      logger.warn(`Email already registered: ${email}`);
      return res.status(409).json({ status: "error", message: "Email is already registered." });
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

    logger.info(`User registered successfully: ${savedUser.email}`);
    res.status(201).json({
      status: "success",
      message: "User registered successfully.",
      payload: {
        id: savedUser._id,
        email: savedUser.email,
      },
    });
  } catch (error) {
    logger.error("Error registering user:", error.message);
    res.status(500).json({ status: "error", message: "Internal server error." });
  }
};

// POST - Login.
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      logger.warn(`Login attempt with non-existent email: ${email}`);
      return res.status(401).json({ status: "error", message: "Invalid email or password." });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      logger.warn(`Failed login attempt for user: ${email}`);
      return res.status(401).json({ status: "error", message: "Invalid email or password." });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      config.JWT_SECRET,
      { expiresIn: "1h" }
    );

    logger.info(`User logged in successfully: ${user.email}`);
    res.status(200).json({
      status: "success",
      message: "Login successful.",
      payload: {
        token,
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
        },
      },
    });
  } catch (error) {
    logger.error("Error during login:", error.message);
    res.status(500).json({ status: "error", message: "Internal server error." });
  }
};