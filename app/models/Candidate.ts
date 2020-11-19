import {
  Table,
  Column,
  HasMany,
  DataType,
  BelongsTo,
  ForeignKey,
  BeforeCreate,
  BelongsToMany,
} from "sequelize-typescript";
import * as uuid from "uuid";
import { BaseModel } from "../libraries/BaseModel";
import { CandidateUser } from "./CandidateUser";
import { CandidateJob } from "./CandidateJob";
import { Feedback } from "./Feedback";
import { Document } from "./Document";
import { Notes } from "./Notes";
import { Stage } from "./Stage";
import { User } from "./User";
import { Job } from "./Job";
import { ProcessInterview } from "./ProcessInterview";
import { ProcessInterviewUser } from "./ProcessInterviewUser";

@Table({
  tableName: "candidate",
})
export class Candidate extends BaseModel<Candidate> {
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
  firstName: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null,
  })
  lastName: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null,
  })
  phone: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null,
  })
  email: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null,
  })
  website: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null,
  })
  resume: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null,
  })
  employer: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null,
  })
  source: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null,
  })
  linkedinProfile: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null,
  })
  referral: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null,
  })
  salaryOffer: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null,
  })
  country: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null,
  })
  state: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null,
  })
  city: string;

  @ForeignKey(() => Stage)
  stageId: number;

  @BelongsTo(() => Stage)
  stage: Stage;

  @ForeignKey(() => ProcessInterview)
  processId: string;

  @HasMany(() => Document, "candidateId")
  documents: Document[];

  @HasMany(() => Feedback)
  feedbacks: Feedback[];

  @HasMany(() => Notes)
  notes: Notes[];

  @HasMany(() => ProcessInterview)
  processInterviews: ProcessInterview[];

  @BelongsToMany(() => Job, () => CandidateJob)
  jobs: Array<Job & { CandidateJob: CandidateJob }>;

  @BelongsToMany(() => User, () => CandidateUser)
  users: Array<User & { CandidateUser: CandidateUser }>;

  @BeforeCreate
  static addUUID(candidate: Candidate, _options: any) {
    candidate.addUniqID();
  }

  addUniqID() {
    this.id = uuid();
  }
}

export interface CandidateUtils extends Candidate {
  setUsers: (users: User[]) => User[];
  setJobs: (jobs: Job[]) => Job[];
  setProcess: (processInterviews: ProcessInterview[]) => ProcessInterview[];
  getUsers: () => User[];
}
