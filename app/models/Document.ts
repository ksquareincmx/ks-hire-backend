import {
  Column,
  DataType,
  ForeignKey,
  Table,
  BelongsTo,
} from "sequelize-typescript";

import { BaseModel } from "../libraries/BaseModel";
import { Candidate } from "./Candidate";

@Table({
  tableName: "document",
})
export class Document extends BaseModel<Document> {
  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null,
  })
  name: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null,
  })
  description: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null,
  })
  type: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null,
  })
  path: string;

  @BelongsTo(() => Candidate, "candidateId")
  candidate: Candidate;
}
