import { Column, DataType, HasMany, Table } from "sequelize-typescript";
import { BaseModel } from "../libraries/BaseModel";
import { States } from "./States";

@Table({
  tableName: "countries",
})
export class Countries extends BaseModel<Countries> {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
  })
  id: number;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null,
  })
  name: string;

  @HasMany(() => States)
  states: States[];
}
