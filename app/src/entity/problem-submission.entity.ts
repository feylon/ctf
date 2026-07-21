// app/src/entity/problem-submission.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Problem } from './problem.entity';

@Entity('problem_submissions')
export class ProblemSubmission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @ManyToOne(() => Problem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'problemId' })
  problem!: Problem;

  @Column({ type: 'varchar', length: 50 })
  status!: string; 

  @Column({ type: 'boolean', default: false })
  isCorrect!: boolean;

  // Foydalanuvchi yuborgan javobni (flag) saqlash uchun
  @Column({ type: 'varchar', length: 255, nullable: true })
  submittedAnswer!: string; 

  @CreateDateColumn()
  submittedAt!: Date;
}