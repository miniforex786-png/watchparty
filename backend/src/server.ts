import "dotenv/config";
import { createServer } from "node:http";
import { Server } from "socket.io";
import { createApp } from "./app";
import { registerSocketHandlers } from "./sockets";

const PORT = Number(process.env.PORT ?? 4000);
const app = createApp();
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_ORIGIN?.split(",").map((origin) => origin.trim()) ?? ["http://localhost:3000"],
    credentials: true
  }
});

registerSocketHandlers(io);

httpServer.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Backend running on port ${PORT}`);
});
