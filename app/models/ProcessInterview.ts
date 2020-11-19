import {
  Column,
  DataType,
  Table,
  BeforeCreate,
  BelongsToMany,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import { BaseModel } from "../libraries/BaseModel";
import * as uuid from "uuid";
import { User } from "./User";
import { ProcessInterviewUser } from "./ProcessInterviewUser";
import { Candidate } from "./Candidate";

@Table({
  tableName: "processinterview",
})
export class ProcessInterview extends BaseModel<ProcessInterview> {
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
  label: string;

  @ForeignKey(() => Candidate)
  candidateId: string;

  @BelongsTo(() => Candidate)
  candidate: Candidate;

  @BelongsToMany(() => User, () => ProcessInterviewUser)
  users: Array<User & { ProcessInterviewUser: ProcessInterviewUser }>;

  @BeforeCreate
  static addUUID(processInterview: ProcessInterview, _options: any) {
    processInterview.addUniqID();
  }

  addUniqID() {
    this.id = uuid();
  }
}

export interface ProcessInterviewUtils extends ProcessInterview {
  setUsers: (users: User[]) => User[];
}
