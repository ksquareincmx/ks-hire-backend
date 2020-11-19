import { Router, Request, Response } from "express";

import LEVEL_PERMISSION from "../../utils/LevelPermissions";
import { Controller } from "./../../libraries/Controller";
import { Notes } from "./../../models/Notes";
import { Candidate } from "./../../models/Candidate";
import { Notification } from "./../../models/Notification";
import {
  appendUser,
  filterOwner,
  filterRoles,
  stripNestedObjects,
  validateJWT,
} from "./../../policies/General";
import { User } from "@/models/User";
import { CandidateUser } from "@/models/CandidateUser";
import * as sanitizeHtml from "sanitize-html";
import {
  noteValidationRules,
  editNoteValidationRules,
  validate,
} from "../../utils/validator";

export class NotesController extends Controller {
  constructor() {
    super();
    this.name = "note";
    this.model = Notes;
  }

  routes(): Router {
    this.router.get("/", validateJWT("access"), filterOwner(), (req, res) =>
      this.find(req, res),
    );
    this.router.get("/:id", validateJWT("access"), filterOwner(), (req, res) =>
      this.findOne(req, res),
    );
    this.router.post(
      "/",
      validateJWT("access"),
      filterRoles([
        LEVEL_PERMISSION.ADMINISTRATOR,
        LEVEL_PERMISSION.RECRUITER,
        LEVEL_PERMISSION.MANAGER,
      ]),
      stripNestedObjects(),
      appendUser(),
      noteValidationRules(),
      validate,
      (req, res) => this.createNote(req, res),
    );
    this.router.put(
      "/:id",
      validateJWT("access"),
      stripNestedObjects(),
      filterOwner(),
      appendUser(),
      editNoteValidationRules(),
      validate,
      (req, res) => {
        req.body.note = sanitizeHtml(req.body.note, {
          allowedAttributes: {
            "*": ["style"],
            span: [
              "data-index",
              "data-denotation-char",
              "data-id",
              "data-value",
            ],
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
          allowedClasses: {
            span: ["mention"],
          },
        });
        this.update(req, res);
      },
    );
    this.router.delete(
      "/:id",
      validateJWT("access"),
      filterOwner(),
      (req, res) => this.destroy(req, res),
    );

    return this.router;
  }

  async createNote(req: Request, res: Response) {
    try {
      const { mentions } = req.body;
      req.body.note = sanitizeHtml(req.body.note, {
        allowedAttributes: {
          "*": ["style"],
          span: ["data-index", "data-denotation-char", "data-id", "data-value"],
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
        allowedClasses: {
          span: ["mention"],
        },
      });
      const { id, candidateId, userId } = await Notes.create(req.body);

      const notes = await Notes.findOne({
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

      if (mentions.length > 0) {
        for (let i = 0; i < mentions.length; i++) {
          await Notification.create({
            userId,
            candidateId,
            receiver: mentions[i],
            message: "A candidate has a note",
            read: false,
            type: "note",
          });
        }
      }

      return res.status(201).json(notes);
    } catch (error) {
      console.log(error);
      Controller.serverError(res);
    }
  }
}

const note = new NotesController();
export default note;
