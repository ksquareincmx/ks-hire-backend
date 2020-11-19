import { Column, ForeignKey, Table } from "sequelize-typescript";

import { BaseModel } from "../libraries/BaseModel";
import { Candidate } from "./Candidate";
import { Job } from "./Job";

@Table({
  tableName: "candidatejob",
})
export class CandidateJob extends BaseModel<CandidateJob> {
  @ForeignKey(() => Candidate)
  @Column
  candidateId: string;

  @ForeignKey(() => Job)
  @Column
  jobId: string;
}
