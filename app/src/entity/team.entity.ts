// src/entity/team.entity.ts
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
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

  // Jamoaga qo'shilish uchun taklif kodi (faqat a'zolarga ko'rinadi)
  @Column({ type: 'varchar', length: 16, unique: true, select: false })
  inviteCode!: string;

  // Jamoa sardori: a'zolarni chiqarish va taklif kodini yangilash huquqiga ega
  @ManyToOne(() => User, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'captainId' })
  captain?: User | null;

  @Column({ type: 'uuid', nullable: true })
  captainId?: string | null;


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