import { Column, DataType, HasMany, Table } from "sequelize-typescript";
import { BaseModel } from "../libraries/BaseModel";
import { Job } from "./Job";

@Table({
  tableName: "department",
})
export class Department extends BaseModel<Department> {
  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null,
  })
  name: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
    defaultValue: 0,
  })
  jobsCount: number;

  @HasMany(() => Job)
  jobs: Job[];
}
