import mongoose, { type InferSchemaType, type Model, Schema } from "mongoose";
import { INSTITUTION_TYPES } from "@/domain/rules";

const institutionSchema = new Schema(
  {
    name: { type: String, required: true, maxlength: 100 },
    institutionType: { type: String, enum: INSTITUTION_TYPES, required: true },
    address: { type: String, required: true, maxlength: 250 },
    email: { type: String, required: true, unique: true, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    operatingHours: {
      mondayToFriday: {
        open: { type: String, required: true },
        close: { type: String, required: true },
      },
      saturday: { open: { type: String }, close: { type: String } },
      sunday: { open: { type: String }, close: { type: String } },
    },
    dailyDonorCapacity: { type: Number, required: true, min: 0, max: 1000 },
    donations: [{ type: Schema.Types.ObjectId, ref: "Donation" }],
    appointments: [{ type: Schema.Types.ObjectId, ref: "Appointment" }],
  },
  { collection: "institutions" },
);

export type InstitutionFields = InferSchemaType<typeof institutionSchema>;

export const Institution = (mongoose.models.Institution ?? mongoose.model("Institution", institutionSchema)) as Model<InstitutionFields>;
