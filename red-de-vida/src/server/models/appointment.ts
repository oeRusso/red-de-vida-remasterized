import mongoose, { type InferSchemaType, type Model, Schema } from "mongoose";
import { APPOINTMENT_STATUSES } from "@/domain/rules";

const appointmentSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    institutionId: { type: Schema.Types.ObjectId, ref: "Institution", required: true },
    appointmentDate: { type: Date, required: true },
    status: { type: String, enum: APPOINTMENT_STATUSES, default: "Pending" },
    notes: { type: String, maxlength: 500 },
  },
  { collection: "appointments" },
);

// Únicas barreras contra reservas simultáneas: la comprobación previa del servicio no basta.
const pendingOnly = { partialFilterExpression: { status: "Pending" }, unique: true };
appointmentSchema.index({ institutionId: 1, appointmentDate: 1 }, { ...pendingOnly, name: "unique_pending_slot" });
appointmentSchema.index({ userId: 1 }, { ...pendingOnly, name: "unique_pending_per_user" });
// La caducidad se aplica en cada lectura: sin este índice recorrería toda la colección.
appointmentSchema.index({ status: 1, appointmentDate: 1 }, { name: "status_date" });

export type AppointmentFields = InferSchemaType<typeof appointmentSchema>;

export const Appointment = (mongoose.models.Appointment ?? mongoose.model("Appointment", appointmentSchema)) as Model<AppointmentFields>;
