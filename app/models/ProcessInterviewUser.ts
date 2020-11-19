import { Column, ForeignKey, Table } from "sequelize-typescript";

import { BaseModel } from "../libraries/BaseModel";
import { ProcessInterview } from "./ProcessInterview";
import { User } from "./User";

@Table({
  tableName: "processinterviewuser",
})
export class ProcessInterviewUser extends BaseModel<ProcessInterviewUser> {
  @ForeignKey(() => User)
  @Column
  userId: string;

  @ForeignKey(() => ProcessInterview)
  @Column
  processInterviewId: string;
}
