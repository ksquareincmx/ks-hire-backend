import { Router, Request, Response } from "express";

import { Controller } from "./../../libraries/Controller";
import { Feedback } from "./../../models/Feedback";
import { Candidate } from "./../../models/Candidate";
import { CandidateJob } from "./../../models/CandidateJob";
import { Notification } from "./../../models/Notification";
import { JobUser } from "../../models/JobUser";
import {
  appendUser,
  filterOwner,
  stripNestedObjects,
  validateJWT,
} from "./../../policies/General";
import { User } from "@/models/User";
import { CandidateUser } from "@/models/CandidateUser";
import {
  feedbackValidationRules,
  editFeedbackValidationRules,
  validate,
} from "../../utils/validator";

export class FeedbackController extends Controller {
  constructor() {
    super();
    this.name = "feedback";
    this.model = Feedback;
  }

  routes(): Router {
    /* this.router.get("/", validateJWT("access"), filterOwner(), (req, res) =>
      this.find(req, res),
    ); */
    this.router.get("/:id", validateJWT("access"), filterOwner(), (req, res) =>
      this.findOne(req, res),
    );
    this.router.post(
      "/",
      validateJWT("access"),
      stripNestedObjects(),
      appendUser(),
      feedbackValidationRules(),
      validate,
      (req, res) => this.createFeedback(req, res),
    );
    this.router.put(
      "/:id",
      validateJWT("access"),
      stripNestedObjects(),
      filterOwner(),
      appendUser(),
      editFeedbackValidationRules(),
      validate,
      (req, res) => this.update(req, res),
    );
    this.router.delete(
      "/:id",
      validateJWT("access"),
      filterOwner(),
      (req, res) => this.destroy(req, res),
    );

    return this.router;
  }

  async createFeedback(req: Request, res: Response) {
    try {
      const { id, candidateId, userId } = await Feedback.create(req.body);

      const feedback = await Feedback.findOne({
        where: { id },
        include: [
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
      });

      const recruiter = await CandidateUser.findOne({
        where: { candidateId },
      });

      if (recruiter !== null && userId !== recruiter.userId) {
        await Notification.create({
          userId,
          candidateId,
          receiver: recruiter.userId,
          message: "A candidate has been given feedback",
          read: false,
          type: "feedback",
        });
      }

      const candidateJob = await CandidateJob.findOne({
        where: {
          candidateId: candidateId,
        },
      });

      const managers = await JobUser.findAll({
        where: {
          jobId: candidateJob.jobId,
        },
      });

      if (managers.length > 0) {
        for (let i = 0; i < managers.length; i++) {
          if (managers[i].userId !== req.session.user.id) {
            await Notification.create({
              userId,
              candidateId,
              receiver: managers[i].userId,
              message: "A candidate has been given feedback",
              read: false,
              type: "feedback",
            });
          }
        }
      }

      return res.status(201).json(feedback);
    } catch (error) {
      console.log(error);
      Controller.serverError(res);
    }
  }
}

const feedback = new FeedbackController();
export default feedback;
