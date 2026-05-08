import cors from "cors";
import express from "express";
import healthRouter from "./routes/health";

export function createApp() {
  const app = express();
  const allowedOrigins = process.env.FRONTEND_ORIGIN?.split(",").map((origin) => origin.trim()) ?? ["http://localhost:3000"];

  app.use(
    cors({
      origin: allowedOrigins,
      credentials: true
    })
  );
  app.use(express.json());

  app.get("/", (_req, res) => {
    res.json({ name: "Watch Party API", version: "1.0.0" });
  });

  app.use("/health", healthRouter);

  return app;
}
