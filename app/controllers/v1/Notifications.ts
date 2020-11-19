import { Request, Response, Router } from "express";
import { Notification } from "../../models/Notification";
import { Controller } from "./../../libraries/Controller";
import { stripNestedObjects, validateJWT } from "./../../policies/General";
import { User } from "@/models/User";
import { Candidate } from "@/models/Candidate";
import {
  editNotificationValidationRules,
  validate,
} from "../../utils/validator";

export class NotificationController extends Controller {
  constructor() {
    super();
    this.name = "notification";
    this.model = Notification;
  }

  routes(): Router {
    this.router.delete("/all", validateJWT("access"), (req, res) =>
      this.destroyAll(req, res),
    );
    //  Format query like so 192.168.99.100:8888/api/v1/notification?where={"userId":"1"}&include=["Candidate"]
    this.router.get("/", validateJWT("access"), (req, res) =>
      this.find(req, res),
    );
    /* this.router.get("/:id", validateJWT("access"), (req, res) =>
      this.findOne(req, res),
    ); 
    */
    this.router.put(
      "/:id",
      validateJWT("access"),
      stripNestedObjects(),
      editNotificationValidationRules(),
      validate,
      (req, res) => this.update(req, res),
    );
    this.router.delete("/:id", validateJWT("access"), (req, res) =>
      this.destroy(req, res),
    );

    return this.router;
  }

  async find(req: Request, res: Response) {
    //user requesting notifications
    const user = req.session.user.id;
    Notification.findAll({
      where: { receiver: user },
      limit: this.parseLimit(req),
      offset: this.parseOffset(req),
      order: this.parseOrder(req),
      attributes: [
        "id",
        "message",
        "read",
        "type",
        "createdAt",
        "updatedAt",
        "userId",
        "candidateId",
        "jobId",
      ],
      include: [
        {
          model: User,
          as: "user",
          attributes: ["id", "firstName", "lastName"],
        },
        {
          model: Candidate,
          as: "candidate",
          attributes: ["id", "firstName", "lastName"],
          include: [
            {
              model: User,
              as: "users",
              attributes: ["id", "firstName", "lastName"],
            },
          ],
        },
      ],
    })
      .then((response) => {
        const resp = response.map((e) => e.get({ plain: true }));
        return res.status(200).json(resp);
      })
      .catch((err) => {
        Controller.serverError(err);
      });
  }

  destroyAll(req: Request, res: Response) {
    const user = req.session.user.id;
    Notification.destroy({
      where: { receiver: user },
    })
      .then((response) => {
        return res.status(200).json(response);
      })
      .catch((err) => {
        Controller.serverError(err);
      });
  }
}

const notification = new NotificationController();
export default notification;
