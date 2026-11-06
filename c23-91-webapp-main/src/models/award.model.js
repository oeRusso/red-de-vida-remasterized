import mongoose from "mongoose";

const awardSchema = new mongoose.Schema({
  level: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  pointsRequired: { type: Number, required: true },
});

const Award = mongoose.model("Award", awardSchema);

export default Award;
