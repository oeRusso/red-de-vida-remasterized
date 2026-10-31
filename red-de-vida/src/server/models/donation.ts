import mongoose, { type InferSchemaType, type Model, Schema } from "mongoose";
import { BLOOD_TYPES } from "@/domain/rules";

const donationSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    institutionId: { type: Schema.Types.ObjectId, ref: "Institution", required: true },
    donationDate: { type: Date, required: true },
    bloodType: { type: String, enum: BLOOD_TYPES, required: true },
    notes: { type: String },
  },
  { collection: "donations" },
);

export type DonationFields = InferSchemaType<typeof donationSchema>;

export const Donation = (mongoose.models.Donation ?? mongoose.model("Donation", donationSchema)) as Model<DonationFields>;
