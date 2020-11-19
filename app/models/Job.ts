import {
  Table,
  Column,
  DataType,
  BelongsTo,
  ForeignKey,
  BeforeCreate,
  BelongsToMany,
} from "sequelize-typescript";
import * as uuid from "uuid";

import { User } from "./User";
import { Candidate } from "./Candidate";
import { CandidateJob } from "./CandidateJob";
import { BaseModel } from "../libraries/BaseModel";
import { JobUser } from "./JobUser";
import { Department } from "./Department";

@Table({
  tableName: "job",
})
export class Job extends BaseModel<Job> {
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
  jobId: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null,
  })
  title: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null,
  })
  jobType: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null,
  })
  jobTime: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: null,
  })
  details: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null,
  })
  location: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null,
  })
  salaryLower: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null,
  })
  salaryUpper: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: "Closed",
  })
  status: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null,
  })
  tags: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null,
  })
  salaryCurrency: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  salaryPublic: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null,
  })
  salaryPeriod: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null,
  })
  salaryGross: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  externalManager: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null,
  })
  clientName: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null,
  })
  clientJobId: string;

  /*   @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null,
  })
  jobDepartment: string; */

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null,
  })
  jobSeniority: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null,
  })
  jobUrgency: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: null,
  })
  openAt: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
    defaultValue: null,
  })
  closedAt: Date;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  isJobRemote: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null,
  })
  requiredPositions: string;

  @ForeignKey(() => User)
  userId: string;

  @BelongsTo(() => User)
  jobCreator: User;

  @ForeignKey(() => Department)
  @Column
  departmentId: number;

  @BelongsTo(() => Department)
  department: Department;

  @BelongsToMany(() => Candidate, () => CandidateJob)
  candidates: Array<Candidate & { CandidateJob: CandidateJob }>;

  @BelongsToMany(() => User, () => JobUser)
  hiringManagers: Array<User & { JobUser: JobUser }>;

  @BeforeCreate
  static addUUID(job: Job, _options: any) {
    job.addUniqID();
  }

  addUniqID() {
    this.id = uuid();
  }
}

export interface JobUtils extends Job {
  setHiringManagers: (hiringManagers: User[]) => User[];
}
