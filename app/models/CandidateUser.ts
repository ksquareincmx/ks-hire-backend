import { BeforeCreate, Column, ForeignKey, Table } from "sequelize-typescript";

import { BaseModel } from "../libraries/BaseModel";
import { Candidate } from "./Candidate";
import { Notification } from "./Notification";
import { User } from "./User";

@Table({
  tableName: "candidateuser",
})
export class CandidateUser extends BaseModel<CandidateUser> {
  @ForeignKey(() => Candidate)
  @Column
  candidateId: string;

  @ForeignKey(() => User)
  @Column
  userId: string;

  /* @BeforeCreate
  static sendCreateNotification(candidateUser: CandidateUser) {
    candidateUser.notifyUserCreation();
  }

  async notifyUserCreation() {
    await Notification.create({
      userId: this.userId,
      candidateId: this.candidateId,
      receiver: this.userId,
      message: "You have been assigned a Candidate",
      read: false,
      type: "candidate",
    });
  } */
}
