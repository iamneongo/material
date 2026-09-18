import cors from "cors";
import express from "express";
import { toNodeHandler } from "better-auth/node";
import { auth } from "./auth.js";
import { config } from "./config.js";
import { errorHandler } from "./middleware/error-handler.js";
import { healthRouter } from "./routes/health-routes.js";
import { apiRouter } from "./routes/api-routes.js";

export function createApp() {
  const app = express();

  app.use(
    cors({
      credentials: true,
      origin(origin, callback) {
        const isExpoGoOrigin = origin?.startsWith("exp://") ?? false;
        const isNativeAppOrigin = origin?.startsWith(`${config.appScheme}://`) ?? false;

        if (
          !origin ||
          config.corsOrigins.includes(origin) ||
          isExpoGoOrigin ||
          isNativeAppOrigin
        ) {
          callback(null, true);
          return;
        }
        callback(new Error("Origin không được phép."));
      },
    })
  );
  app.all("/api/auth/*authPath", toNodeHandler(auth));
  app.use(express.json({ limit: "1mb" }));
  app.use("/health", healthRouter);
  app.use("/api", apiRouter);
  app.use(errorHandler);

  return app;
}
