import mongoose from "mongoose";

const institutionSchema = new mongoose.Schema({
  name: { type: String, required: true, maxlength: 100 },
  institutionType: {
    type: String,
    enum: ["Hospital", "Clínica", "Banco de Sangre"],
    required: true,
  },
  address: { type: String, required: true, maxlength: 250 },
  email: {
    type: String,
    required: true,
    unique: true,
    match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  operatingHours: {
    mondayToFriday: {
      open: { type: String, required: true },
      close: { type: String, required: true },
    },
    saturday: {
      open: { type: String },
      close: { type: String },
    },
    sunday: {
      open: { type: String },
      close: { type: String },
    },
  },
  dailyDonorCapacity: { type: Number, required: true, min: 0, max: 1000 },
  donations: [{ type: mongoose.Schema.Types.ObjectId, ref: "Donation" }],
  appointments: [{ type: mongoose.Schema.Types.ObjectId, ref: "Appointment" }],
});

const Institution = mongoose.model("Institution", institutionSchema);

export default Institution;
