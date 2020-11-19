import { Request, Response } from "express";
import * as _ from "lodash";

import auth from "./../controllers/v1/Auth";
import { Controller } from "./../libraries/Controller";
import LEVEL_PERMISSION from "../utils/LevelPermissions";

/**
 * Validates a JWT
 * puts decoded jwt in req.session.jwt
 * puts user object with id, email and role in req.session.user
 * type: type of jwt e.g: 'access' or 'refresh'
 * @param {type} type
 */
export function validateJWT(type: string) {
  return (req: Request, res: Response, next: Function) => {
    let token: string = null;
    const authorization: string = req.get("Authorization");

    if (!authorization) {
      Controller.unauthorized(res, "No Token Present");
      return null;
    }

    const parts: Array<string> = authorization.split(" ");
    if (parts.length === 2) {
      const scheme: string = parts[0];
      const credentials: string = parts[1];

      if (/^Bearer$/i.test(scheme)) {
        token = credentials;
      }
    }

    auth
      .validateJWT(token, type)
      .then((decoded) => {
        if (!decoded) {
          Controller.unauthorized(res, "Invalid Token");
          return null;
        }
        if (req.session == null) req.session = {};
        req.session.jwt = decoded;
        req.session.jwtstring = token;
        req.session.user = _.pick(decoded, ["id", "email", "role"]);
        next();
        return null;
      })
      .catch((err) => {
        Controller.unauthorized(res, err);
      });
  };
}

/**
 * Enforces access only to interviewer
 * key: key to compare to, Default: interviewerId
 * @param {Key} key
 */
export function filterInterviewer(key = "interviewerId") {
  return (req: Request, res: Response, next: Function) => {
    if (req.session.jwt.role === LEVEL_PERMISSION.INTERVIEWER) {
      if (req.session == null) req.session = {};
      const id = req.session.jwt.id;

      if (!id == null) {
        return Controller.unauthorized(res);
      }

      if (!req.session.where) {
        req.session.where = {};
      }

      req.session.where[key] = id;
    }
    next();
  };
}

/**
 * Enforces access only to owner
 * key: key to compare to, Default: userId
 * @param {Key} key
 */
export function filterOwner(key = "userId") {
  return (req: Request, res: Response, next: Function) => {
    if (req.session.jwt.role.level !== LEVEL_PERMISSION.ADMINISTRATOR) {
      if (req.session == null) req.session = {};
      const id = req.session.jwt.id;

      if (!id == null) {
        return Controller.unauthorized(res);
      }

      if (!req.session.where) {
        req.session.where = {};
      }

      req.session.where[key] = id;

      next();
    } else {
      next();
    }
  };
}

export function isOwner(model: any, key = "userId") {
  return (req: Request, res: Response, next: Function) => {
    const userId = req.session.jwt.id;
    if (userId == null) return Controller.unauthorized(res);
    const id = Number(req.params.id);
    if (id == null)
      return Controller.badRequest(res, "Bad Request: No id in request.");
    model
      .findByPk(id)
      .then((result: any) => {
        if (!result) return Controller.notFound(res);
        if (result[key] !== userId) return Controller.forbidden(res);
        req.session.instance = result;
        next();
      })
      .catch(() => {
        Controller.serverError(res);
      });
  };
}

/**
 * Appends userId to body (useful for enforcing ownership when creating items)
 * key: key to add/modify on body
 * @param {Key} key
 */
export function appendUser(key = "userId") {
  return (req: Request, res: Response, next: Function) => {
    if (req.session == null) req.session = {};
    const id = req.session.jwt.id;
    if (id == null) return Controller.unauthorized(res);
    if (!req.body) req.body = {};
    req.body[key] = id;
    next();
  };
}

/*
  Strips nested objects, substituting with their id (if any)
*/
export function stripNestedObjects() {
  return (req: Request, res: Response, next: Function) => {
    if (!req.body) req.body = {};
    // Iterate through all keys in the body
    for (const key in req.body) {
      if (req.body.hasOwnProperty(key)) {
        // Validate if not from prototype
        if (
          Object.prototype.toString.call(req.body[key]) === "[object Object]"
        ) {
          // Append id and delete original
          if (req.body[key].id !== undefined)
            req.body[`${key}Id`] = req.body[key].id;
          delete req.body[key];
        }
      }
    }
    next();
  };
}

/*
  Only allows certain roles to pass
*/
export function filterRoles(roles: Array<string>) {
  return (req: Request, res: Response, next: Function) => {
    if (!req.session) req.session = {};
    const role = req.session.jwt.role;
    if (!role) {
      return Controller.unauthorized(res);
    }
    if (!roles.includes(role.level)) {
      return Controller.unauthorized(res);
    }
    next();
  };
}

/*
  Checks if the requested user is self
  ** Only applicable to UserController
*/
export function isSelfUser() {
  return (req: Request, res: Response, next: Function) => {
    if (req.session == null) req.session = {};
    const id = req.session.jwt.id;

    if (!id) {
      return Controller.unauthorized(res);
    }

    if (parseInt(id) !== parseInt(req.params.id)) {
      return Controller.unauthorized(res);
    }

    next();
  };
}
