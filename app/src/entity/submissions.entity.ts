import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";
import { User } from "./user.entity";
import { Challenge } from "./challenge.entity";
import { Team } from "./team.entity";

@Entity('submissions')
export class Submission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, (user) => user.submissions)
  user!: User;

  @ManyToOne(() => Challenge, (challenge) => challenge.submissions)
  challenge!: Challenge;

  @ManyToOne(() => Team, (team) => team.submissions, { nullable: true, onDelete: 'CASCADE' })
  team?: Team;

  @Column()
  isCorrect!: boolean;

  // Ushbu yechim uchun jamoaga berilgan ball (birinchi to'g'ri yechimda, aks holda 0)
  @Column({ type: 'int', default: 0 })
  pointsAwarded!: number;

  @CreateDateColumn({ type: "timestamptz" })
  submittedAt!: Date;

  @UpdateDateColumn({ type: "timestamptz" })
  updatedAt!: Date;
}