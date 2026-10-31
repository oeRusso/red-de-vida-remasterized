/*
 * Idempotente: solo inserta lo que falta, nunca modifica documentos existentes.
 *   npm run db:seed              → premios, instituciones y cuentas demo en MONGO_URI_DEV
 *   npm run db:seed -- --prod    → solo los premios, en MONGO_URI_PROD
 */
import mongoose from "mongoose";
import { INSTITUTION_DIRECTORY } from "../src/domain/institution-directory";
import { MEDALS } from "../src/domain/rules";
import { mongoUri } from "../src/server/db";
import { Award, Institution, User } from "../src/server/models";

const production = process.argv.includes("--prod");
await mongoose.connect(mongoUri(production ? "production" : "development"), { autoIndex: !production });

for (const medal of MEDALS) {
  await Award.updateOne({ level: medal.level }, { $setOnInsert: medal }, { upsert: true });
}
console.log(`Premios: ${await Award.countDocuments()}`);

if (!production) {
  for (const [index, entry] of INSTITUTION_DIRECTORY.entries()) {
    await Institution.updateOne(
      { name: entry.name },
      {
        $setOnInsert: {
          name: entry.name,
          institutionType: entry.type,
          address: entry.address,
          email: `institucion${index + 1}@reddevida.test`,
          operatingHours: {
            mondayToFriday: { open: "08:00", close: "16:00" },
            saturday: { open: "08:00", close: "12:00" },
          },
          dailyDonorCapacity: 16,
        },
      },
      { upsert: true },
    );
  }
  console.log(`Instituciones: ${await Institution.countDocuments()}`);

  const demoAccounts = [
    { firstName: "Demo", lastName: "Donante", email: "demo@reddevida.test", password: "Demo1234" },
    { firstName: "Admin", lastName: "Red", email: "admin@reddevida.test", password: "Admin1234" },
  ];
  for (const account of demoAccounts) {
    if (await User.exists({ email: account.email })) continue;
    await User.create({ ...account, birthday: new Date("1990-05-15"), gender: "Female", bloodType: "O+" });
  }
  const admin = await User.findOne({ email: "admin@reddevida.test" }).lean();
  console.log(`Cuentas demo listas. Agrega a .env.local:\nADMIN_USER_IDS=${admin?._id}`);
}

await mongoose.disconnect();
