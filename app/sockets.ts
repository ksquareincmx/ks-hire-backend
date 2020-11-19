import * as _ from "lodash";
import * as Socketio from "socket.io";

import auth from "./controllers/v1/Auth";
import { log } from "./libraries/Log";
import { server } from "./server";
import EventService from "./services/EventService";

// Initialize websockets
export const io: any = Socketio();

export function setupSockets(): Promise<any> {
  // Attach websocket server to main server
  io.attach(server);
  const originENV = process.env.URL;

  io.origins((origin, callback) => {
    if (origin !== originENV) {
      return callback("Origin Not Allowed", false);
    }
    callback(null, true);
  });
  io.set("transports", ["websocket"]);

  // Auth middleware for sockets
  io.use((socket, next) => {
    const token = socket.handshake.query.token;

    // Validate access JWT for auth
    if (token == null) return next(new Error("No Token Present"));

    auth
      .validateJWT(token, "access")
      .then((decoded) => {
        if (!decoded) {
          throw new Error("Invalid Token");
        }
        if (socket.request.session == null) socket.request.session = {};
        socket.request.session.jwt = decoded;
        socket.request.session.jwtstring = token;
        socket.request.session.user = _.pick(decoded, ["id", "email", "role"]);
        return next();
      })
      .catch((err) => {
        return next(new Error(err));
      });
  });

  // Socket connection handler and setup
  io.on("connection", (socket) => {
    log.info(
      "Websocket connected, client:",
      socket.handshake.address,
      socket.request.session.user.email,
    );

    // Support for db change events
    const userId = socket.request.session.user.id;

    const dbChangeHandler = (data) => {
      if (data.receiver === userId) {
        socket.emit("change", data);
      }
    };

    EventService.on(`db/change/${userId}`, dbChangeHandler);

    socket.on("disconnect", (reason) => {
      log.info(
        "Websocket disconnected, client:",
        socket.handshake.address,
        socket.request.session.user.email,
        "reason:",
        reason,
      );
      EventService.removeListener(`db/change/${userId}`, dbChangeHandler);
    });
  });

  return Promise.resolve();
}
