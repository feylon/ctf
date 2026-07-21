import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Submission } from "./submissions.entity";
import { Role } from "global/types"; // Import yo'lini tekshirib oling
import { Participation } from "./participations.entity";  // Participation ni import qiling
import { LoginHistory } from "./login-history.entity";
import { Team } from "./team.entity";

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: "varchar", nullable: true })
  fullName!: string;

  @Column({ unique: true })
  username!: string;

  @Column({ select: false })
  passwordHash!: string;

  @Column({ type: "varchar", unique: true })
  email!: string;

  @Column({ type: "boolean", default: true })
  isActive!: boolean;

  @Column({ type: "boolean", default: false }) // Odatda isDelete default false bo'ladi
  isDelete!: boolean;

  @Column({ type: 'enum', enum: Role, default: Role.USER })
  role!: Role;

  @Column({ default: 0 })
  score!: number;

  // Bitta user ko'plab vazifalarni yechishi mumkin
  @OneToMany(() => Submission, (submission) => submission.user)
  submissions!: Submission[];

  // Bitta user ko'plab musobaqalarda qatnasha oladi (Participation orqali)
  @OneToMany(() => Participation, (participation) => participation.user)
  participations!: Participation[];

    // src/entity/user.entity.ts ichiga qo'shiladi:
  @ManyToOne(() => Team, (team) => team.members, { nullable: true, onDelete: 'SET NULL' })
  team?: Team

  @OneToMany(() => LoginHistory, (history) => history.user)
  loginHistories!: LoginHistory[];

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}