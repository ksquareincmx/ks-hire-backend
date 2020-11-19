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
import { Candidate } from "./Candidate";
import { User } from "./User";

@Table({
  tableName: "notes",
})
export class Notes extends BaseModel<Notes> {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    allowNull: true,
  })
  id: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
    defaultValue: null,
  })
  note: string;

  @ForeignKey(() => Candidate)
  candidateId: string;

  @BelongsTo(() => Candidate)
  candidate: Candidate;

  @ForeignKey(() => User)
  userId: string;

  @BelongsTo(() => User)
  user: User;

  @BeforeCreate
  static addUUID(notes: Notes, _options: any) {
    notes.addUniqID();
  }

  addUniqID() {
    this.id = uuid();
  }
}
