import { Router } from "express";
import * as _ from "lodash";

import { filterRoles, validateJWT } from "./../../policies/General";
import LEVEL_PERMISSION from "../../utils/LevelPermissions";
import { Controller } from "./../../libraries/Controller";
import { Profile } from "@/models/Profile";
import { Role } from "@/models/Role";
import { User } from "@/models/User";
import { Job } from "@/models/Job";
import { Candidate } from "@/models/Candidate";
import { userValidationRules, validate } from "../../utils/validator";

export class UserController extends Controller {
  constructor() {
    super();
    this.name = "user";
    this.model = User;
  }

  routes(): Router {
    this.router.get(
      "/",
      validateJWT("access"),
      filterRoles([
        LEVEL_PERMISSION.ADMINISTRATOR,
        LEVEL_PERMISSION.RECRUITER,
        LEVEL_PERMISSION.MANAGER,
      ]),
      (req, res) => this.findAll(req, res),
    );

    this.router.get(
      "/:id",
      validateJWT("access"),
      filterRoles([LEVEL_PERMISSION.ADMINISTRATOR]),
      // isSelfUser(),
      (req, res) => this.findOne(req, res),
    );

    this.router.put(
      "/:id",
      validateJWT("access"),
      filterRoles([LEVEL_PERMISSION.ADMINISTRATOR]),
      userValidationRules(),
      validate,
      (req, res) => this.update(req, res),
    ); // only ADMINISTRATOR can edit user

    this.router.delete(
      "/:id",
      validateJWT("access"),
      filterRoles([LEVEL_PERMISSION.ADMINISTRATOR]),
      (req, res) => this.destroy(req, res),
    ); // only ADMINISTRATOR can delete user

    return this.router;
  }

  async findAll(req, res) {
    const users = await User.findAll({
      where: this.parseWhere(req),
      limit: this.parseLimit(req),
      offset: this.parseOffset(req),
      order: this.parseOrder(req),
      include: [
        { model: Role, as: "role" },
        { model: Profile, as: "profile" },
        { model: Job, as: "jobs" },
        { model: Candidate, as: "candidates" },
      ],
    });

    const usersRole = users.map((user) => {
      return _.pick(user, [
        "id",
        "firstName",
        "lastName",
        "email",
        "profilePicture",
        "role",
        "profile",
        "jobs",
        "candidates",
      ]);
    });

    return res.status(200).json(usersRole);
  }
}

const controller = new UserController();
export default controller;
