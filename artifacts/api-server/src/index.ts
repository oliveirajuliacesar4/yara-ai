import app from "./app";
import { logger } from "./lib/logger";

const HOST = "0.0.0.0";
const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, HOST, () => {
  logger.info({ host: HOST, port: PORT }, "Server listening");
});

server.on("error", (err) => {
  logger.error({ err }, "Error listening on port");
  process.exit(1);
});
