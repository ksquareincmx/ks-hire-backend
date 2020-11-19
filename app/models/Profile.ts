import {
  Table,
  Column,
  DataType,
  BelongsTo,
  ForeignKey,
  BeforeCreate,
} from "sequelize-typescript";
import * as uuid from "uuid";

import { BaseModel } from "../libraries/BaseModel";
import { User } from "./User";

@Table({
  tableName: "profile",
})
export class Profile extends BaseModel<Profile> {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    allowNull: false,
  })
  id: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null,
  })
  time_zone: string;

  @Column({
    type: DataType.ENUM("en", "es"),
    allowNull: true,
  })
  locale: "en" | "es";

  @BelongsTo(() => User, "profileId")
  user: User;

  @BeforeCreate
  static addUUID(profile: Profile, _options: any) {
    profile.addUniqID();
  }

  addUniqID() {
    this.id = uuid();
  }
}
