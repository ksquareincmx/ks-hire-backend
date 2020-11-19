import * as express from "express";
import * as bodyParser from "body-parser";
import * as morgan from "morgan";
import * as helmet from "helmet";
import * as methodOverride from "method-override";
import * as favicon from "serve-favicon";
import * as path from "path";
import * as compression from "compression";
import { __express as handleBars } from "hbs";
import { routes } from "./routes";
import { log, requestLogStream } from "./libraries/Log";
import { config } from "./config/config";
import { createServer } from "http";

import * as cors from "cors";
export const app = express().use("*", cors());
export const server = createServer(app);

// Security middleware
app.use(helmet());
// Util middleware
app.use(methodOverride());
app.use(favicon(path.join(__dirname, "../public/favicon.ico")));
// Body parser middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
// Response compression
app.use(compression());
// use morgan to log requests to the console
app.use(morgan("short", { stream: requestLogStream }));

app.set("views", `${config.root}/views`);
app.set("view engine", "html");
app.engine("html", handleBars);

routes(app);

export function setupServer(): Promise<any> {
  return new Promise((resolve, _reject) => {
    server.listen(config.server.port, () => {
      log.info(`ks-hire-api started at port ${config.server.port}`);
      resolve();
    });
  });
}
