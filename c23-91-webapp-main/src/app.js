import express from "express";
import helmet from "helmet";
import httpLogger from "./middlewares/httpLogger.js";
import corsMiddleware from "./middlewares/corsConfig.js";

import userRouter from "./router/user.routes.js";
import donationRouter from "./router/donation.routes.js";
import appointmentRouter from "./router/appointment.routes.js";
import institutionRouter from "./router/institution.routes.js";
import authRouter from "./router/auth.routes.js";

// Express
const app = express();

// Middlewares
app.use(corsMiddleware);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(httpLogger);

// Rutas
app.use("/api", userRouter);
app.use("/api", donationRouter);
app.use("/api", appointmentRouter);
app.use("/api", institutionRouter);
app.use("/auth", authRouter);

export default app;
