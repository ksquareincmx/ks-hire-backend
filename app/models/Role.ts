import { Table, Column, DataType, HasMany } from "sequelize-typescript";
import { BaseModel } from "../libraries/BaseModel";
import { User } from "./User";
import LEVEL_PERMISSION from "../utils/LevelPermissions";

@Table({
  tableName: "role",
})
export class Role extends BaseModel<Role> {
  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null,
  })
  level: LEVEL_PERMISSION;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null,
  })
  description: string;

  @HasMany(() => User)
  users: User[];
}
