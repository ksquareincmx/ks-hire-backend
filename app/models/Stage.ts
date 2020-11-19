import { Column, DataType, HasMany, Table } from "sequelize-typescript";
import { BaseModel } from "../libraries/BaseModel";
import { Candidate } from "./Candidate";

@Table({
  tableName: "stage",
})
export class Stage extends BaseModel<Stage> {
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
  details: string;

  @HasMany(() => Candidate)
  candidates: Candidate[];
}
