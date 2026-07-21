// src/entity/challenge.entity.ts
import { Column, CreateDateColumn, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { Submission } from "./submissions.entity";
import { ChallengeGroup } from "./challenge_groups.entity";

@Entity('challenges')
export class Challenge {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column('text')
  description!: string;

  @Column({ select: false })
  flagHash!: string;

  @Column()
  points!: number;

  @Column()
  category!: string;

  @Column({ nullable: true })
  attachmentPath!: string;

  // --- YANGI QO'SHILGAN MAYDONLAR ---
  @Column({ type: "timestamptz", nullable: true })
  startTime!: Date; // Challenge ochilish vaqti

  @Column({ type: "timestamptz", nullable: true })
  endTime!: Date; // Challenge yopilish vaqti

  @Column({ nullable: true, default: '*' })
  allowedIpRange!: string; // Masalan: '*' (hamma uchun) yoki aniq IP / tarmoq (192.168.1.50 yoki 192.168.1.0/24)
  // ---------------------------------

  @OneToMany(() => Submission, (submission) => submission.challenge)
  submissions!: Submission[];

  @ManyToOne(() => ChallengeGroup, (group) => group.challenges)
  group!: ChallengeGroup;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;



  @Column({ default: 100 })
  initialPoints!: number; // Boshlang'ich ball

  @Column({ default: 10 })
  minPoints!: number; // Eng kam tushishi mumkin bo'lgan chegara ball (masalan, 10 dan pastga tushmaydi)

  @Column({ default: 10 })
  decrementStep!: number; // Har bir yechilganda qancha ballga kamayishi (masalan, 10 ball)
}