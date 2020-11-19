import { setupDB } from "./db";
import { log } from "./libraries/Log";
import { setupServer } from "./server";
import EventService from "./services/EventService";
import JanitorService from "./services/JanitorService";
import { setupSockets } from "./sockets";

require("dotenv").config();

process.env.TZ = "UTC"; // IMPORTANT For correct timezone management with DB, Tasks etc.

setupDB()
  .then(() => {
    JanitorService.init();
    EventService.init();

    setupSockets();

    setupServer();
  })
  .catch((err) => {
    log.error(err);
  });
