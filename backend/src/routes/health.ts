import { Router } from "express";

const healthRouter = Router();

healthRouter.get("/", (_req, res) => {
  res.json({
    status: "ok",
    service: "watchparty-backend",
    timestamp: Date.now()
  });
});

export default healthRouter;
