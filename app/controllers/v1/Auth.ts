import { Request, Response, Router } from "express";
import * as jwt from "jsonwebtoken";
import * as _ from "lodash";
import * as moment from "moment";
import * as uuid from "uuid";
import axios from "axios";

import { Role } from "../../models/Role";
import { config } from "./../../config/config";
import { Controller } from "./../../libraries/Controller";
import { JWTBlacklist } from "./../../models/JWTBlacklist";
import { User } from "./../../models/User";
import { validateJWT } from "./../../policies/General";

export class AuthController extends Controller {
  constructor() {
    super();
    this.name = "auth";
  }

  routes(): Router {
    this.router.post("/login", (req, res) => this.validateAADToken(req, res));
    /*  this.router.post("/logout", validateJWT("access"), (req, res) =>
      this.logout(req, res),
    );
    this.router.post("/refresh", validateJWT("refresh"), (req, res) =>
      this.refreshToken(req, res),
    ); */

    return this.router;
  }

  public createToken(user: any, type: string) {
    const expiryUnit: any = config.jwt[type].expiry.unit;
    const expiryLength = config.jwt[type].expiry.length;
    const expires = moment().add(expiryLength, expiryUnit).valueOf();
    const issued = Date.now();
    const expires_in = (expires - issued) / 1000; // seconds
    const token = jwt.sign(
      {
        id: user.id,
        sub: config.jwt[type].subject,
        aud: config.jwt[type].audience,
        exp: expires,
        iat: issued,
        jti: uuid.v4(),
        email: user.email,
        role: user.role,
      },
      config.jwt.secret,
    );

    return {
      token: token,
      expires: expires,
      expires_in: expires_in,
    };
  }

  protected getCredentials(user: any): any {
    // Prepare response object
    const token = this.createToken(user, "access");
    const refreshToken = this.createToken(user, "refresh");
    const credentials = {
      token: token.token,
      expires: token.expires,
      refresh_token: refreshToken,
      user: _.pick(user, [
        "id",
        "firstName",
        "lastName",
        "email",
        "profilePicture",
        "roleId",
      ]),
    };
    return credentials;
  }

  public validateJWT(token: string, type: string): Promise<any> {
    // Decode token
    let decodedjwt: any;
    try {
      decodedjwt = jwt.verify(token, config.jwt.secret);
    } catch (err) {
      return Promise.reject(err);
    }
    const reqTime = Date.now();
    // Check if token expired
    if (decodedjwt.exp <= reqTime) {
      return Promise.reject("Token expired");
    }
    // Check if token is early
    if (!_.isUndefined(decodedjwt.nbf) && reqTime <= decodedjwt.nbf) {
      return Promise.reject("This token is early.");
    }

    // If audience doesn't match
    if (config.jwt[type].audience !== decodedjwt.aud) {
      return Promise.reject("This token cannot be accepted for this domain.");
    }

    // If the subject doesn't match
    if (config.jwt[type].subject !== decodedjwt.sub) {
      return Promise.reject("This token cannot be used for this request.");
    }

    // Check if blacklisted
    return Promise.resolve(
      JWTBlacklist.findOne({ where: { token: token } })
        .then((result) => {
          // if exists in blacklist, reject
          if (result != null)
            return Promise.reject("This Token is blacklisted.");
          return Promise.resolve(decodedjwt);
        })
        .catch((err) => {
          return Promise.reject(err);
        }),
    );
  }

  public validateAADToken = async (req: Request, res: Response) => {
    //create certificate
    const getCertificate = async (kid) => {
      try {
        const openIdURL =
          "https://login.microsoftonline.com/e44da4b5-dcf3-40d7-9a30-85de7cefd46a/v2.0/.well-known/openid-configuration";
        const { data: metadata } = await axios.get(openIdURL);
        const { data: signingKeys } = await axios.get(metadata.jwks_uri);
        const signingKey = signingKeys.keys.find((key) => key.kid === kid);
        const [key] = signingKey.x5c;

        return `-----BEGIN CERTIFICATE-----\n${key}\n-----END CERTIFICATE-----`;
      } catch (e) {
        return e;
      }
    };
    //validate token with certificate
    const verifyToken = async (accessToken, decodedToken) => {
      const certificate = await getCertificate(decodedToken.header.kid);
      const issuer =
        "https://sts.windows.net/e44da4b5-dcf3-40d7-9a30-85de7cefd46a/";
      const options = {
        complete: true,
        issuer,
        algorithms: ["RS256"],
      };
      return jwt.verify(accessToken, certificate, options);
    };

    const accessToken = req.body.token;

    try {
      const decodedToken = jwt.decode(accessToken, { complete: true });
      const token = (await verifyToken(accessToken, decodedToken)) as any;
      //search for user and if doesn't exist create one with min role
      const userExist = await User.findOne({
        include: [
          {
            model: Role,
            as: "role",
          },
        ],
        where: { email: token.unique_name },
      }).then((user) => {
        if (!user) {
          return false;
        }
        return user;
      });
      if (!userExist) {
        try {
          const newUser = {
            firstName: token.given_name,
            lastName: token.family_name,
            email: token.unique_name,
            msId: token.oid,
            roleId: 3,
          };
          // console.log(newUser);
          //return await User.create(newUser);
          const userCreated = await User.create(newUser);
          const userCreatedInfo = await User.findOne({
            include: [
              {
                model: Role,
                as: "role",
              },
            ],
            where: { id: userCreated.id },
          }).then((userInfo) => {
            return userInfo;
          });
          const credentials: any = this.getCredentials(userCreatedInfo);
          return Controller.ok(res, credentials);
        } catch (e) {
          return e;
        }
      }
      const credentials: any = this.getCredentials(userExist);
      return Controller.ok(res, credentials);
    } catch (e) {
      console.log(e);
      return Controller.badRequest(res);
    }
  };

  logout(req: Request, res: Response) {
    const token: string = req.session.jwtstring;
    const decodedjwt: any = req.session.jwt;
    if (_.isUndefined(token)) return Controller.unauthorized(res);
    if (_.isUndefined(decodedjwt)) return Controller.unauthorized(res);
    // Put token in blacklist
    JWTBlacklist.create({
      token: token,
      expires: decodedjwt.exp,
    })
      .then(() => {
        Controller.ok(res);
        return null;
      })
      .catch((err) => {
        return Controller.serverError(res, err);
      });
  }

  refreshToken(req: Request, res: Response) {
    // Refresh token has been previously authenticated in validateJwt as refresh token
    const refreshToken: string = req.session.jwtstring;
    const decodedjwt: any = req.session.jwt;
    const reqUser: any = req.session.user;
    // Put refresh token in blacklist
    JWTBlacklist.create({
      token: refreshToken,
      expires: decodedjwt.exp,
    })
      .then(() => {
        return User.findOne({ where: { id: reqUser.id } });
      })
      .then((user: any) => {
        if (!user) {
          return Controller.unauthorized(res);
        }
        // Create new token and refresh token and send
        const credentials: any = this.getCredentials(user);
        return Controller.ok(res, credentials);
      })
      .catch((err) => {
        return Controller.serverError(res, err);
      });
  }
}

const controller = new AuthController();
export default controller;
