import { Request, Response, Router, NextFunction } from "express";
import * as path from "path";
import * as fs from "fs";
import * as multer from "multer";
import * as uuid from "uuid";

import { Controller } from "./../../libraries/Controller";
import { Document } from "./../../models/Document";
import { validateJWT, filterRoles } from "./../../policies/General";
import LEVEL_PERMISSION from "../../utils/LevelPermissions";

interface MulterRequest extends Request {
  file: any;
}
export class DocumentController extends Controller {
  constructor() {
    super();
    this.name = "document";
    this.model = Document;
  }

  //Multer configuration
  private storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const filePath = path.join(__dirname, "../../../public/api/uploads");
      fs.mkdirSync(filePath, { recursive: true });
      cb(null, filePath);
    },
    filename: (req, file, cb) => {
      cb(null, uuid() + path.extname(file.originalname));
    },
  });

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
      cb(
        new Error(
          "Error: File upload only supports the following filetypes - " +
            filetypes,
        ),
      );
    },
    limits: { files: Infinity },
  });

  routes(): Router {
    this.router.all("*", validateJWT("access"));

    //this.router.get("/", (req, res) => this.find(req, res));

    this.router.post(
      "/",
      this.upload.single("file"),
      (req, res, next) => this.validateFields(req, res, next),
      (req, res) => this.create(req, res),
    );

    //this.router.get("/:id", (req, res) => this.findOne(req, res));

    /* this.router.put(
      "/:id",
      this.upload.single("file"),
      (req, res, next) => this.validateFields(req, res, next),
      (req, res) => this.update(req, res),
    ); */

    this.router.delete(
      "/:id",
      filterRoles([
        LEVEL_PERMISSION.ADMINISTRATOR,
        LEVEL_PERMISSION.RECRUITER,
        LEVEL_PERMISSION.MANAGER,
      ]),
      (req, res) => this.deleteFile(req, res),
    );

    //this.router.get("/file/:id", (req, res) => this.getFile(req, res));

    return this.router;
  }

  getFile(req: Request, res: Response) {
    const { id } = req.params;
    this.model
      .findOne({ where: { id } })
      .then((data) => {
        const file = path.join(
          __dirname,
          ".../../../public/api/uploads/",
          data.path,
        );
        res.sendFile(file);
      })
      .catch((err) => Controller.serverError(err));
  }

  validateFields(req: Request, res: Response, next: NextFunction) {
    const { name, candidateId } = req.body;
    const { file }: any = req;
    req.body.candidateId = req.body.candidateId;
    req.body.path = "api/uploads/" + file.filename;

    if (name === undefined || candidateId === undefined) {
      Controller.badRequest(res);
    } else {
      next();
    }
  }

  deleteFile(req: Request, res: Response) {
    const { id } = req.params;
    this.model
      .findOne({ where: { id } })
      .then((data) => {
        const file = path.join(__dirname, "../../../public/", data.path);
        data.destroy(req, res);
        fs.unlink(file, (err) => {
          if (err) throw err;
        });
        return res.status(200).json(req.params);
      })
      .catch((err) => Controller.serverError(err));
  }
}

const document = new DocumentController();
export default document;
