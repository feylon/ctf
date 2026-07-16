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

  @OneToMany(() => Submission, (submission) => submission.challenge)
  submissions!: Submission[];

  @ManyToOne(() => ChallengeGroup, (group) => group.challenges)
  group!: ChallengeGroup;

  @CreateDateColumn({ type: "timestamptz" })
  createdAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}