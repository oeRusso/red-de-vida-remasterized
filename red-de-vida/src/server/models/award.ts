import mongoose, { type InferSchemaType, type Model, Schema } from "mongoose";

const awardSchema = new Schema(
  {
    level: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    pointsRequired: { type: Number, required: true },
  },
  { collection: "awards" },
);

export type AwardFields = InferSchemaType<typeof awardSchema>;

export const Award = (mongoose.models.Award ?? mongoose.model("Award", awardSchema)) as Model<AwardFields>;
