import { Request, Response, Router } from "express";
import * as path from "path";
import * as multer from "multer";
import * as uuid from "uuid";
import * as fs from "fs";
import * as _ from "lodash";
import * as readChunk from "read-chunk";
import * as fileType from "file-type";
import axios from "axios";

import { Candidate, CandidateUtils } from "./../../models/Candidate";
import LEVEL_PERMISSION from "../../utils/LevelPermissions";
import { Notification } from "./../../models/Notification";
import { Controller } from "./../../libraries/Controller";
import { CandidateJob } from "../../models/CandidateJob";
import { Document } from "./../../models/Document";
import { Feedback } from "../../models/Feedback";
import { Notes } from "../../models/Notes";
import { Stage } from "../../models/Stage";
import { User } from "../../models/User";
import { Job } from "../../models/Job";
import { JobUser } from "../../models/JobUser";
import {
  filterRoles,
  validateJWT,
  stripNestedObjects,
} from "./../../policies/General";
import { ProcessInterview } from "@/models/ProcessInterview";
import { CandidateUser } from "@/models/CandidateUser";
import { ProcessInterviewUser } from "@/models/ProcessInterviewUser";
import mailer from "../../services/EmailService";
import {
  candidateValidationRules,
  editCandidateValidationRules,
  applicantValidationRules,
  validate,
} from "../../utils/validator";
import * as sequelize from "sequelize";

export class CandidateController extends Controller {
  constructor() {
    super();
    this.name = "candidate";
    this.model = Candidate;
  }

  //50 MB MAX SIZE FILES
  maxSize = 50 * 1024 * 1024;

  // Multer configuration
  private storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const filePath = path.join(__dirname, "../../../public/api/uploads");
      fs.mkdirSync(filePath, { recursive: true });
      cb(null, filePath);
    },
    filename: (req, file, cb) => {
      const modifiedFileName = uuid() + path.extname(file.originalname);
      req.fileName = file.originalname;
      req.storedFileRoute =
        path.join(__dirname, "../../../public/api/uploads/") + modifiedFileName;
      cb(null, modifiedFileName);
    },
  });

  //File Validation (Magic numbers)
  async isFileValid(req, res, next) {
    if (req.fileName) {
      try {
        const fileNameRegex = /^[\w,\s-()]+\.[A-Za-z]+$/;
        const fileNameValidation = fileNameRegex.test(req.fileName);

        //check if the filename is valid.
        if (!fileNameValidation) {
          fs.unlinkSync(req.storedFileRoute); //delete file
          return res.status(400).json("Invalid File");
        }

        // check the mime type
        const fileChunck = await readChunk(req.storedFileRoute, 0, 4100);
        if (!fileChunck) {
          fs.unlinkSync(req.storedFileRoute); //delete file
          return res.status(400).json("Invalid File");
        }

        const mimeType = await fileType.fromBuffer(fileChunck);
        if (!mimeType) {
          fs.unlinkSync(req.storedFileRoute); //delete file
          return res.status(400).json("Invalid File");
        }

        if (
          mimeType.mime === "application/pdf" ||
          mimeType.mime ===
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
          mimeType.mime === "application/postscript" //PDF BUG https://github.com/sindresorhus/file-type/issues/360
        ) {
          next();
        } else {
          fs.unlinkSync(req.storedFileRoute); //delete file
          return res.status(400).json("Invalid File");
        }
      } catch (error) {
        fs.unlinkSync(req.storedFileRoute); //delete file
        console.log(error);
        res.status(400).json("Invalid File");
      }
    } else {
      next();
    }
  }

  private upload = multer({
    storage: this.storage,
    fileFilter: (req, file, cb) => {
      const filetypes = /pdf|doc|docx|msword/;
      const mimetype = filetypes.test(file.mimetype);
      const extname = filetypes.test(
        path.extname(file.originalname).toLowerCase(),
      );

      if (mimetype && extname) {
        return cb(null, true);
      }

      req.fileValidationError = "Invalid File";
      return cb(null, false, req.fileValidationError);
    },
    limits: { files: 1, fileSize: this.maxSize },
  });

  routes(): Router {
    this.router.get(
      "/",
      validateJWT("access"),
      filterRoles([
        LEVEL_PERMISSION.ADMINISTRATOR,
        LEVEL_PERMISSION.RECRUITER,
        LEVEL_PERMISSION.MANAGER,
        LEVEL_PERMISSION.INTERVIEWER,
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
        LEVEL_PERMISSION.INTERVIEWER,
      ]),
      (req, res) => this.statistics(req, res),
    );

    this.router.get(
      "/:id",
      validateJWT("access"),
      filterRoles([
        LEVEL_PERMISSION.ADMINISTRATOR,
        LEVEL_PERMISSION.RECRUITER,
        LEVEL_PERMISSION.MANAGER,
        LEVEL_PERMISSION.INTERVIEWER,
      ]),
      (req, res) => this.findOne(req, res),
    );

    this.router.post(
      "/",
      validateJWT("access"),
      filterRoles([LEVEL_PERMISSION.ADMINISTRATOR, LEVEL_PERMISSION.RECRUITER]),
      this.upload.fields([
        { name: "firstName", maxCount: 1 },
        { name: "lastName", maxCount: 1 },
        { name: "phone", maxCount: 1 },
        { name: "email", maxCount: 1 },
        { name: "website", maxCount: 1 },
        { name: "source", maxCount: 1 },
        { name: "referral", maxCount: 1 },
        { name: "linkedin", maxCount: 1 },
        { name: "jobId", maxCount: 1 },
        { name: "stageId", maxCount: 1 },
        { name: "salaryOffer", maxCount: 1 },
        { name: "recruiterId", maxCount: 1 },
        { name: "type", maxCount: 1 },
        { name: "resume", maxCount: 10 },
        { name: "firstContact", maxCount: 1 },
        { name: "techInterview1", maxCount: 1 },
        { name: "techInterview2", maxCount: 1 },
        { name: "country", maxCount: 1 },
        { name: "state", maxCount: 1 },
        { name: "city", maxCount: 1 },
      ]),
      (req, res, next) => {
        if ((req as any).fileValidationError) {
          res.status(400).json("Invalid File");
        } else {
          next();
        }
      },
      candidateValidationRules(),
      validate,
      (req, res) => this.createCandidate(req, res),
    );

    this.router.post(
      "/apply",
      (req, res, next) => this.validateRecaptcha(req, res, next),
      this.upload.fields([
        { name: "firstName", maxCount: 1 },
        { name: "lastName", maxCount: 1 },
        { name: "phone", maxCount: 1 },
        { name: "email", maxCount: 1 },
        { name: "website", maxCount: 1 },
        { name: "linkedin", maxCount: 1 },
        { name: "type", maxCount: 1 },
        { name: "jobId", maxCount: 1 },
        { name: "resume", maxCount: 1 },
        { name: "country", maxCount: 1 },
        { name: "state", maxCount: 1 },
        { name: "city", maxCount: 1 },
      ]),
      (req, res, next) => {
        if ((req as any).fileValidationError) {
          res.status(400).json("Invalid File");
        } else {
          next();
        }
      },
      (req, res, next) => this.isFileValid(req, res, next),
      applicantValidationRules(),
      validate,
      (req, res) => this.createApplicant(req, res),
    );

    this.router.put(
      "/:id",
      validateJWT("access"),
      stripNestedObjects(),
      filterRoles([LEVEL_PERMISSION.ADMINISTRATOR, LEVEL_PERMISSION.RECRUITER]),
      editCandidateValidationRules(),
      validate,
      (req, res) => this.updateRelations(req, res),
    );

    this.router.delete(
      "/:id",
      validateJWT("access"),
      filterRoles([LEVEL_PERMISSION.ADMINISTRATOR, LEVEL_PERMISSION.RECRUITER]),
      (req, res) => this.destroy(req, res),
    );

    return this.router;
  }

  find(req: Request, res: Response) {
    let whereStage = undefined;
    let whereName = undefined;

    if (this.parseWhere(req).stage) {
      whereStage = { name: this.parseWhere(req).stage };
    }

    if (this.parseWhere(req).name) {
      whereName = sequelize.where(
        sequelize.fn(
          "concat",
          sequelize.col("Candidate.firstName"),
          " ",
          sequelize.col("Candidate.lastName"),
        ),
        this.parseWhere(req).name,
      );
    }

    //order
    let order = [];
    const orderReq = this.parseOrder(req);

    if (orderReq[0][0] === "stage") {
      const stageOrder = [
        [{ model: Stage, as: "stage" }, "name", orderReq[0][1]],
      ];
      if (!this.parseWhere(req).stage) {
        order = stageOrder;
      }
    }

    if (orderReq[0][0] === "position") {
      const stageOrder = [
        [{ model: Job, as: "jobs" }, "title", orderReq[0][1]],
      ];
      order = stageOrder;
    }

    if (orderReq[0][0] === "recruiter") {
      const recruiterOrder = [
        [{ model: User, as: "users" }, "firstName", orderReq[0][1]],
      ];
      order = recruiterOrder;
    }

    if (orderReq[0][0] === "name") {
      const nameOrder = [["firstName", orderReq[0][1]]];
      order = nameOrder;
    }

    if (orderReq[0][0] === "createdAt") {
      order = orderReq;
    }

    Candidate.findAndCountAll({
      limit: this.parseLimit(req),
      offset: this.parseOffset(req),
      where: whereName,
      attributes: [
        "id",
        "firstName",
        "lastName",
        "source",
        "linkedinProfile",
        "referral",
        "createdAt",
      ],
      include: [
        {
          model: Job,
          as: "jobs",
          attributes: ["id", "title", "location", "details", "status", "tags"],
          through: { attributes: [] },
        },
        {
          model: Stage,
          as: "stage",
          attributes: ["id", "name", "details"],
          where: whereStage,
        },
        {
          model: User,
          as: "users",
          where: { roleId: 2 },
          attributes: ["id", "firstName", "lastName"],
          through: { attributes: [] },
          required: false,
        },
      ],
      order: order,
    })
      .then((response) => {
        return {
          count: response.count,
          rows: response.rows.map((candidate) =>
            candidate.get({ plain: true }),
          ),
        };
      })
      .then((candidatesPlain) => {
        const candidatesRes = candidatesPlain.rows.map((candidate) => {
          const candidateFormatted = {
            ...candidate,
            recruiter: candidate["users"][0],
          };
          delete candidateFormatted["users"];
          return candidateFormatted;
        });

        return res
          .status(200)
          .json({ count: candidatesPlain.count, rows: candidatesRes });
      })
      .catch((err) => {
        console.log(err);
        Controller.serverError(res);
      });
  }

  async statistics(req: Request, res: Response) {
    try {
      const all = await Candidate.count();

      const prospective = await Candidate.count({
        include: [
          {
            model: Stage,
            as: "stage",
            where: { name: "PROSPECTIVE" },
          },
        ],
      });

      const active = await Candidate.count({
        include: [
          {
            model: Stage,
            as: "stage",
            where: { name: "ACTIVE" },
          },
        ],
      });

      const hired = await Candidate.count({
        include: [
          {
            model: Stage,
            as: "stage",
            where: { name: "HIRED" },
          },
        ],
      });

      const rejected = await Candidate.count({
        include: [
          {
            model: Stage,
            as: "stage",
            where: { name: "REJECTED" },
          },
        ],
      });

      return res
        .status(201)
        .json({ all, prospective, active, hired, rejected });
    } catch (error) {
      console.log(error);
      Controller.serverError(res);
    }
  }

  async createCandidate(req: Request, res: Response) {
    try {
      const {
        firstName,
        lastName,
        phone,
        email,
        website,
        source,
        linkedin,
        referral,
        type,
        recruiterId,
        jobId,
        stageId,
        salaryOffer,
        firstContact,
        techInterview1,
        techInterview2,
        country,
        state,
        city,
      } = req.body;

      if (!jobId) {
        Controller.badRequest(res);
      }

      const resume = req["files"]["resume"];
      const file = resume ? resume[0] : "";

      //find if email exist in candidate
      const duplicateEmail = await Candidate.findOne({
        where: {
          email: email,
        },
      });

      if (!duplicateEmail) {
        const candidate = await Candidate.create({
          firstName,
          lastName,
          phone,
          email,
          website,
          source,
          linkedinProfile: linkedin,
          referral,
          employer: "the ksquare group",
          resume: file && `api/uploads/${file.filename}`,
          stageId,
          salaryOffer,
          country,
          state,
          city,
        });

        await CandidateUser.create({
          userId: recruiterId,
          candidateId: candidate.id,
        });

        await CandidateJob.create({
          jobId,
          candidateId: candidate.id,
        });

        const interviewers = [
          recruiterId,
          ...JSON.parse(firstContact),
          ...JSON.parse(techInterview1),
          ...JSON.parse(techInterview2),
        ];

        //delete duplicates
        const uniqueInterviewers = [...new Set(interviewers)];

        if (uniqueInterviewers.length > 0) {
          for (let i = 0; i < uniqueInterviewers.length; i++) {
            if (uniqueInterviewers[i] !== req.session.user.id) {
              await Notification.create({
                userId: req.session.user.id,
                candidateId: candidate.id,
                receiver: uniqueInterviewers[i],
                message: "You have been assigned to a candidate",
                read: false,
                type: "candidate",
              });
            }
          }
        }

        const managers = await JobUser.findAll({
          where: {
            jobId: jobId,
          },
        });

        if (managers.length > 0) {
          for (let i = 0; i < managers.length; i++) {
            if (managers[i].userId !== req.session.user.id) {
              await Notification.create({
                userId: req.session.user.id,
                candidateId: candidate.id,
                receiver: managers[i].userId,
                message: "There is a candidate for your position",
                read: false,
                type: "candidate",
              });
            }
          }
        }

        if (file) {
          await Document.create({
            type,
            name: file.originalname,
            candidateId: candidate.id,
            path: `api/uploads/${file.filename}`,
          });
        }

        const process1 = await ProcessInterview.create({
          label: "First Contact",
          candidateId: candidate.id,
        });
        const process2 = await ProcessInterview.create({
          label: "Technical 1",
          candidateId: candidate.id,
        });
        const process3 = await ProcessInterview.create({
          label: "Technical 2",
          candidateId: candidate.id,
        });

        const firstContactUsers: Array<any> = JSON.parse(firstContact);
        const tech1Users: Array<any> = JSON.parse(techInterview1);
        const tech2Users: Array<any> = JSON.parse(techInterview2);

        let i = 0;
        for (i; i < firstContactUsers.length; i++) {
          await ProcessInterviewUser.create({
            processInterviewId: process1.id,
            userId: firstContactUsers[i],
          });
        }
        let j = 0;
        for (j; j < tech1Users.length; j++) {
          await ProcessInterviewUser.create({
            processInterviewId: process2.id,
            userId: tech1Users[j],
          });
        }
        let k = 0;
        for (k; k < tech2Users.length; k++) {
          await ProcessInterviewUser.create({
            processInterviewId: process3.id,
            userId: tech2Users[k],
          });
        }

        const candidateCreated = await Candidate.findOne({
          where: {
            id: candidate.id,
            ...req.session.where,
          },
          attributes: [
            "id",
            "firstName",
            "lastName",
            "employer",
            "email",
            "phone",
            "website",
            "referral",
            "createdAt",
          ],
          include: [
            {
              model: User,
              as: "users",
              where: { roleId: 2 },
              attributes: ["id", "firstName", "lastName"],
              through: { attributes: [] },
            },
            {
              model: Job,
              as: "jobs",
              attributes: [
                "id",
                "title",
                "location",
                "details",
                "status",
                "tags",
              ],
              through: { attributes: [] },
            },
            {
              model: Stage,
              as: "stage",
              attributes: ["id", "name", "details"],
            },
            {
              model: ProcessInterview,
              as: "processInterviews",
              attributes: ["id", "label"],
              include: [
                {
                  model: User,
                  as: "users",
                  attributes: ["id", "firstName", "lastName"],
                  through: { attributes: [] },
                },
              ],
            },
            {
              model: Feedback,
              as: "feedbacks",
              attributes: ["id", "comment", "score", "createdAt"],
              include: [
                {
                  model: User,
                  as: "user",
                  attributes: ["id", "firstName", "lastName"],
                },
              ],
            },
            {
              model: Notes,
              as: "notes",
              attributes: ["id", "note", "createdAt"],
              include: [
                {
                  model: User,
                  as: "user",
                  attributes: ["id", "firstName", "lastName"],
                },
              ],
            },
            {
              model: Document,
              as: "documents",
            },
          ],
        });
        const candidateCreatedPlain = await candidateCreated.get({
          plain: true,
        });

        const candidateFormatted = {
          ...candidateCreatedPlain,
          recruiter: candidateCreatedPlain["users"][0],
        };

        delete candidateFormatted["users"];
        return res.status(200).json(candidateFormatted);
      } else {
        res.status(409).json("Duplicate Email");
      }
    } catch (error) {
      console.log(error);
      Controller.serverError(res);
    }
  }

  async createApplicant(req: Request, res: Response) {
    try {
      const {
        firstName,
        lastName,
        phone,
        email,
        website,
        linkedin,
        type,
        jobId,
        country,
        state,
        city,
      } = req.body;

      const resume = req["files"]["resume"];
      const file = resume ? resume[0] : "";

      //find if email exist in candidate
      const duplicateEmail = await Candidate.findOne({
        where: {
          email: email,
        },
      });

      if (!duplicateEmail) {
        const candidate = await Candidate.create({
          firstName,
          lastName,
          phone,
          email,
          website,
          country,
          state,
          city,
          linkedinProfile: linkedin,
          employer: "the ksquare group",
          jobId,
          stageId: 1,
          source: "Website",
          resume: file && `api/uploads/${file.filename}`,
        });

        await CandidateJob.create({
          jobId,
          candidateId: candidate.id,
        });

        if (file) {
          await Document.create({
            type,
            name: file.originalname,
            candidateId: candidate.id,
            path: `api/uploads/${file.filename}`,
          });
        }

        const process1 = await ProcessInterview.create({
          label: "First Contact",
          candidateId: candidate.id,
        });
        const process2 = await ProcessInterview.create({
          label: "Technical 1",
          candidateId: candidate.id,
        });
        const process3 = await ProcessInterview.create({
          label: "Technical 2",
          candidateId: candidate.id,
        });

        const recruiter = await User.findAll({
          where: { roleId: 2 },
        });

        const job = await Job.findOne({ where: { id: jobId } });

        const limit = recruiter.length;
        for (let i = 0; i < limit; i++) {
          await Notification.create({
            userId: recruiter[i].id,
            candidateId: candidate.id,
            receiver: recruiter[i].id,
            message: `A new candidate has applied to the ${job.title} position.`,
            read: false,
            type: "application",
          });
        }

        return res.status(201).json({
          message: "Success",
        });
      } else {
        res.status(409).json("Duplicate Email");
      }
    } catch (error) {
      console.log(error);
      Controller.serverError(res);
    }
  }

  /**
   * Validates Recaptcha
   *
   */

  async validateRecaptcha(req: Request, res: Response, next: Function) {
    try {
      const authorization: string = req.get("Authorization");
      if (
        authorization === undefined ||
        authorization === "" ||
        authorization === null
      ) {
        return Controller.badRequest(
          res,
          "Bad Request: No captcha token in request.",
        );
      }

      const secretKey = process.env.RECAPTCHA_SECRET;
      const verificationUrl =
        "https://www.google.com/recaptcha/api/siteverify?secret=" +
        secretKey +
        "&response=" +
        authorization +
        "&remoteip=" +
        req.connection.remoteAddress;
      const response = await axios.post(verificationUrl);
      if (response.data.success) {
        next();
      } else {
        return Controller.unauthorized(res);
      }
    } catch (error) {
      return Controller.badRequest(res);
    }
  }

  async updateRelations(req: Request, res: Response) {
    try {
      const { jobId, stageId, recruiterId, processInterviews } = req.body;
      const { id } = req.params;
      if (!jobId && !id) {
        Controller.badRequest(res);
      }
      const candidate = (await Candidate.findOne({
        where: { id: id },
        include: [
          {
            model: Stage,
            as: "stage",
            attributes: ["id", "name", "details"],
          },
          {
            model: User,
            as: "users",
            where: { roleId: 2 },
            attributes: ["id", "firstName", "lastName"],
            through: { attributes: [] },
            required: false,
          },
          {
            model: ProcessInterview,
            as: "processInterviews",
            attributes: ["id", "label"],
            include: [
              {
                model: User,
                as: "users",
                attributes: ["id", "firstName", "lastName"],
                through: { attributes: [] },
              },
            ],
          },
        ],
      })) as CandidateUtils;

      //Compare the differences between old interviewers and new interviewers, and send a notification only to the new interviewers.

      //Old Interviewers
      const candidatePlain: any = candidate.get({ plain: true });
      const oldInterviewers: Array<any> = candidatePlain.processInterviews.map(
        (process) => process.users,
      );
      const oldInterviewersFlat = []
        .concat(...oldInterviewers)
        .map((user) => user.id);

      //delete duplicates
      const uniqueOldInterviewers = [...new Set(oldInterviewersFlat)];

      //New interviewers
      const newInterviewers: Array<any> = processInterviews.map(
        (process) => process.users,
      );
      const interviewersFlat = []
        .concat(...newInterviewers)
        .map((user) => user.id);

      //delete duplicates
      const uniqueInterviewers = [...new Set(interviewersFlat)];

      const interviewers = _.difference(
        uniqueInterviewers,
        uniqueOldInterviewers,
      );

      if (interviewers.length > 0) {
        for (let i = 0; i < interviewers.length; i++) {
          if (interviewers[i] !== req.session.user.id) {
            await Notification.create({
              userId: req.session.user.id,
              candidateId: candidate.id,
              receiver: interviewers[i],
              message: "You have been assigned to a candidate",
              read: false,
              type: "candidate",
            });
          }
        }
      }

      //Send email to new recruiters
      // update recruiter
      const oldRecruiterId = candidatePlain.users[0]
        ? candidatePlain.users[0].id
        : null;

      if (recruiterId != oldRecruiterId && recruiterId) {
        if (recruiterId !== req.session.user.id) {
          await Notification.create({
            userId: req.session.user.id,
            candidateId: candidate.id,
            receiver: recruiterId,
            message: "You have been assigned to a candidate",
            read: false,
            type: "candidate",
          });
        }

        await CandidateUser.destroy({
          where: { candidateId: id },
        });

        await CandidateUser.create({
          candidateId: id,
          userId: recruiterId,
        });
      }

      const user = await CandidateUser.findOne({
        where: { candidateId: candidate.id },
      });

      if (user) {
        //Send email to the candidate if the stage change and it has a recruiter

        const recruiter = await User.findOne({
          where: { id: user.userId },
        });

        if (candidate.stageId != req.body.stageId) {
          const stages = ["PROSPECTIVE", "ACTIVE", "HIRED", "REJECTED"];
          //In the case of being rejected, a personal email would be sent by the HR Team
          if (stageId !== stages.length) {
            mailer.sendEmail(
              candidate.email,
              `The Ksquare Group - Your application has an update.`,
              "stage",
              "en",
              {
                recruiter: `${recruiter.firstName} ${recruiter.lastName}`,
                name: `${candidate.firstName} ${candidate.lastName}`,
              },
            );
          }
        }
      }

      await candidate.update(req.body);

      //update Job
      const job: Job = await Job.findOne({ where: { id: jobId } });
      await candidate.setJobs([job]);
      //update stage table information
      const changeStage = await Stage.findOne({
        where: { id: stageId },
      });
      await changeStage.update(req.body);
      //update process interview table information
      if (req.body.processInterviews) {
        const limit = req.body.processInterviews.length;
        const process = req.body.processInterviews;
        for (let i = 0; i < limit; i++) {
          await ProcessInterviewUser.destroy({
            where: { processInterviewId: process[i].id },
          });
          const userLength = process[i].users.length;
          for (let j = 0; j < userLength; j++) {
            await ProcessInterviewUser.create({
              userId: process[i].users[j].id,
              processInterviewId: process[i].id,
            });
          }
        }
      }
      /* const response = await Candidate.findOne({
        where: { id: id },
        include: [
          {
            model: User,
            as: "users",
            where: { roleId: 2 },
            attributes: ["id", "firstName", "lastName"],
            through: { attributes: [] },
          },
          {
            model: Job,
            as: "jobs",
            attributes: [
              "id",
              "title",
              "location",
              "details",
              "status",
              "tags",
            ],
            through: { attributes: [] },
          },
          {
            model: Stage,
            as: "stage",
            attributes: ["id", "name", "details"],
          },
          {
            model: ProcessInterview,
            as: "processInterviews",
            attributes: ["id", "label"],
            include: [
              {
                model: User,
                as: "users",
                attributes: ["id", "firstName", "lastName"],
                through: { attributes: [] },
              },
            ],
          },
        ],
      });
      const candidatePlain = await response.get({ plain: true });
      const candidateFormatted = {
        ...candidatePlain,
        recruiter: candidatePlain["users"][0],
      };

      delete candidateFormatted["users"]; */

      return res.status(200).json("Success");
    } catch (error) {
      console.log(error);
      Controller.serverError(res);
    }
  }

  findOne(req: Request, res: Response) {
    Candidate.findOne({
      where: {
        id: req.params.id,
        ...req.session.where,
      },
      attributes: [
        "id",
        "firstName",
        "lastName",
        "employer",
        "email",
        "phone",
        "website",
        "source",
        "linkedinProfile",
        "referral",
        "salaryOffer",
        "createdAt",
        "country",
        "state",
        "city",
      ],
      include: [
        {
          model: User,
          as: "users",
          where: { roleId: 2 },
          attributes: ["id", "firstName", "lastName"],
          through: { attributes: [] },
          required: false,
        },
        {
          model: Job,
          as: "jobs",
          attributes: ["id", "title", "status", "jobId"],
          through: { attributes: [] },
        },
        {
          model: Stage,
          as: "stage",
          attributes: ["id", "name", "details"],
        },
        {
          model: ProcessInterview,
          as: "processInterviews",
          attributes: ["id", "label"],
          include: [
            {
              model: User,
              as: "users",
              attributes: ["id", "firstName", "lastName"],
              through: { attributes: [] },
            },
          ],
        },
        {
          model: Feedback,
          as: "feedbacks",
          attributes: ["id", "comment", "score", "createdAt"],
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "firstName", "lastName"],
            },
          ],
        },
        {
          model: Notes,
          as: "notes",
          attributes: ["id", "note", "createdAt"],
          include: [
            {
              model: User,
              as: "user",
              attributes: ["id", "firstName", "lastName"],
            },
          ],
        },
        {
          model: Document,
          as: "documents",
        },
      ],
      order: [
        [{ model: Feedback, as: "feedbacks" }, "createdAt", "DESC"],
        [{ model: Notes, as: "notes" }, "createdAt", "DESC"],
      ],
    })
      .then((response) => {
        return response.get({ plain: true });
      })
      .then((candidatePlain) => {
        const candidateFormatted = {
          ...candidatePlain,
          recruiter: candidatePlain["users"][0],
        };

        delete candidateFormatted["users"];

        if (req.session.jwt.role.level === LEVEL_PERMISSION.INTERVIEWER) {
          delete candidateFormatted["salaryOffer"];
          delete candidateFormatted["notes"];
        }
        return res.status(200).json(candidateFormatted);
      })
      .catch((err) => {
        console.log(err);
        Controller.serverError(res);
      });
  }
}

const candidate = new CandidateController();
export default candidate;
