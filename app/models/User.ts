import * as bcrypt from "bcrypt";
import {
  BeforeBulkCreate,
  BeforeBulkUpdate,
  BelongsToMany,
  BeforeDestroy,
  BeforeCreate,
  BeforeUpdate,
  AfterCreate,
  ForeignKey,
  BelongsTo,
  DataType,
  HasMany,
  Column,
  HasOne,
  Table,
} from "sequelize-typescript";
import * as uuid from "uuid";

import { BaseModel } from "../libraries/BaseModel";
import { CandidateUser } from "./CandidateUser";
import { Notification } from "./Notification";
import { Candidate } from "./Candidate";
import { Feedback } from "./Feedback";
import { Profile } from "./Profile";
import { JobUser } from "./JobUser";
import { Notes } from "./Notes";
import { Role } from "./Role";
import { Job } from "./Job";
import { ProcessInterview } from "./ProcessInterview";
import { ProcessInterviewUser } from "./ProcessInterviewUser";

@Table({
  tableName: "user",
})
export class User extends BaseModel<User> {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    allowNull: true,
  })
  id: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  msId: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null,
  })
  firstName: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    defaultValue: null,
  })
  lastName: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  })
  email: string;

  @HasOne(() => Profile, {
    foreignKey: "profileId",
    hooks: true,
    onDelete: "CASCADE",
  })
  profile: Profile;

  @ForeignKey(() => Role)
  @Column
  roleId: number;

  @BelongsTo(() => Role)
  role: Role;

  @HasMany(() => Feedback)
  feedbacks: Feedback[];

  @HasMany(() => Notes)
  notes: Notes[];

  @HasMany(() => Notification)
  notifications: Notification[];

  @HasMany(() => Job)
  jobs: Job[];

  @BelongsToMany(() => Candidate, () => CandidateUser)
  candidates: Array<Candidate & { CandidateUser: CandidateUser }>;

  @BelongsToMany(() => Job, () => JobUser)
  jobsManager: Array<Job & { JobUser: JobUser }>;

  @BelongsToMany(() => ProcessInterview, () => ProcessInterviewUser)
  processInterview: Array<
    ProcessInterview & { ProcessInterviewUser: ProcessInterviewUser }
  >;

  @BeforeBulkCreate
  @BeforeBulkUpdate
  static activateIndividualHooks(items: User[], options: any) {
    options.individualHooks = true;
  }

  @BeforeCreate
  static addUUID(user: User, _options: any) {
    user.addUniqID();
  }

  // @BeforeCreate
  // static addPassword(user: User, _options: any) {
  //   return user.updatePassword();
  // }

  @AfterCreate
  static createProfile(user: User, _options: any) {
    return user.addProfile();
  }

  // @BeforeUpdate
  // static changePassword(user: User, _options: any) {
  //   if (user.changed("password")) {
  //     return user.updatePassword();
  //   }
  //   return Promise.resolve();
  // }

  @BeforeDestroy
  static deleteChilds(user: User, _options: any) {
    return Promise.all([
      Profile.destroy({ where: { profileId: user.id } }),
      Feedback.destroy({ where: { userId: user.id } }),
      Notes.destroy({ where: { userId: user.id } }),
      Notification.destroy({ where: { userId: user.id } }),
    ]);
  }

  addUniqID() {
    this.id = uuid();
  }

  // authenticate(password: string): Promise<boolean> {
  //   return bcrypt.compare(password, this.password);
  // }

  // hashPassword(password: string): Promise<string> {
  //   if (password == null || password.length < 6)
  //     throw new Error("Invalid password");
  //   return bcrypt.hash(password, 10);
  // }

  // updatePassword(): Promise<void> {
  //   return this.hashPassword(this.password).then((result) => {
  //     this.password = result;
  //     return null;
  //   });
  // }

  addProfile(): Promise<void> {
    return Promise.resolve(
      Profile.create({
        id: uuid(),
        time_zone: "America/Mexico_City",
        profileId: this.id,
        locale: "es", // Defaults, this should be changed in auth controller on register.
      }).then((result) => {
        return null;
      }),
    );
  }

  toJSON() {
    const object: any = super.toJSON();
    delete object.role;
    delete object.createdAt;
    delete object.updatedAt;
    return object;
  }
}
