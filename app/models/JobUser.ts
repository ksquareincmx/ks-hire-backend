import { Column, ForeignKey, Table } from "sequelize-typescript";
import { BaseModel } from "../libraries/BaseModel";
import { User } from "./User";
import { Job } from "./Job";

@Table({
  tableName: "jobuser",
})
export class JobUser extends BaseModel<JobUser> {
  @ForeignKey(() => Job)
  @Column
  jobId: number;

  @ForeignKey(() => User)
  @Column
  userId: number;
}
