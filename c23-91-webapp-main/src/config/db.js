import mongoose from "mongoose";
import logger from "../config/logger.js";

const connectDB = async () => {
  try {
    console.log("NODE_ENV:", process.env.NODE_ENV);
    const mongoURI =
      process.env.NODE_ENV === "development"
        ? process.env.MONGO_URI_DEV
        : process.env.MONGO_URI_PROD;
    await mongoose.connect(mongoURI);
    logger.info("Connected to MongoDB");
  } catch (error) {
    logger.error("Error connecting to MongoDB:", error.message);
    process.exit(1);
  }
};

export default connectDB;
