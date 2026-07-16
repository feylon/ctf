import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "./user.entity";
import { Challenge } from "./challenge.entity";

@Entity('submissions')
export class Submission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, (user) => user.submissions)
  user!: User;

  @ManyToOne(() => Challenge, (challenge) => challenge.submissions)
  challenge!: Challenge;

  @Column()
  isCorrect!: boolean;

  @CreateDateColumn({ type: "timestamptz" })
  submittedAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}