/* Crea los índices nuevos sin borrar nada. `--prod` apunta a MONGO_URI_PROD. */
import mongoose from "mongoose";
import { mongoUri } from "../src/server/db";
import { Appointment, Award, Donation, Institution, User } from "../src/server/models";

await mongoose.connect(mongoUri(process.argv.includes("--prod") ? "production" : "development"), { autoIndex: false });

let failed = false;
for (const model of [User, Appointment, Donation, Institution, Award]) {
  try {
    await model.createIndexes();
    console.log(`✓ ${model.collection.name}`);
  } catch (error) {
    failed = true;
    // Típico: hay duplicados legacy (dos citas Pending del mismo usuario). Hay que resolverlos a mano.
    console.error(`✗ ${model.collection.name}: ${(error as Error).message}`);
  }
}

await mongoose.disconnect();
process.exit(failed ? 1 : 0);
