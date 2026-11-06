/* Mongo efímero para desarrollar sin instalar mongod. Los datos se pierden al cerrarlo. */
import { MongoMemoryServer } from "mongodb-memory-server";

const server = await MongoMemoryServer.create({ instance: { port: 27017, dbName: "reddevida" } });
console.log(`MongoDB en memoria: ${server.getUri()}reddevida`);

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => void server.stop().then(() => process.exit(0)));
}
