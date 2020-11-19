import {
  Column,
  DataType,
  HasMany,
  Table,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import { BaseModel } from "../libraries/BaseModel";
import { Cities } from "./Cities";
import { Countries } from "./Countries";

@Table({
  tableName: "states",
})
export class States extends BaseModel<States> {
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

  @ForeignKey(() => Countries)
  country_id: number;

  @BelongsTo(() => Countries)
  countries: Countries;

  @HasMany(() => Cities)
  cities: Cities[];
}
