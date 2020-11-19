import { Request, Response, Router } from "express";
import * as _ from "lodash";
import LEVEL_PERMISSION from "../../utils/LevelPermissions";
import { Controller } from "./../../libraries/Controller";
import { Notification } from "./../../models/Notification";
import { Candidate } from "../../models/Candidate";
import { Stage } from "../../models/Stage";
import { User } from "../../models/User";
import { Department } from "../../models/Department";
import { Job } from "./../../models/Job";
import {
  appendUser,
  filterRoles,
  stripNestedObjects,
  validateJWT,
} from "./../../policies/General";
import { JobUser } from "@/models/JobUser";
import * as sanitizeHtml from "sanitize-html";
import { jobValidationRules, validate } from "../../utils/validator";
import * as sequelize from "sequelize";

export class JobController extends Controller {
  constructor() {
    super();
    this.name = "job";
    this.model = Job;
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
      (req, res) => this.find(req, res),
    );
    this.router.get(
      "/statistics",
      validateJWT("access"),
      filterRoles([
        LEVEL_PERMISSION.ADMINISTRATOR,
        LEVEL_PERMISSION.RECRUITER,
        LEVEL_PERMISSION.MANAGER,
      ]),
      (req, res) => this.statistics(req, res),
    );
    this.router.get("/public", (req, res) => this.findOpenJobs(req, res));
    this.router.get(
      "/:id",
      validateJWT("access"),
      filterRoles([
        LEVEL_PERMISSION.ADMINISTRATOR,
        LEVEL_PERMISSION.RECRUITER,
        LEVEL_PERMISSION.MANAGER,
      ]),
      (req, res) => {
        return this.findOne(req, res);
      },
    );
    this.router.get("/published/:id", (req, res) => {
      return this.findOnePublished(req, res);
    });
    this.router.post(
      "/",
      validateJWT("access"),
      stripNestedObjects(),
      appendUser(),
      filterRoles([
        LEVEL_PERMISSION.ADMINISTRATOR,
        LEVEL_PERMISSION.MANAGER,
        LEVEL_PERMISSION.RECRUITER,
      ]),
      jobValidationRules(),
      validate,
      (req, res) => this.createWithHiringManagers(req, res),
    );
    this.router.put(
      "/:id",
      validateJWT("access"),
      stripNestedObjects(),
      appendUser(),
      filterRoles([
        LEVEL_PERMISSION.ADMINISTRATOR,
        LEVEL_PERMISSION.MANAGER,
        LEVEL_PERMISSION.RECRUITER,
      ]),
      jobValidationRules(),
      validate,
      (req, res) => {
        this.syncManagers(req, res);
      },
    );
    this.router.delete(
      "/:id",
      validateJWT("access"),
      filterRoles([
        LEVEL_PERMISSION.ADMINISTRATOR,
        LEVEL_PERMISSION.MANAGER,
        LEVEL_PERMISSION.RECRUITER,
      ]),
      (req, res) => this.destroy(req, res),
    );

    return this.router;
  }

  // findOpenJobs(req: Request, res: Response) {
  //   this.model
  //     .findAndCountAll({
  //       where: { status: "Open" },
  //       limit: this.parseLimit(req),
  //       offset: this.parseOffset(req),
  //     })
  //     .then((results) => {
  //       const filteredResults = results.rows.map((result) => {
  //         const { title, details, location, id, jobType, jobTime } = result;
  //         return {
  //           title,
  //           details,
  //           location,
  //           id,
  //           jobType,
  //           jobTime,
  //         };
  //       });

  //       res.set("Content-Count", String(results.count));
  //       res.status(200).json(filteredResults);
  //       return null;
  //     })
  //     .catch((err) => {
  //       if (err) Controller.serverError(res, err);
  //     });
  // }

  find(req: Request, res: Response) {
    let order = this.parseOrder(req);
    //Cast salaryLower from string to number
    if (order && order[0][0] === "salaryLower") {
      order = [
        [sequelize.cast(sequelize.col("salaryLower"), "unsigned"), order[0][1]],
      ];
    }
    Job.findAndCountAll({
      where: this.parseWhere(req),
      limit: this.parseLimit(req),
      offset: this.parseOffset(req),
      order: order,
      include: this.parseInclude(req),
    })
      .then((result) => {
        res.status(200).json(result);
        return null;
      })
      .catch((err) => {
        if (err) Controller.serverError(res, err);
      });
  }

  findOpenJobs(req: Request, res: Response) {
    this.model
      .findAndCountAll({
        where: { status: "Open" },
        limit: this.parseLimit(req),
        offset: this.parseOffset(req),
        attributes: [
          "title",
          "details",
          "location",
          "id",
          "jobType",
          "jobTime",
        ],
      })
      .then((results) => {
        res.set("Content-Count", String(results.count));
        res.status(200).json(results.rows);
        return null;
      })
      .catch((err) => {
        if (err) Controller.serverError(res, err);
      });
  }

  async statistics(req: Request, res: Response) {
    try {
      const allJobs = await Job.count();
      const openJobs = await Job.count({ where: { status: "Open" } });
      const closedJobs = await Job.count({ where: { status: "Closed" } });
      return res
        .status(201)
        .json({ all: allJobs, open: openJobs, closed: closedJobs });
    } catch (error) {
      console.log(error);
      Controller.serverError(res);
    }
  }

  async syncManagers(req, res) {
    const { id } = req.params;
    const { hiringManagers } = req.body;
    req.body.details = sanitizeHtml(req.body.details, {
      allowedAttributes: {
        "*": ["style"],
      },
      allowedStyles: {
        "*": {
          // Match HEX and RGB
          color: [
            /^#(0x)?[0-9a-f]+$/i,
            /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/,
          ],
          "text-align": [/^left$/, /^right$/, /^center$/],
          // Match any number with px, em, or %
          "font-size": [/^\d+(?:px|em|%)$/],
        },
      },
    });

    try {
      const job = await Job.findOne({
        where: { id: id },
        include: [
          {
            model: User,
            as: "hiringManagers",
            attributes: ["id", "firstName", "lastName"],
            through: { attributes: [] },
          },
        ],
      });

      //check if the department changed
      if (Number(job.departmentId) !== Number(req.body.departmentId)) {
        await Department.increment("jobsCount", {
          by: 1,
          where: { id: req.body.departmentId },
        });
        const department = await Department.findOne({
          where: { id: req.body.departmentId },
        });
        req.body.jobId = `${department.name.toLowerCase().replace(" ", "-")}-${
          department.jobsCount
        }`;
      }

      //check if the status changed
      if (job.status !== req.body.status) {
        req.body.openAt = req.body.status === "Open" ? new Date() : job.openAt;
        req.body.closedAt =
          req.body.status === "Closed" ? new Date() : job.closedAt;
      }

      await job.update(req.body);

      if (req.body.hiringManagers) {
        await JobUser.destroy({ where: { jobId: id } });

        let i = 0;
        const managersLen = hiringManagers.length;
        for (i; i < managersLen; i++) {
          await JobUser.create({
            userId: hiringManagers[i],
            jobId: job.id,
          });
        }
      }
      return await this.findOne(req, res);
    } catch (error) {
      console.log(error);
      Controller.serverError(res);
    }
  }

  async createWithHiringManagers(req: Request, res: Response) {
    try {
      await Department.increment("jobsCount", {
        by: 1,
        where: { id: req.body.departmentId },
      });

      const department = await Department.findOne({
        where: { id: req.body.departmentId },
      });

      // Check if the status is OPEN or CLOSED, and save the date.
      req.body.openAt = req.body.status === "Open" ? new Date() : null;
      req.body.closedAt = req.body.status === "Closed" ? new Date() : null;

      const job = await Job.create({
        ...req.body,
        jobId: `${department.name.toLowerCase().replace(" ", "-")}-${
          department.jobsCount
        }`,
        details: sanitizeHtml(req.body.details, {
          allowedAttributes: {
            "*": ["style"],
          },
          allowedStyles: {
            "*": {
              // Match HEX and RGB
              color: [
                /^#(0x)?[0-9a-f]+$/i,
                /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/,
              ],
              "text-align": [/^left$/, /^right$/, /^center$/],
              // Match any number with px, em, or %
              "font-size": [/^\d+(?:px|em|%)$/],
            },
          },
        }),
      });

      const managersId = req.body.hiringManagers;

      let i = 0;
      if (managersId) {
        const managersLen = managersId.length;
        for (i; i < managersLen; i++) {
          await JobUser.create({
            userId: managersId[i],
            jobId: job.id,
          });
        }
      }

      const users = await User.findAll({
        where: {
          $or: [
            {
              roleId: {
                $eq: 1,
              },
            },
            {
              roleId: {
                $eq: 2,
              },
            },
          ],
        },
      });

      const limit = users.length;
      for (let i = 0; i < limit; i++) {
        if (users[i].id !== req.session.user.id) {
          await Notification.create({
            userId: req.session.user.id,
            receiver: users[i].id,
            jobId: job.id,
            message: `A new job has been created: ${job.title}`,
            read: false,
            type: "job",
          });
        }
      }

      return res.status(201).json(job);
    } catch (error) {
      console.log(error);
      Controller.serverError(res);
    }
  }

  async findOnePublished(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const job = await Job.findOne({
        where: { id },
        attributes: [
          "details",
          "isJobRemote",
          "jobTime",
          "jobType",
          "location",
          "salaryCurrency",
          "salaryGross",
          "salaryLower",
          "salaryPeriod",
          "salaryPublic",
          "salaryUpper",
          "status",
          "title",
        ],
      });
      if (job !== null) {
        if (!job.salaryPublic) {
          const jobWithOutSalary = await job.get({ plain: true });
          delete jobWithOutSalary["salaryLower"];
          delete jobWithOutSalary["salaryUpper"];
          delete jobWithOutSalary["salaryCurrency"];
          delete jobWithOutSalary["salaryGross"];
          delete jobWithOutSalary["salaryPeriod"];
          return res.status(200).json(jobWithOutSalary);
        }

        return res.status(200).json(job);
      } else {
        throw new Error("error job null");
      }
    } catch (err) {
      console.log(err);
      return Controller.serverError(res);
    }
  }

  async findOne(req: Request, res: Response) {
    const { id } = req.params;
    try {
      const job = await Job.findOne({
        where: { id },
        include: [
          {
            model: User,
            as: "jobCreator",
            attributes: ["id", "firstName", "lastName"],
          },
          {
            model: Department,
            as: "department",
            attributes: ["id", "name"],
          },
          {
            model: User,
            as: "hiringManagers",
            attributes: ["id", "firstName", "lastName"],
            through: { attributes: [] },
          },
          {
            model: Candidate,
            as: "candidates",
            attributes: [
              "id",
              "firstName",
              "lastName",
              "phone",
              "email",
              "website",
              "resume",
              "createdAt",
            ],

            include: [
              {
                model: Stage,
                as: "stage",
              },
              {
                model: User,
                as: "users",
                where: {
                  roleId: 2,
                },
                required: false,
                attributes: ["id", "firstName", "lastName"],
                through: { attributes: [] },
              },
            ],
            through: { attributes: [] },
          },
        ],
      });

      const jobJson = job.get({
        plain: true,
      });

      const candidates = jobJson["candidates"];

      const candidatesFormatted = candidates.map((candidate) => {
        const obj = {
          ...candidate,
        };
        delete obj.users;
        if (candidate.users.length > 0) {
          obj.recruiter = candidate.users[0];
        }

        return obj;
      });

      const hiredCandidates = candidatesFormatted.filter(
        (candidate) => candidate.stage.id === 3,
      ).length;

      return res.status(200).json({
        ...jobJson,
        candidates: candidatesFormatted,
        hiredCandidates: hiredCandidates,
      });
    } catch (err) {
      console.log(err);
      return Controller.serverError(res);
    }
  }
}

const job = new JobController();
export default job;
