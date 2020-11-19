import {
  Column,
  DataType,
  Table,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import { BaseModel } from "../libraries/BaseModel";
import { States } from "./States";

@Table({
  tableName: "cities",
})
export class Cities extends BaseModel<Cities> {
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

  @ForeignKey(() => States)
  state_id: number;

  @BelongsTo(() => States)
  states: States;
}
