import {
  BeforeCreate,
  ForeignKey,
  BelongsTo,
  DataType,
  Column,
  Table,
} from "sequelize-typescript";
import * as uuid from "uuid";

import { BaseModel } from "../libraries/BaseModel";
import { Candidate } from "./Candidate";
import { User } from "./User";
import { Profile } from "./Profile";

import mailer from "../services/EmailService";
import { config } from "../config/config";
import { log } from "../libraries/Log";
import { CandidateUser } from "./CandidateUser";
import candidate from "@/controllers/v1/Candidate";
import { Job } from "./Job";

const emailNotification = (
  user: any,
  name: string,
  subject: string,
  template: string,
  candidate: any,
  job: any,
): Promise<any> => {
  return mailer
    .sendEmail(user.email, subject, template, user.profile.locale, {
      url:
        template === "job"
          ? `${config.urls.base}/jobs/${job}`
          : `${config.urls.base}/candidates/${candidate}`,
      name: name || user.email,
    })
    .then((info) => {
      // log.debug("Sending email to:", user.email, info);
      return info;
    });
};

const sendEmailNotification = (
  email: string,
  subject: string,
  type: string,
  candidate: any,
  job: any,
): Promise<any> => {
  return Promise.resolve(
    User.findOne({
      where: { email },
      include: [{ model: Profile, as: "profile" }],
    })
      .then((user) => {
        if (!user) {
          throw { error: "notFound", msg: "Email not found" };
        }
        return {
          email,
          name: `${user.firstName} ${user.lastName}`,
          user,
        };
      })
      .then((emailInfo) => {
        return emailNotification(
          emailInfo.user,
          emailInfo.name,
          subject,
          type,
          candidate,
          job,
        );
      }),
  );
};

@Table({
  tableName: "notification",
})
export class Notification extends BaseModel<Notification> {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    allowNull: true,
  })
  id: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null,
  })
  message: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: true,
    defaultValue: false,
  })
  read: boolean;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null,
  })
  type: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  receiver: string;

  @ForeignKey(() => User)
  userId: number;

  @BelongsTo(() => User)
  user: User;

  @ForeignKey(() => Candidate)
  candidateId: number;

  @BelongsTo(() => Candidate)
  candidate: Candidate;

  @ForeignKey(() => Job)
  jobId: number;

  @BelongsTo(() => Job)
  job: Job;

  @BeforeCreate
  static async addUUID(notification: Notification, _options: any) {
    notification.addUniqID();
    const user = await User.findOne({ where: { id: notification.receiver } });
    sendEmailNotification(
      user.email,
      notification.message,
      notification.type,
      notification.candidateId,
      notification.jobId,
    );
  }

  addUniqID() {
    this.id = uuid();
  }
}
