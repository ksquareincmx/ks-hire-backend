import { Router } from "express";
import { Controller } from "./../../libraries/Controller";
import { Role } from "./../../models/Role";
import {
  appendUser,
  filterOwner,
  stripNestedObjects,
  validateJWT,
} from "./../../policies/General";

export class RoleController extends Controller {
  constructor() {
    super();
    this.name = "role";
    this.model = Role;
  }

  routes(): Router {
    this.router.get("/", validateJWT("access"), filterOwner(), (req, res) =>
      this.find(req, res),
    );
    this.router.get("/:id", validateJWT("access"), filterOwner(), (req, res) =>
      this.findOne(req, res),
    );
    /* this.router.post(
      "/",
      validateJWT("access"),
      stripNestedObjects(),
      filterOwner(),
      appendUser(),
      (req, res) => this.create(req, res),
    );
    this.router.put(
      "/:id",
      validateJWT("access"),
      stripNestedObjects(),
      filterOwner(),
      appendUser(),
      (req, res) => this.update(req, res),
    );
    this.router.delete(
      "/:id",
      validateJWT("access"),
      filterOwner(),
      (req, res) => this.destroy(req, res),
    ); */

    return this.router;
  }
}

const role = new RoleController();
export default role;
