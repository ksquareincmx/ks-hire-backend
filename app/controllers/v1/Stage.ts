import { Router } from "express";
import { Controller } from "./../../libraries/Controller";
import { Stage } from "./../../models/Stage";
import { stripNestedObjects, validateJWT } from "./../../policies/General";

export class StageController extends Controller {
  constructor() {
    super();
    this.name = "stage";
    this.model = Stage;
  }

  routes(): Router {
    /* this.router.get("/", validateJWT("access"), (req, res) =>
      this.find(req, res),
    );
    this.router.get("/:id", validateJWT("access"), (req, res) =>
      this.findOne(req, res),
    );
    this.router.post(
      "/",
      validateJWT("access"),
      stripNestedObjects(),
      (req, res) => this.create(req, res),
    );
    this.router.put(
      "/:id",
      validateJWT("access"),
      stripNestedObjects(),
      (req, res) => this.update(req, res),
    );
    this.router.delete("/:id", validateJWT("access"), (req, res) =>
      this.destroy(req, res),
    ); */

    return this.router;
  }
}

const stage = new StageController();
export default stage;
