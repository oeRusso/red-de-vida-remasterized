import bcrypt from "bcryptjs";
import mongoose, { type InferSchemaType, type Model, Schema } from "mongoose";
import { BLOOD_TYPES, GENDERS } from "@/domain/rules";

/* Colecciones y campos idénticos a los del backend Express: no renombrar. */
const userSchema = new Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    birthday: { type: Date, required: true },
    gender: { type: String, enum: GENDERS, required: true },
    bloodType: { type: String, enum: BLOOD_TYPES, required: true },
    email: { type: String, required: true, unique: true, match: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
    // select:false no altera el documento; evita que el hash salga en una consulta normal.
    password: { type: String, required: true, select: false },
    diseases: [
      {
        name: { type: String, required: true },
        diagnosedDate: { type: Date },
        notes: { type: String, maxlength: 500 },
      },
    ],
    donations: [{ type: Schema.Types.ObjectId, ref: "Donation" }],
    appointments: [{ type: Schema.Types.ObjectId, ref: "Appointment" }],
    totalPoints: { type: Number, default: 0 },
    awards: [{ type: Schema.Types.ObjectId, ref: "Award" }],
  },
  { collection: "users" },
);

userSchema.pre("save", async function () {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 10);
  }
});

export type UserFields = InferSchemaType<typeof userSchema>;

export const User = (mongoose.models.User ?? mongoose.model("User", userSchema)) as Model<UserFields>;
