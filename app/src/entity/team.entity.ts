// src/entity/team.entity.ts
import { Column, CreateDateColumn, Entity, ManyToMany, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "./user.entity";
import { Submission } from "./submissions.entity";
import { ChallengeGroup } from "./challenge_groups.entity";

@Entity('teams')
export class Team {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  name!: string;

  @Column({ default: 0 })
  score!: number; // Jamoaning umumiy balli

  @OneToMany(() => User, (user) => user.team)
  members!: User[];


  @Column({ default: false })
  isBanned!: boolean;

  @OneToMany(() => Submission, (submission) => submission.team)
  submissions!: Submission[]; // Qaysi jamoa qaysi submissionni yuborgani

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;

  // src/entity/team.entity.ts ichiga qo'shiladi:
  @ManyToMany(() => ChallengeGroup, (group) => group.teams)
  challengeGroups!: ChallengeGroup[];
}