import {
  Table,
  Column,
  DataType,
  BelongsTo,
  ForeignKey,
  BeforeCreate,
} from "sequelize-typescript";
import * as uuid from "uuid";

import { BaseModel } from "../libraries/BaseModel";
import { Candidate } from "./Candidate";
import { User } from "./User";

@Table({
  tableName: "feedback",
})
export class Feedback extends BaseModel<Feedback> {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    allowNull: true,
  })
  id: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: null,
  })
  comment: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
    defaultValue: null,
  })
  score: number;

  @ForeignKey(() => Candidate)
  candidateId: number;

  @BelongsTo(() => Candidate)
  candidate: Candidate;

  @ForeignKey(() => User)
  userId: string;

  @BelongsTo(() => User)
  user: User;

  @BeforeCreate
  static addUUID(feedback: Feedback, _options: any) {
    feedback.addUniqID();
  }

  addUniqID() {
    this.id = uuid();
  }
}
